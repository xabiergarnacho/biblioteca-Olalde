'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export interface Book {
  id: number
  titulo: string
  nombre: string       // Nombre del autor
  apellido: string     // Apellido del autor
  genero: string | null
  tema: string | null
  recomendado: string | null
  calificacion: string | null
  codigo: string       // IMPORTANTE: Es string, no number
  editorial: string | null
  disponible: boolean  // true = se puede reservar
  zona: string | null  // Ej: "Sala de Estar", "Pequeños"
}

type BookRow = Book

type LoanRow = {
  id: string
  user_id: string
  book_id: string
  status: string
  liked: boolean | null
  book?: BookRow
}

export async function getActiveLoansCount(): Promise<number> {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return 0
  }

  const userId = session.user.id

  const { count, error } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")

  if (error) {
    console.error("Error contando préstamos activos:", error)
    return 0
  }

  return count ?? 0
}

export async function getActiveLoanWithBook(): Promise<{
  bookTitle: string
  bookAuthor: string
  zone: string | null
} | null> {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return null
  }

  const userId = session.user.id

  const { data, error } = await supabase
    .from("loans")
    .select(
      `
      book:books (
        titulo,
        nombre,
        apellido,
        zona
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<{ book: BookRow | null }>()

  if (error || !data || !data.book) {
    return null
  }

  const book = data.book
  return {
    bookTitle: book.titulo,
    bookAuthor: `${book.apellido}, ${book.nombre}`,
    zone: book.zona,
  }
}

export async function borrowBook(bookId: string | number) {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  const userId = session.user.id
  const bookIdNum = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId

  // Verificar que el usuario no tenga más de 1 préstamo activo
  const activeLoansCount = await getActiveLoansCount()
  if (activeLoansCount >= 1) {
    throw new Error("Solo puedes tener 1 libro prestado a la vez. Devuelve el actual para coger otro.")
  }

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookIdNum)
    .single<BookRow>()

  if (bookError || !book) {
    throw new Error("No se ha encontrado el libro seleccionado")
  }

  if (!book.disponible) {
    throw new Error("Este libro ya está prestado")
  }

  const { error: loanError } = await supabase.from("loans").insert({
    user_id: userId,
    book_id: bookIdNum,
    status: "active",
  })

  if (loanError) {
    throw new Error("No se ha podido registrar el préstamo")
  }

  const { error: updateError } = await supabase
    .from("books")
    .update({ disponible: false })
    .eq("id", bookIdNum)

  if (updateError) {
    throw new Error("No se ha podido actualizar el estado del libro")
  }

  revalidatePath("/")
}

export async function returnBook(loanId: string, liked: boolean | null = null) {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  // Verificar que el préstamo existe y pertenece al usuario
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .eq("user_id", session.user.id)
    .single<LoanRow>()

  if (loanError || !loan) {
    throw new Error("No se ha encontrado el préstamo")
  }

  // Si ya está devuelto, solo actualizar el liked si es necesario
  if (loan.status === "returned") {
    if (liked !== null && loan.liked !== liked) {
      const { error: updateLikedError } = await supabase
        .from("loans")
        .update({ liked: liked })
        .eq("id", loanId)

      if (updateLikedError) {
        throw new Error("No se ha podido actualizar la valoración")
      }
      revalidatePath("/mi-historial")
    }
    return // Ya está devuelto, no hacer nada más
  }

  // Actualizar el préstamo a devuelto
  const { error: updateLoanError } = await supabase
    .from("loans")
    .update({ 
      status: "returned",
      liked: liked,
    })
    .eq("id", loanId)
    .eq("status", "active") // Solo actualizar si aún está activo

  if (updateLoanError) {
    throw new Error("No se ha podido actualizar el préstamo")
  }

  // Liberar el libro
  const { error: updateBookError } = await supabase
    .from("books")
    .update({ disponible: true })
    .eq("id", loan.book_id)

  if (updateBookError) {
    throw new Error("No se ha podido actualizar el estado del libro")
  }

  revalidatePath("/")
  revalidatePath("/mis-prestamos")
  revalidatePath("/mi-historial")
}

export async function searchBooks(query: string): Promise<BookRow[]> {
  const supabase = await createClient()

  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  // Búsqueda "Fuzzy": Separar palabras y buscar coincidencias parciales
  const words = trimmed.split(/\s+/).filter(Boolean)
  
  // Construir query OR para cada palabra en cada campo
  // También buscamos el texto completo para mayor flexibilidad
  const orConditions: string[] = []
  
  // Búsqueda del texto completo
  orConditions.push(`titulo.ilike.%${trimmed}%`)
  orConditions.push(`nombre.ilike.%${trimmed}%`)
  orConditions.push(`apellido.ilike.%${trimmed}%`)
  orConditions.push(`codigo.ilike.%${trimmed}%`)
  
  // Búsqueda por palabras individuales (más flexible)
  words.forEach((word) => {
    if (word.length >= 2) { // Solo palabras de 2+ caracteres
      orConditions.push(`titulo.ilike.%${word}%`)
      orConditions.push(`nombre.ilike.%${word}%`)
      orConditions.push(`apellido.ilike.%${word}%`)
    }
  })

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .or(orConditions.join(","))
    .order("titulo", { ascending: true })
    .limit(50) // Limitar resultados para mejor rendimiento

  if (error) {
    throw new Error("No se ha podido buscar libros")
  }

  return (data ?? []) as BookRow[]
}

export async function getInitialBooks(): Promise<BookRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("titulo", { ascending: true })
    .range(0, 39) // Solo los primeros 40 libros

  if (error) {
    console.error("Error cargando libros iniciales:", error)
    return []
  }

  return (data ?? []) as BookRow[]
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect("/login")
}

export async function reportUnlistedBook(title: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  const { error } = await supabase.from("incidents").insert({
    type: "found_unlisted",
    details: title,
    user_id: user.id,
  })

  if (error) {
    throw new Error("No se ha podido registrar la incidencia")
  }

  revalidatePath("/")
}

export async function reportMissingBook(loanId: string, bookId: number) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  // Insertar incidencia
  const { error: incidentError } = await supabase.from("incidents").insert({
    type: "missing_book",
    book_id: bookId,
    user_id: user.id,
    status: "pending",
  })

  if (incidentError) {
    throw new Error("No se ha podido registrar la incidencia")
  }

  // Cancelar el préstamo (borrar la fila)
  const { error: deleteError } = await supabase
    .from("loans")
    .delete()
    .eq("id", loanId)

  if (deleteError) {
    throw new Error("No se ha podido cancelar el préstamo")
  }

  // Liberar el libro
  const { error: updateError } = await supabase
    .from("books")
    .update({ disponible: true })
    .eq("id", bookId)

  if (updateError) {
    console.error("Error actualizando libro:", updateError)
    // No lanzamos error aquí porque la incidencia ya se registró
  }

  revalidatePath("/")
  revalidatePath("/mis-prestamos")
}

export async function reportMissingBookFromDetail(bookId: number) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  // Insertar incidencia (sin préstamo activo)
  const { error: incidentError } = await supabase.from("incidents").insert({
    type: "missing_book",
    book_id: bookId,
    user_id: user.id,
    status: "pending",
  })

  if (incidentError) {
    throw new Error("No se ha podido registrar la incidencia")
  }

  revalidatePath("/")
  revalidatePath(`/libro/${bookId}`)
}


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
  returned_at: string | null
  book?: BookRow
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

export async function returnBook(loanId: string) {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .is("returned_at", null)
    .single<LoanRow>()

  if (loanError || !loan) {
    throw new Error("No se ha encontrado el préstamo activo")
  }

  const now = new Date().toISOString()

  const { error: updateLoanError } = await supabase
    .from("loans")
    .update({ returned_at: now })
    .eq("id", loanId)

  if (updateLoanError) {
    throw new Error("No se ha podido actualizar el préstamo")
  }

  const { error: updateBookError } = await supabase
    .from("books")
    .update({ disponible: true })
    .eq("id", loan.book_id)

  if (updateBookError) {
    throw new Error("No se ha podido actualizar el estado del libro")
  }

  revalidatePath("/")
}

export async function searchBooks(query: string): Promise<BookRow[]> {
  const supabase = await createClient()

  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .or(
      `titulo.ilike.%${trimmed}%,nombre.ilike.%${trimmed}%,apellido.ilike.%${trimmed}%`
    )
    .order("titulo", { ascending: true })

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


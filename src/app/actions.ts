'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type BookRow = {
  id: string
  title: string
  author: string
  is_available: boolean
  zone?: string | null
  shelf?: string | null
  location_zone?: string | null
  location_shelf?: string | null
}

type LoanRow = {
  id: string
  user_id: string
  book_id: string
  returned_at: string | null
  book?: BookRow
}

export async function borrowBook(bookId: string) {
  const supabase = await createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error("No se ha podido obtener la sesión del usuario")
  }

  const userId = session.user.id

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single<BookRow>()

  if (bookError || !book) {
    throw new Error("No se ha encontrado el libro seleccionado")
  }

  if (!book.is_available) {
    throw new Error("Este libro ya está prestado")
  }

  const { error: loanError } = await supabase.from("loans").insert({
    user_id: userId,
    book_id: bookId,
  })

  if (loanError) {
    throw new Error("No se ha podido registrar el préstamo")
  }

  const { error: updateError } = await supabase
    .from("books")
    .update({ is_available: false })
    .eq("id", bookId)

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
    .update({ is_available: true })
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
      `title.ilike.%${trimmed}%,author.ilike.%${trimmed}%`
    )
    .order("title", { ascending: true })

  if (error) {
    throw new Error("No se ha podido buscar libros")
  }

  return (data ?? []) as BookRow[]
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect("/login")
}


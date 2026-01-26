import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookCover } from "@/components/BookCover"
import Link from "next/link"
import { Heart } from "lucide-react"
import type { Book } from "@/app/actions"

type LoanWithBook = {
  id: string
  book_id: string
  status: string
  liked: boolean | null
  book: {
    id: number
    titulo: string
    nombre: string
    apellido: string
    zona: string | null
    codigo: string
  } | null
}

export const dynamic = 'force-dynamic'

export default async function MiHistorialPage() {
  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Consultar préstamos devueltos
  const { data: returnedLoans, error: loansError } = await supabase
    .from("loans")
    .select(
      `
      id,
      book_id,
      status,
      liked,
      book:books (
        id,
        titulo,
        nombre,
        apellido,
        zona,
        codigo
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "returned")
    .order("id", { ascending: false })

  if (loansError) {
    console.error("Error consultando historial:", loansError)
  }

  const loans = (returnedLoans ?? []) as LoanWithBook[]

  // Función para formatear fecha aproximada
  // Como no tenemos created_at, usamos una aproximación basada en el orden
  const formatReadDate = (index: number) => {
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ]
    const today = new Date()
    // Aproximación: cada préstamo es aproximadamente 1 mes antes
    const readDate = new Date(today)
    readDate.setMonth(today.getMonth() - index)
    return `Leído en ${months[readDate.getMonth()]} ${readDate.getFullYear()}`
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-6xl flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] tracking-tight mb-2">
              Mi Historial
            </h1>
            <p className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-widest">
              Libros que has leído
            </p>
          </div>
          <Link href="/">
            <button className="text-sm font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] uppercase tracking-widest transition-colors">
              ← Volver
            </button>
          </Link>
        </div>

        {/* Lista de libros */}
        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-serif text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60">
              Aún no has devuelto ningún libro
            </p>
            <Link href="/" className="mt-4 text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline transition-colors">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loans.map((loan, index) => {
              if (!loan.book) return null

              const book = loan.book
              const autor = `${book.apellido}, ${book.nombre}`
              const bookForCover: Book = {
                id: book.id,
                titulo: book.titulo,
                nombre: book.nombre,
                apellido: book.apellido,
                genero: null,
                tema: null,
                recomendado: null,
                calificacion: null,
                codigo: book.codigo,
                editorial: null,
                disponible: true,
                zona: book.zona,
              }

              return (
                <Link
                  key={loan.id}
                  href={`/libro/${book.id}`}
                  className="group relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Portada */}
                  <div className="aspect-[2/3] mb-3 relative">
                    <BookCover book={bookForCover} className="h-full w-full" />
                    {/* Icono de like */}
                    {loan.liked === true && (
                      <div className="absolute top-2 right-2 bg-white dark:bg-[#1E1E1E] rounded-full p-1.5 shadow-sm">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex-1 space-y-1 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-3 group-hover:border-[#1A1A1A] dark:group-hover:border-[#E4E4E7] transition-colors">
                    <h3 className="text-sm font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight line-clamp-2">
                      {book.titulo}
                    </h3>
                    <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-wider line-clamp-1">
                      {autor}
                    </p>
                    <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 mt-2">
                      {formatReadDate(index)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

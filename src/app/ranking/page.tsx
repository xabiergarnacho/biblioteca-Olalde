import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookCover } from "@/components/BookCover"
import Link from "next/link"
import { Heart } from "lucide-react"
import type { Book } from "@/app/actions"

type RankingBook = Book & {
  likes_count: number
}

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Consultar libros del ranking
  const { data: rankingBooks, error: rankingError } = await supabase
    .from("ranking_books")
    .select("*")
    .limit(20)
    .order("likes_count", { ascending: false })

  if (rankingError) {
    console.error("Error consultando ranking:", rankingError)
  }

  const books: RankingBook[] = (rankingBooks ?? []) as RankingBook[]

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-6xl flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] tracking-tight mb-2">
              Los Favoritos de la Comunidad
            </h1>
            <p className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-widest">
              Los libros más queridos por nuestros lectores
            </p>
          </div>
          <Link href="/">
            <button className="text-sm font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] uppercase tracking-widest transition-colors">
              ← Volver
            </button>
          </Link>
        </div>

        {/* Lista de libros */}
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-serif text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60">
              Aún no hay libros con likes
            </p>
            <Link href="/" className="mt-4 text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline transition-colors">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book, index) => {
              const autor = `${book.apellido}, ${book.nombre}`

              return (
                <Link
                  key={book.id}
                  href={`/libro/${book.id}`}
                  className="group relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    animationDelay: `${index * 0.03}s`,
                  }}
                >
                  {/* Portada */}
                  <div className="aspect-2/3 mb-4 relative">
                    <BookCover book={book} className="h-full w-full" />
                    {/* Badge de likes */}
                    {book.likes_count > 0 && (
                      <div className="absolute top-2 right-2 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                        <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                        <span className="text-xs font-sans font-medium text-[#1A1A1A] dark:text-[#E4E4E7]">
                          {book.likes_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del libro */}
                  <div className="flex-1 space-y-2 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4 group-hover:border-[#1A1A1A] dark:group-hover:border-[#E4E4E7] transition-colors">
                    {/* Título */}
                    <h3 className="text-lg font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight">
                      {book.titulo}
                    </h3>

                    {/* Autor */}
                    <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-wider">
                      {autor}
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

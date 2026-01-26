import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookCover } from "@/components/BookCover"
import { ReserveBookButton } from "@/components/ReserveBookButton"
import { ReportMissingBookDetailButton } from "@/components/ReportMissingBookDetailButton"
import { BookSynopsis } from "@/components/BookSynopsis"
import Link from "next/link"
import type { Book } from "@/app/actions"

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params
  const bookId = parseInt(id, 10)

  if (isNaN(bookId)) {
    notFound()
  }

  // Verificar autenticación
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Consultar libro por ID (incluyendo codigo)
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single<Book>()

  if (bookError || !book) {
    notFound()
  }

  const autor = `${book.apellido}, ${book.nombre}`
  const zona = book.zona ?? "General"

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        {/* Botón volver */}
        <div>
          <Link href="/">
            <button className="text-sm font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] uppercase tracking-widest transition-colors">
              ← Volver al buscador
            </button>
          </Link>
        </div>

        {/* Contenedor principal: Portada + Información */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Izquierda: Portada Grande */}
            <div className="shrink-0 w-full md:w-80">
              <div className="aspect-[2/3] w-full">
                <BookCover book={book} className="h-full w-full" />
              </div>
            </div>

            {/* Derecha: Información crítica */}
            <div className="flex-1 space-y-6">
              {/* Título */}
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight mb-2">
                  {book.titulo}
                </h1>
                <h2 className="text-lg font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 uppercase tracking-wider">
                  {autor}
                </h2>
              </div>

              {/* Código del Libro - Muy visible */}
              <div className="pt-4 border-t border-[#E5E5E5] dark:border-zinc-800">
                <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                  Código de Referencia
                </p>
                <p className="text-3xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7] mb-2">
                  {book.codigo}
                </p>
                <p className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50">
                  Busca este código en la etiqueta del libro
                </p>
              </div>

              {/* Ubicación - Badge destacado */}
              <div className="pt-4 border-t border-[#E5E5E5] dark:border-zinc-800">
                <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-3">
                  Ubicación
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] dark:bg-[#E4E4E7] text-white dark:text-[#1A1A1A] rounded-sm">
                  <span className="text-sm font-mono font-bold">
                    {zona.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-sans uppercase tracking-wider">
                    {zona}
                  </span>
                </div>
              </div>

              {/* Estado de Disponibilidad */}
              <div className="pt-4 border-t border-[#E5E5E5] dark:border-zinc-800">
                {!book.disponible ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">
                      No disponible
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">
                      Disponible
                    </span>
                  </div>
                )}
              </div>

              {/* Sinopsis desde Google Books */}
              <BookSynopsis titulo={book.titulo} autor={autor} />

              {/* Botones de Acción */}
              <div className="pt-6 space-y-3">
                {book.disponible ? (
                  <ReserveBookButton bookId={book.id} />
                ) : (
                  <div className="w-full h-12 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-[#1A1A1A]/30 dark:text-[#E4E4E7]/30 border border-[#E5E5E5] dark:border-zinc-800 rounded-sm cursor-not-allowed">
                    <span className="text-sm font-sans uppercase tracking-widest">
                      No disponible para préstamo
                    </span>
                  </div>
                )}

                {/* Botón secundario: Reportar libro faltante */}
                <ReportMissingBookDetailButton bookId={book.id} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

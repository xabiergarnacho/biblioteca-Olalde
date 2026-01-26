'use client'

import { useState, useTransition, FormEvent, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, Loader2, BookOpen, X } from "lucide-react"
import { toast } from "sonner"

import { searchBooks, type Book, reportUnlistedBook } from "@/app/actions"
import { BookCover } from "./BookCover"
import { Input } from "./ui/input"

type BookSearchProps = {
  initialBooks?: Book[]
}

export function BookSearch({ initialBooks = [] }: BookSearchProps) {
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [isSearching, startSearching] = useTransition()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showUnlistedModal, setShowUnlistedModal] = useState(false)
  const [unlistedTitle, setUnlistedTitle] = useState("")
  const [isReporting, setIsReporting] = useState(false)

  // Cargar libros iniciales si no hay búsqueda
  useEffect(() => {
    if (!hasSearched && initialBooks.length > 0) {
      setBooks(initialBooks)
    }
  }, [initialBooks, hasSearched])

  // Debounce para la búsqueda (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim()) {
      if (hasSearched) {
        setBooks(initialBooks)
        setHasSearched(false)
      }
      return
    }

    setHasSearched(true)

    debounceTimerRef.current = setTimeout(() => {
      startSearching(async () => {
        try {
          const result = await searchBooks(query.trim())
          setBooks(result)
        } catch (err) {
          console.error(err)
          toast.error("Ha ocurrido un error al buscar libros")
          setBooks([])
        }
      })
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, initialBooks, hasSearched])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleReportUnlisted = async () => {
    if (!unlistedTitle.trim()) {
      toast.error("Por favor, introduce el título del libro")
      return
    }

    setIsReporting(true)
    try {
      await reportUnlistedBook(unlistedTitle.trim())
      toast.success("Gracias. El administrador revisará este libro.")
      setShowUnlistedModal(false)
      setUnlistedTitle("")
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : "No se ha podido registrar el reporte"
      toast.error(message)
    } finally {
      setIsReporting(false)
    }
  }

  const hasResults = books.length > 0
  const hasQuery = query.trim().length > 0
  const showFeatured = !hasSearched && !hasQuery && initialBooks.length > 0

  return (
    <div className="flex w-full max-w-6xl flex-col gap-12">
      {/* Hero Section - Minimalista Centrado */}
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-6xl font-serif font-normal text-[#1A1A1A] dark:text-[#F4F4F5] tracking-tight">
          Biblioteca Olalde
        </h1>
        <p className="text-xs font-sans uppercase tracking-widest text-[#1A1A1A]/60 dark:text-[#F4F4F5]/60">
          Explora el catálogo
        </p>
      </div>

      {/* Input Minimalista - Línea simple */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-[#1A1A1A] dark:border-[#F4F4F5] pb-3 pr-10 text-[#1A1A1A] dark:text-[#F4F4F5] placeholder:text-[#1A1A1A]/40 dark:placeholder:text-[#F4F4F5]/40 focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F4F4F5] transition-colors"
            autoFocus
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#1A1A1A]/40 dark:text-[#F4F4F5]/40" />
            ) : (
              <Search className="h-5 w-5 text-[#1A1A1A]/40 dark:text-[#F4F4F5]/40" />
            )}
          </div>
        </div>
      </form>

      {/* Título de sección */}
      {showFeatured && (
        <h2 className="text-xl font-serif font-normal text-[#1A1A1A] dark:text-[#F4F4F5] tracking-tight">
          Colección Destacada
        </h2>
      )}

      {hasSearched && hasQuery && !hasResults && !isSearching && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-[#E5E5E5]" />
          <p className="text-base font-serif text-[#1A1A1A]/60">
            No encontramos ese libro
          </p>
        </div>
      )}

      {/* Resultados - Tarjetas Tipográficas Verticales (ratio 2:3) */}
      {hasResults && (
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
                {/* Portada Híbrida - Aspect ratio 2:3 estricto */}
                <div className="aspect-[2/3] mb-4">
                  <BookCover book={book} className="h-full w-full" />
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

      {/* Enlace para reportar libro no listado */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowUnlistedModal(true)}
          className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline transition-colors"
        >
          ¿Tienes un libro físico que no aparece aquí?
        </button>
      </div>

      {/* Modal para reportar libro no listado */}
      {showUnlistedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7]">
                Reportar libro no listado
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowUnlistedModal(false)
                  setUnlistedTitle("")
                }}
                className="text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-[#1A1A1A] dark:text-[#E4E4E7] mb-2">
                  Título del libro
                </label>
                <Input
                  type="text"
                  value={unlistedTitle}
                  onChange={(e) => setUnlistedTitle(e.target.value)}
                  placeholder="Introduce el título completo"
                  className="w-full bg-white dark:bg-[#1E1E1E] border-[#E5E5E5] dark:border-zinc-800 text-[#1A1A1A] dark:text-[#E4E4E7]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleReportUnlisted()
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReportUnlisted}
                  disabled={isReporting || !unlistedTitle.trim()}
                  className="flex-1 h-12 bg-[#1A1A1A] text-white font-sans text-sm uppercase tracking-widest hover:bg-[#1A1A1A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
                >
                  {isReporting ? "Enviando..." : "Enviar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlistedModal(false)
                    setUnlistedTitle("")
                  }}
                  disabled={isReporting}
                  className="flex-1 h-12 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 text-[#1A1A1A] dark:text-[#E4E4E7] font-sans text-sm uppercase tracking-widest hover:border-[#1A1A1A] dark:hover:border-[#E4E4E7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

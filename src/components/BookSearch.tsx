'use client'

import { useState, useTransition, FormEvent } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { borrowBook, searchBooks } from "@/app/actions"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

type Book = {
  id: string
  title: string
  author: string
  is_available: boolean
  zone?: string | null
  shelf?: string | null
  location_zone?: string | null
  location_shelf?: string | null
}

type BookSearchProps = {
  initialBooks?: Book[]
}

export function BookSearch({ initialBooks = [] }: BookSearchProps) {
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, startSearching] = useTransition()
  const [isBorrowingId, setIsBorrowingId] = useState<string | null>(null)

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const value = query.trim()
    if (!value) {
      setBooks(initialBooks)
      return
    }

    startSearching(async () => {
      try {
        const result = await searchBooks(value)
        setBooks(result)
      } catch (err) {
        console.error(err)
        setError("Ha ocurrido un error al buscar libros")
      }
    })
  }

  const handleBorrow = (bookId: string) => {
    setError(null)
    setIsBorrowingId(bookId)

    // Optimistic: marcamos como no disponible mientras se completa la action
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, is_available: false } : book
      )
    )

    void borrowBook(bookId)
      .then(() => {
        toast.success("¡Disfruta el libro! Tienes 15 días.")
      })
      .catch((err) => {
        console.error(err)
        const message =
          err instanceof Error
            ? err.message
            : "No se ha podido registrar el préstamo"

        setError(message)
        toast.error(message)

        // Revertimos el estado optimista si ha fallado
        setBooks((prev) =>
          prev.map((book) =>
            book.id === bookId ? { ...book, is_available: true } : book
          )
        )
      })
      .finally(() => {
        setIsBorrowingId(null)
      })
  }

  const hasResults = books.length > 0

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <form
        onSubmit={handleSearch}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Busca por título o autor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full rounded-2xl border-slate-200 bg-white pl-12 pr-4 text-base shadow-lg shadow-slate-200/50 transition-shadow focus-visible:shadow-xl focus-visible:shadow-slate-300/50"
          />
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!hasResults && !isSearching && query && (
        <div className="py-12 text-center">
          <p className="text-base text-slate-500">
            No se encontraron resultados para "{query}"
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Prueba con otro término de búsqueda
          </p>
        </div>
      )}

      {!query && !hasResults && (
        <div className="py-12 text-center">
          <p className="text-base text-slate-500">
            Escribe en el buscador para encontrar libros disponibles
          </p>
        </div>
      )}

      {hasResults && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const zone = book.zone ?? book.location_zone ?? "Zona desconocida"
          const shelf = book.shelf ?? book.location_shelf ?? "Balda desconocida"
          const isBorrowing = isBorrowingId === book.id

          // Generar gradiente único basado en el título
          const gradients = [
            "bg-gradient-to-br from-blue-50 to-indigo-100",
            "bg-gradient-to-br from-purple-50 to-pink-100",
            "bg-gradient-to-br from-amber-50 to-orange-100",
            "bg-gradient-to-br from-emerald-50 to-teal-100",
            "bg-gradient-to-br from-rose-50 to-red-100",
            "bg-gradient-to-br from-violet-50 to-purple-100",
          ]
          const gradientIndex = book.title.length % gradients.length
          const gradient = gradients[gradientIndex]
          
          // Iniciales del autor o título
          const initials = book.author
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase() || book.title.slice(0, 2).toUpperCase()

          return (
            <Card
              key={book.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Placeholder de portada */}
              <div className={`h-32 w-full ${gradient} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-slate-600/60">
                  {initials}
                </span>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg font-semibold text-slate-900">
                  {book.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                <p className="text-sm font-medium text-slate-600">
                  {book.author}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium">{zone}</span> · <span className="font-medium">{shelf}</span>
                </p>
                <Button
                  type="button"
                  className="mt-auto w-full"
                  disabled={!book.is_available || isBorrowing}
                  onClick={() => handleBorrow(book.id)}
                >
                  {!book.is_available
                    ? "No disponible"
                    : isBorrowing
                      ? "Cogiendo libro..."
                      : "Coger libro"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}


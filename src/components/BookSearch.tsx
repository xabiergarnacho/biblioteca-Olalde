'use client'

import { useState, useTransition, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { borrowBook, searchBooks, getActiveLoanWithBook, type Book } from "@/app/actions"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { ReadingEncouragement } from "./ReadingEncouragement"

type BookSearchProps = {
  initialBooks?: Book[]
}

export function BookSearch({ initialBooks = [] }: BookSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [isSearching, startSearching] = useTransition()
  const [isReserving, setIsReserving] = useState<number | null>(null)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [currentLoanInfo, setCurrentLoanInfo] = useState<{
    bookTitle: string
    bookAuthor: string
    zone: string | null
  } | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce para la búsqueda (400ms)
  useEffect(() => {
    // Limpiar el timer anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Si el query está vacío, restaurar libros iniciales
    if (!query.trim()) {
      setBooks(initialBooks)
      return
    }

    // Configurar nuevo timer
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
    }, 400)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, initialBooks])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // El debounce ya maneja la búsqueda, solo prevenimos el submit
  }

  const handleReserve = async (book: Book) => {
    if (!book.disponible || isReserving === book.id) {
      return
    }

    setIsReserving(book.id)

    try {
      // Optimistic update: marcamos como no disponible visualmente
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id ? { ...b, disponible: false } : b
        )
      )

      // Intentar reservar (la verificación del límite se hace dentro de borrowBook)
      await borrowBook(book.id)

      // Éxito
      toast.success("¡Libro reservado! Disfruta de la lectura.")

      // Esperar 1 segundo y redirigir a la home donde se verá el préstamo activo
      setTimeout(() => {
        router.push("/")
        router.refresh() // Forzar recarga para mostrar el préstamo activo
      }, 1000)
    } catch (err) {
      console.error(err)
      
      const message =
        err instanceof Error
          ? err.message
          : "No se ha podido registrar el préstamo"

      // Si es el error de límite alcanzado, mostrar el componente bonito
      if (message.includes("Solo puedes tener 1 libro prestado")) {
        try {
          const loanInfo = await getActiveLoanWithBook()
          if (loanInfo) {
            setCurrentLoanInfo(loanInfo)
            setShowEncouragement(true)
            // Scroll suave hacia arriba para mostrar el componente
            window.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            toast.error(message)
          }
        } catch {
          toast.error(message)
        }
      } else {
        // Mostrar error con toast para otros errores
        toast.error(message)
      }

      // Revertir el estado optimista
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id ? { ...b, disponible: true } : b
        )
      )
    } finally {
      setIsReserving(null)
    }
  }

  const hasResults = books.length > 0
  const hasQuery = query.trim().length > 0

  // Si se debe mostrar el componente de animación, mostrarlo primero
  if (showEncouragement && currentLoanInfo) {
    return (
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <ReadingEncouragement
          currentBookTitle={currentLoanInfo.bookTitle}
          currentBookAuthor={currentLoanInfo.bookAuthor}
          zone={currentLoanInfo.zone}
        />
        <div className="mt-8 pt-8 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => setShowEncouragement(false)}
            className="w-full"
          >
            Continuar buscando
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Busca por título, autor o código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full rounded-2xl border-slate-200 bg-white py-4 pl-12 pr-4 text-base shadow-2xl shadow-blue-900/10 transition-all duration-200 focus-visible:scale-[1.02] focus-visible:shadow-2xl focus-visible:shadow-blue-900/20"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </form>

      {!hasResults && !isSearching && hasQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-24 w-24 text-gray-200" />
          <p className="text-base text-slate-500">
            No se encontraron resultados para "{query}"
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Prueba con otro término de búsqueda
          </p>
        </div>
      )}

      {!hasQuery && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-24 w-24 text-gray-200" />
          <p className="text-base text-slate-500">
            La biblioteca te espera. Empieza a escribir.
          </p>
        </div>
      )}

      {hasResults && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const isReservingThis = isReserving === book.id
            const autor = `${book.apellido}, ${book.nombre}`
            const zona = book.zona ?? "General"

            // Generar gradiente único basado en el título
            const gradients = [
              "bg-gradient-to-br from-blue-50 to-indigo-100",
              "bg-gradient-to-br from-purple-50 to-pink-100",
              "bg-gradient-to-br from-amber-50 to-orange-100",
              "bg-gradient-to-br from-emerald-50 to-teal-100",
              "bg-gradient-to-br from-rose-50 to-red-100",
              "bg-gradient-to-br from-violet-50 to-purple-100",
            ]
            const gradientIndex = book.titulo.length % gradients.length
            const gradient = gradients[gradientIndex]

            // Iniciales del autor o título
            const initials =
              (book.apellido?.[0] || "") + (book.nombre?.[0] || "") ||
              book.titulo.slice(0, 2).toUpperCase()

            return (
              <Card
                key={book.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Badge de Zona en esquina superior derecha */}
                {zona && (
                  <div className="absolute right-3 top-3 z-10">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-600 backdrop-blur-sm">
                      {zona}
                    </span>
                  </div>
                )}

                {/* Placeholder de portada */}
                <div
                  className={`h-32 w-full ${gradient} flex items-center justify-center`}
                >
                  <span className="text-2xl font-bold text-slate-600/60">
                    {initials.toUpperCase()}
                  </span>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2 text-lg font-semibold text-slate-900 pr-16">
                    {book.titulo}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                  <p className="text-sm font-medium text-slate-600">{autor}</p>

                  <Button
                    type="button"
                    className="mt-auto w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!book.disponible || isReservingThis}
                    onClick={() => handleReserve(book)}
                  >
                    {!book.disponible ? (
                      "No disponible"
                    ) : isReservingThis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reservando...
                      </>
                    ) : (
                      "Reservar"
                    )}
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

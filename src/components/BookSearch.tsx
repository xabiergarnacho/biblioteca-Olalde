'use client'

import { useState, useTransition, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { borrowBook, searchBooks, getActiveLoanWithBook, type Book } from "@/app/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ReadingEncouragement } from "./ReadingEncouragement"

type BookSearchProps = {
  initialBooks?: Book[]
}

// Función para generar gradiente basado en género
function getGradientByGenre(genero: string | null): string {
  if (!genero) {
    return "bg-gradient-to-br from-slate-400 to-slate-600"
  }

  const generoLower = genero.toLowerCase()
  
  const genreGradients: Record<string, string> = {
    misterio: "bg-gradient-to-br from-slate-900 to-slate-700",
    thriller: "bg-gradient-to-br from-red-900 to-red-700",
    romance: "bg-gradient-to-br from-pink-600 to-rose-500",
    ciencia: "bg-gradient-to-br from-blue-600 to-indigo-700",
    ficción: "bg-gradient-to-br from-purple-600 to-violet-700",
    historia: "bg-gradient-to-br from-amber-700 to-orange-600",
    biografía: "bg-gradient-to-br from-emerald-700 to-teal-600",
    aventura: "bg-gradient-to-br from-green-700 to-emerald-600",
    drama: "bg-gradient-to-br from-gray-700 to-slate-600",
    comedia: "bg-gradient-to-br from-yellow-600 to-amber-500",
  }

  // Buscar coincidencias parciales
  for (const [key, gradient] of Object.entries(genreGradients)) {
    if (generoLower.includes(key)) {
      return gradient
    }
  }

  // Gradiente por defecto basado en hash del género
  const gradients = [
    "bg-gradient-to-br from-blue-600 to-indigo-700",
    "bg-gradient-to-br from-purple-600 to-violet-700",
    "bg-gradient-to-br from-pink-600 to-rose-500",
    "bg-gradient-to-br from-emerald-700 to-teal-600",
    "bg-gradient-to-br from-amber-700 to-orange-600",
    "bg-gradient-to-br from-slate-700 to-gray-600",
  ]
  
  const index = generoLower.length % gradients.length
  return gradients[index]
}

export function BookSearch({ initialBooks = [] }: BookSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [isSearching, startSearching] = useTransition()
  const [isReserving, setIsReserving] = useState<number | null>(null)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [currentLoanInfo, setCurrentLoanInfo] = useState<{
    bookTitle: string
    bookAuthor: string
    zone: string | null
  } | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Función helper para verificar préstamos activos (Zero-Trust)
  const checkActiveLoans = async (): Promise<{ id: string }[]> => {
    try {
      const supabase = createClient()
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        return []
      }

      const userId = session.user.id

      const { data, error } = await supabase
        .from("loans")
        .select("id")
        .eq("user_id", userId)
        .is("returned_at", null)

      if (error) {
        console.error("Error consultando préstamos activos:", error)
        return []
      }

      return data ?? []
    } catch (err) {
      console.error("Error en checkActiveLoans:", err)
      return []
    }
  }

  // Debounce para la búsqueda (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim()) {
      setBooks([])
      setHasSearched(false)
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
  }, [query])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleReserve = async (book: Book) => {
    if (!book.disponible || isReserving === book.id) {
      return
    }

    const supabase = createClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      toast.error("No se ha podido obtener la sesión del usuario")
      return
    }

    const userId = session.user.id

    // Verificación bloqueante
    const { data: activeLoans, error: checkError } = await supabase
      .from("loans")
      .select("id")
      .eq("user_id", userId)
      .is("returned_at", null)

    if (checkError) {
      console.error("Error verificando préstamos activos:", checkError)
      toast.error("Error al verificar préstamos activos")
      return
    }

    if (activeLoans && activeLoans.length >= 1) {
      toast.error("Ya tienes un libro. Devuélvelo primero.")
      router.push("/mis-prestamos")
      return
    }

    setIsReserving(book.id)

    let loanId: string | null = null

    try {
      const { data: newLoan, error: loanError } = await supabase
        .from("loans")
        .insert({
          user_id: userId,
          book_id: book.id,
        })
        .select("id")
        .single()

      if (loanError || !newLoan) {
        throw new Error("No se ha podido registrar el préstamo")
      }

      loanId = newLoan.id

      const { error: updateError } = await supabase
        .from("books")
        .update({ disponible: false })
        .eq("id", book.id)

      if (updateError) {
        if (loanId) {
          await supabase.from("loans").delete().eq("id", loanId)
        }
        throw new Error("No se ha podido actualizar el estado del libro")
      }

      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.id === book.id ? { ...b, disponible: false } : b
        )
      )

      toast.success("Libro reservado correctamente")
      router.push("/mis-prestamos")
    } catch (err) {
      console.error(err)

      const message =
        err instanceof Error
          ? err.message
          : "No se ha podido registrar el préstamo"

      toast.error(message)
    } finally {
      setIsReserving(null)
    }
  }

  const hasResults = books.length > 0
  const hasQuery = query.trim().length > 0
  const showHeroSearch = !hasSearched && !hasQuery

  // Si se debe mostrar el componente de animación
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
    <div className="flex w-full max-w-6xl flex-col gap-8">
      {/* Hero Search - Centrado cuando no hay búsqueda */}
      <div
        className={`transition-all duration-500 ${
          showHeroSearch
            ? "flex flex-col items-center justify-center min-h-[60vh] gap-8"
            : "pt-4"
        }`}
      >
        {showHeroSearch && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black">
                Biblioteca
              </h1>
              <Image
                src="/logo-olalde.svg"
                alt="Logotipo Olalde"
                width={200}
                height={80}
                className="mt-2"
                priority
              />
            </div>
            <p className="text-lg text-slate-500 font-normal">
              Busca tu próximo libro favorito
            </p>
          </div>
        )}

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Busca por título, autor o código..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`h-14 w-full rounded-2xl border-slate-200 bg-white py-4 pl-12 pr-4 text-base shadow-2xl shadow-blue-900/10 transition-all duration-200 focus-visible:scale-[1.02] focus-visible:shadow-2xl focus-visible:shadow-blue-900/20 ${
                showHeroSearch ? "text-lg" : ""
              }`}
              autoFocus={showHeroSearch}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Estado vacío - Sin resultados */}
      {hasSearched && !hasResults && !isSearching && (
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

      {/* Resultados - Tarjetas horizontales con portadas generativas */}
      {hasResults && (
        <div className="grid gap-4">
          {books.map((book, index) => {
            const isReservingThis = isReserving === book.id
            const autor = `${book.apellido}, ${book.nombre}`
            const zona = book.zona ?? "General"
            const gradient = getGradientByGenre(book.genero)

            // Título cortado para la portada
            const titleWords = book.titulo.split(" ").slice(0, 3)
            const shortTitle = titleWords.join(" ")

            return (
              <div
                key={book.id}
                className="group relative flex flex-row gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Portada Generativa */}
                <div
                  className={`relative h-32 w-24 flex-shrink-0 ${gradient} rounded-lg flex items-center justify-center shadow-md overflow-hidden`}
                >
                  {/* Efecto de textura/ruido sutil */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.3)_1px,transparent_0)] [background-size:20px_20px]" />
                  
                  {/* Título en la portada con tipografía Serif */}
                  <span
                    className="relative z-10 text-white font-serif font-bold text-sm text-center px-2 leading-tight"
                    style={{ fontFamily: 'Times, "Times New Roman", serif' }}
                  >
                    {shortTitle}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-1">
                      {book.titulo}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">{autor}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    {zona && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {zona}
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="mt-2 w-full sm:w-auto bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

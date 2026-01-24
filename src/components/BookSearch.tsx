'use client'

import { useState, useTransition, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Book as BookIcon, Loader2, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { searchBooks, type Book } from "@/app/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

type BookSearchProps = {
  initialBooks?: Book[]
}

// Función para obtener el color de la franja según la zona
function getZoneColor(zona: string | null): string {
  if (!zona) return "border-l-stone-300"
  
  const zonaLower = zona.toLowerCase()
  
  const zoneColors: Record<string, string> = {
    'sala de estar': 'border-l-amber-400',
    'pequeños': 'border-l-blue-300',
    'estudio mayores': 'border-l-slate-400',
    'zona juvenil': 'border-l-purple-300',
    'primera planta': 'border-l-emerald-300',
    'general': 'border-l-stone-300',
  }
  
  for (const [key, color] of Object.entries(zoneColors)) {
    if (zonaLower.includes(key)) {
      return color
    }
  }
  
  return "border-l-stone-300"
}

export function BookSearch({ initialBooks = [] }: BookSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [isSearching, startSearching] = useTransition()
  const [isReserving, setIsReserving] = useState<number | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

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

  const handleReserve = async (book: Book) => {
    if (!book.disponible || isReserving === book.id) {
      return
    }

    setIsReserving(book.id)

    const supabase = createClient()

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      toast.error("No se ha podido obtener la sesión del usuario")
      setIsReserving(null)
      return
    }

    const userId = session.user.id

    // 1. Debugging (Imprimir en consola para ver qué pasa)
    console.log("Verificando préstamos para usuario:", userId)

    // 2. Consulta EXPLÍCITA (Solo préstamos ACTIVOS)
    // Intentar primero con status='active', si no funciona usar returned_at is null
    let query = supabase
      .from("loans")
      .select("*")
      .eq("user_id", userId)

    // Intentar filtrar por status si existe, sino usar returned_at
    const { data: activeLoans, error: loanError } = await query
      .is("returned_at", null)

    if (loanError) {
      console.error("Error verificando préstamos activos:", loanError)
      toast.error("Error al verificar tus préstamos")
      setIsReserving(null)
      return
    }

    console.log("Préstamos activos encontrados:", activeLoans?.length ?? 0)
    if (activeLoans) {
      console.log("Detalles de préstamos:", activeLoans)
    }

    // 3. Condición Estricta
    // Solo bloquea si activeLoans existe Y tiene 1 o más elementos
    if (activeLoans && activeLoans.length > 0) {
      toast.error("Ya tienes un libro en préstamo. Debes devolverlo antes.")
      setIsReserving(null)
      return // Detener aquí
    }

    // Si pasa la verificación, proceder con la reserva
    let loanId: string | null = null

    try {
      // Paso A: Insertar préstamo
      const { data: newLoan, error: insertError } = await supabase
        .from("loans")
        .insert({
          user_id: userId,
          book_id: book.id,
        })
        .select("id")
        .single()

      if (insertError || !newLoan) {
        throw new Error("No se ha podido registrar el préstamo")
      }

      loanId = newLoan.id

      // Paso B: Actualizar libro (disponible: false)
      const { error: updateError } = await supabase
        .from("books")
        .update({ disponible: false })
        .eq("id", book.id)

      if (updateError) {
        // Rollback manual: eliminar el préstamo si falla la actualización
        if (loanId) {
          await supabase.from("loans").delete().eq("id", loanId)
        }
        throw new Error("No se ha podido actualizar el estado del libro")
      }

      // Feedback optimista: actualizar estado local INMEDIATAMENTE
      setBooks((prevBooks) =>
        prevBooks.map((b) =>
          b.id === book.id ? { ...b, disponible: false } : b
        )
      )

      toast.success("¡Libro reservado! Disfruta de la lectura.")
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push("/mis-prestamos")
      }, 1000)
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
  const showFeatured = !hasSearched && !hasQuery && initialBooks.length > 0

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8">
      {/* Buscador - Siempre visible en la parte superior */}
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Busca por título, autor o código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full rounded-lg border-stone-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm transition-all duration-200 focus-visible:border-stone-400 focus-visible:shadow-md"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
            </div>
          )}
        </div>
      </form>

      {/* Título de sección */}
      {showFeatured && (
        <h2 className="text-2xl font-serif font-semibold text-black tracking-tight">
          Colección Destacada
        </h2>
      )}

      {hasSearched && hasQuery && !hasResults && !isSearching && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-stone-200" />
          <p className="text-base text-stone-600 font-serif">
            No encontramos ese libro
          </p>
          <p className="mt-2 text-sm text-stone-500">
            ¿Quizás querías buscar por autor? Prueba con el apellido del autor.
          </p>
        </div>
      )}

      {/* Resultados - Tarjetas editoriales */}
      {hasResults && (
        <div className="grid gap-3">
          {books.map((book, index) => {
            const isReservingThis = isReserving === book.id
            const autor = `${book.apellido}, ${book.nombre}`
            const zona = book.zona ?? "General"
            const zoneColor = getZoneColor(book.zona)

            return (
              <div
                key={book.id}
                className={`group relative flex flex-row gap-4 rounded-lg border border-stone-200 bg-white p-4 transition-all duration-200 hover:shadow-md ${zoneColor} border-l-4`}
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                {/* Portada Editorial - Gris con icono */}
                <div className="relative h-28 w-20 flex-shrink-0 bg-stone-50 rounded border border-stone-100 flex items-center justify-center">
                  <BookIcon className="h-8 w-8 text-stone-400" />
                </div>

                {/* Contenido */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div>
                    <h3 className="text-lg font-serif font-semibold text-black leading-tight mb-1">
                      {book.titulo}
                    </h3>
                    <p className="text-xs text-stone-500 uppercase tracking-wider font-sans">
                      {autor}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    {zona && (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {zona}
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="mt-2 w-full sm:w-auto bg-black text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed rounded-md"
                    disabled={!book.disponible || isReservingThis}
                    onClick={() => handleReserve(book)}
                  >
                    {!book.disponible ? (
                      "Reservado"
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

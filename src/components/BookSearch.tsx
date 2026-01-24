'use client'

import { useState, useTransition, FormEvent, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, BookOpen } from "lucide-react"
import { toast } from "sonner"

import { searchBooks, type Book } from "@/app/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "./ui/button"
import { BookCover } from "./BookCover"

type BookSearchProps = {
  initialBooks?: Book[]
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

    // Usar getUser() en lugar de getSession() para mayor seguridad
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      toast.error("Sesión no válida. Por favor, inicia sesión de nuevo.")
      setIsReserving(null)
      setTimeout(() => {
        window.location.href = "/login"
      }, 1000)
      return
    }

    const userId = user.id

    // 1. Debugging (Imprimir en consola para ver qué pasa)
    console.log("Verificando préstamos para usuario:", userId)

    // 2. Consulta EXPLÍCITA (Solo préstamos ACTIVOS usando status)
    const { data: activeLoans, error: loanError } = await supabase
      .from("loans")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")

    if (loanError) {
      console.error("Error verificando préstamos activos:", loanError)
      toast.error("Error de conexión. Intenta recargar la página.")
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
      // Paso A: Insertar préstamo con status='active'
      console.log("Insertando préstamo:", { userId, bookId: book.id, status: "active" })
      
      const { data: newLoan, error: insertError } = await supabase
        .from("loans")
        .insert({
          user_id: userId,
          book_id: book.id,
          status: "active",
        })
        .select("id, status")
        .single()

      if (insertError) {
        console.error("Error insertando préstamo:", insertError)
        throw new Error(`No se ha podido registrar el préstamo: ${insertError.message}`)
      }

      if (!newLoan) {
        console.error("No se devolvió el préstamo insertado")
        throw new Error("No se ha podido registrar el préstamo")
      }

      console.log("Préstamo insertado correctamente:", newLoan)
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
      
      // Esperar un momento para asegurar que la inserción se complete
      // y luego forzar recarga completa
      await new Promise(resolve => setTimeout(resolve, 1000))
      window.location.href = "/mis-prestamos"
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
            const isReservingThis = isReserving === book.id
            const autor = `${book.apellido}, ${book.nombre}`
            const zona = book.zona ?? "General"
            const zonaInitial = zona.charAt(0).toUpperCase()

            return (
              <div
                key={book.id}
                className="group relative flex flex-col transition-all duration-200 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                {/* Portada Híbrida */}
                <BookCover book={book} className="mb-4" />

                {/* Información del libro */}
                <div className="space-y-2 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                  {/* Título */}
                  <h3 className="text-lg font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight">
                    {book.titulo}
                  </h3>

                  {/* Autor */}
                  <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-wider">
                    {autor}
                  </p>

                  {/* Zona y Botón Reservar */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-mono text-[#1A1A1A]/30 dark:text-[#E4E4E7]/30">
                      {zonaInitial}
                    </span>
                    
                    {/* Botón Reservar - Minimalista */}
                    <button
                      type="button"
                      onClick={() => handleReserve(book)}
                      disabled={!book.disponible || isReservingThis}
                      className="text-xs font-sans text-[#1A1A1A] dark:text-[#E4E4E7] hover:underline disabled:text-[#1A1A1A]/30 dark:disabled:text-[#E4E4E7]/30 disabled:no-underline disabled:cursor-not-allowed transition-all"
                    >
                      {!book.disponible ? (
                        "Reservado"
                      ) : isReservingThis ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          ...
                        </span>
                      ) : (
                        "Reservar"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

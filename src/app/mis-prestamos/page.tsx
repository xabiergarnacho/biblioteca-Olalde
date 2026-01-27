import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReturnBookButton } from "@/components/ReturnBookButton"
import { ReportMissingBookButton } from "@/components/ReportMissingBookButton"
import { BookCover } from "@/components/BookCover"
import Link from "next/link"
import type { Book } from "@/app/actions"

type LoanWithBook = {
  id: string
  book_id: string
  status: string
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

export default async function MisPrestamosPage() {
  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    redirect("/")
  }

  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    console.error("Error creando cliente de Supabase:", error)
    redirect("/login")
  }

  if (!supabase) {
    redirect("/login")
  }

  // Usar getUser() en lugar de getSession() para mayor seguridad
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("Error de autenticación:", authError)
    redirect("/login")
  }

  // Consultar préstamo activo usando status='active'
  let activeLoan: LoanWithBook | null = null

  try {
    const { data, error } = await supabase
      .from("loans")
      .select(
        `
        id,
        book_id,
        status,
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
      .eq("status", "active")
      .maybeSingle<LoanWithBook>()

    if (error) {
      console.error("Error consultando préstamo activo:", error)
      console.error("Detalles del error:", JSON.stringify(error, null, 2))
    } else {
      if (data) {
        activeLoan = data
      }
    }
  } catch (err) {
    console.error("Excepción al consultar préstamo activo:", err)
  }

  // Si no hay préstamo activo, mostrar mensaje elegante
  if (!activeLoan || !activeLoan.book) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
        <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] tracking-tight">
              No tienes lecturas activas
            </h1>
            <p className="text-sm font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 uppercase tracking-widest">
              Explora nuestra colección y encuentra tu próximo libro favorito
            </p>
          </div>
          <Link href="/">
            <button className="text-sm font-sans text-[#1A1A1A] dark:text-[#E4E4E7] hover:underline uppercase tracking-widest">
              Ir a buscar libros
            </button>
          </Link>
        </main>
      </div>
    )
  }

  const book = activeLoan.book
  const autor = `${book.apellido}, ${book.nombre}`
  const zona = book.zona ?? "General"
  const zonaInitial = zona.charAt(0).toUpperCase()

  // Fecha límite (15 días desde hoy)
  const today = new Date()
  const returnDate = new Date(today)
  returnDate.setDate(returnDate.getDate() + 15)
  const formattedDate = returnDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  // Convertir book a tipo Book para BookCover
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
    disponible: false,
    zona: book.zona,
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] tracking-tight mb-2">
            Tienes un libro prestado
          </h1>
          <p className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-widest">
            Información de tu préstamo activo
          </p>
        </div>

        {/* Tarjeta Principal Mejorada */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Izquierda: Portada del Libro */}
              <div className="shrink-0 w-full lg:w-64">
                <div className="aspect-[2/3] w-full max-w-xs mx-auto lg:mx-0">
                  <BookCover book={bookForCover} className="h-full w-full" />
                </div>
              </div>

              {/* Derecha: Información del Libro */}
              <div className="flex-1 space-y-6">
                {/* Título y Autor */}
                <div className="pb-6 border-b border-[#E5E5E5] dark:border-zinc-800">
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                    Libro
                  </p>
                  <h2 className="text-2xl md:text-3xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight mb-2">
                    {book.titulo}
                  </h2>
                  <p className="text-base font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 uppercase tracking-wider">
                    {autor}
                  </p>
                </div>

                {/* Grid de Información */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Código del Libro */}
                  <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                    <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                      Código
                    </p>
                    <p className="text-2xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7]">
                      {book.codigo}
                    </p>
                    <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                      Busca este código en la etiqueta
                    </p>
                  </div>

                  {/* Fecha Límite */}
                  <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                    <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                      Fecha Límite
                    </p>
                    <p className="text-2xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7]">
                      {formattedDate}
                    </p>
                    <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                      Día de devolución
                    </p>
                  </div>
                </div>

                {/* Ubicación de Devolución */}
                <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-3">
                    Ubicación de devolución
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#1A1A1A] dark:bg-[#E4E4E7] flex items-center justify-center shrink-0">
                      <span className="text-white dark:text-[#1A1A1A] font-mono text-xl font-bold">
                        {zonaInitial}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-sans font-medium text-[#1A1A1A] dark:text-[#E4E4E7]">
                        {zona}
                      </p>
                      <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                        Devuelve el libro en esta zona
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          {/* Botón Principal: Devolver */}
          <ReturnBookButton loanId={activeLoan.id} />

          {/* Botón Secundario: No lo encuentro */}
          <ReportMissingBookButton loanId={activeLoan.id} bookId={book.id} />
        </div>

        {/* Link de volver */}
        <div className="text-center">
          <Link href="/">
            <button className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline transition-colors uppercase tracking-widest">
              ← Volver al buscador
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}

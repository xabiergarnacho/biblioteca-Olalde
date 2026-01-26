import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReturnBookButton } from "@/components/ReturnBookButton"
import { ReportMissingBookButton } from "@/components/ReportMissingBookButton"
import Link from "next/link"

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
    console.log("Consultando préstamo activo para usuario:", user.id)
    
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
      console.log("Resultado de la consulta:", data)
      if (data) {
        activeLoan = data
        console.log("Préstamo activo encontrado:", activeLoan)
      } else {
        console.log("No se encontró préstamo activo")
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-3xl flex-col gap-8">
        {/* Ticket de Préstamo - Estilo Elegante */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 relative">
          {/* Borde discontinuo superior (simula ticket arrancable) */}
          <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-[#E5E5E5] dark:border-zinc-800"></div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Izquierda: Título y Autor */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight mb-4">
                  {book.titulo}
                </h1>
                <p className="text-sm font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 uppercase tracking-widest">
                  {autor}
                </p>
              </div>

              {/* Derecha: Información estructurada */}
              <div className="flex-1 space-y-6">
                {/* Código del Libro - Muy visible */}
                <div>
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                    Código
                  </p>
                  <p className="text-3xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7]">
                    {book.codigo}
                  </p>
                </div>

                {/* Fecha Límite - Tipografía monoespaciada */}
                <div>
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                    Fecha Límite
                  </p>
                  <p className="text-2xl font-mono text-[#1A1A1A] dark:text-[#E4E4E7]">
                    {formattedDate}
                  </p>
                </div>

                {/* Ubicación - Círculo negro con inicial */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                    <span className="text-white font-mono text-lg font-bold">
                      {zonaInitial}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-1">
                      Ubicación
                    </p>
                    <p className="text-base font-sans text-[#1A1A1A] dark:text-[#E4E4E7]">
                      {zona}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Borde discontinuo inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-px border-b-2 border-dashed border-[#E5E5E5] dark:border-zinc-800"></div>
        </div>

        {/* Botón de Devolver - Ancho completo, negro, esquinas rectas */}
        <ReturnBookButton loanId={activeLoan.id} />

        {/* Botón "No lo encuentro" */}
        <ReportMissingBookButton loanId={activeLoan.id} bookId={book.id} />

        {/* Link de volver */}
        <div className="text-center">
          <Link href="/">
            <button className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] uppercase tracking-widest">
              ← Volver al buscador
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}

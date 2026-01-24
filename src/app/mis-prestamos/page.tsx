import { redirect } from "next/navigation"
import { BookOpen, MapPin, Calendar, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ReturnBookButton } from "@/components/ReturnBookButton"

type LoanWithBook = {
  id: string
  book_id: string
  created_at: string
  returned_at: string | null
  book: {
    id: number
    titulo: string
    nombre: string
    apellido: string
    zona: string | null
  } | null
}

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
        created_at,
        returned_at,
        status,
        book:books (
          id,
          titulo,
          nombre,
          apellido,
          zona
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
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-16 font-sans">
        <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <BookOpen className="mx-auto h-24 w-24 text-stone-300" />
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-black tracking-tight">
              No tienes lecturas activas
            </h1>
            <p className="text-lg text-stone-500">
              Explora nuestra colección y encuentra tu próximo libro favorito
            </p>
          </div>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-stone-800 rounded-md px-8 py-6 text-base">
              Ir a buscar libros
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const book = activeLoan.book
  const autor = `${book.apellido}, ${book.nombre}`
  const zona = book.zona ?? "General"

  // Calcular días restantes (15 días desde created_at)
  const loanDate = new Date(activeLoan.created_at)
  const returnDate = new Date(loanDate)
  returnDate.setDate(returnDate.getDate() + 15)
  const today = new Date()
  const daysRemaining = Math.max(
    0,
    Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Color del texto según días restantes
  const daysColorClass =
    daysRemaining < 3
      ? "text-red-600"
      : daysRemaining < 7
      ? "text-orange-600"
      : "text-slate-900"

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-16 font-sans">
      <main className="flex w-full max-w-4xl flex-col gap-8">
        {/* Botón de volver */}
        <Link href="/">
          <Button variant="ghost" className="mb-4 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al buscador
          </Button>
        </Link>

        {/* Encabezado */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-black tracking-tight">
            Tu Lectura Actual
          </h1>
        </header>

        {/* Tarjeta principal del libro - Diseño Editorial */}
        <Card className="w-full border border-stone-200 bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Portada Editorial - Gris con icono */}
              <div className="flex-shrink-0">
                <div className="h-48 w-32 md:h-64 md:w-40 bg-stone-50 rounded border border-stone-100 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 md:h-20 md:w-20 text-stone-400" />
                </div>
              </div>

              {/* Información del libro */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-black mb-2 leading-tight">
                    {book.titulo}
                  </h2>
                  <p className="text-sm text-stone-500 uppercase tracking-wider font-sans">
                    {autor}
                  </p>
                </div>

                {/* Ubicación destacada - Recuadro grande y visible */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                        Recógelo en:
                      </p>
                      <p className="text-2xl font-bold text-blue-700">{zona}</p>
                    </div>
                  </div>
                </div>

                {/* Cuenta atrás - Con color según días restantes */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-stone-500" />
                  <div>
                    <p className="text-sm text-stone-500">Tiempo restante</p>
                    <p className={`text-xl font-bold ${daysColorClass}`}>
                      Te quedan {daysRemaining} {daysRemaining === 1 ? "día" : "días"} para devolverlo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de devolver - Grande y visible */}
        <div className="flex justify-center">
          <ReturnBookButton loanId={activeLoan.id} />
        </div>
      </main>
    </div>
  )
}

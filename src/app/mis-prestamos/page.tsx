import { redirect } from "next/navigation"
import { BookOpen, MapPin, Calendar, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { returnBook } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Error obteniendo sesión:", sessionError)
    redirect("/login")
  }

  // Protección estricta: si no hay sesión, redirigir a login
  if (!session) {
    redirect("/login")
  }

  // Consultar préstamo activo
  let activeLoan: LoanWithBook | null = null

  try {
    const { data, error } = await supabase
      .from("loans")
      .select(
        `
        id,
        book_id,
        created_at,
        returned_at,
        book:books (
          id,
          titulo,
          nombre,
          apellido,
          zona
        )
      `
      )
      .eq("user_id", session.user.id)
      .is("returned_at", null)
      .maybeSingle<LoanWithBook>()

    if (error) {
      console.error("Error consultando préstamo activo:", error)
    } else if (data) {
      activeLoan = data
    }
  } catch (err) {
    console.error("Excepción al consultar préstamo activo:", err)
  }

  // Si no hay préstamo activo, redirigir a home
  if (!activeLoan || !activeLoan.book) {
    redirect("/")
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

  // Iniciales del autor
  const initials =
    (book.apellido?.[0] || "") + (book.nombre?.[0] || "") ||
    book.titulo.slice(0, 2).toUpperCase()

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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Tu Lectura Actual
          </h1>
          <p className="text-lg text-slate-500">
            Disfruta de tu libro y recuerda devolverlo a tiempo
          </p>
        </header>

        {/* Tarjeta principal del libro */}
        <Card className="w-full border-2 border-slate-200 bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Portada/Icono */}
              <div className="flex-shrink-0">
                <div
                  className={`h-48 w-32 md:h-64 md:w-40 ${gradient} rounded-lg flex items-center justify-center shadow-md`}
                >
                  <BookOpen className="h-16 w-16 md:h-20 md:w-20 text-slate-600/60" />
                </div>
              </div>

              {/* Información del libro */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {book.titulo}
                  </h2>
                  <p className="text-lg text-slate-600 font-medium">{autor}</p>
                </div>

                {/* Ubicación destacada */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Recógelo y devuélvelo en:
                      </p>
                      <p className="text-lg font-bold text-blue-700">{zona}</p>
                    </div>
                  </div>
                </div>

                {/* Tiempo restante */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Tiempo restante</p>
                    <p className="text-xl font-bold text-slate-900">
                      Te quedan {daysRemaining} {daysRemaining === 1 ? "día" : "días"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de devolver */}
        <div className="flex justify-center">
          <ReturnBookButton loanId={activeLoan.id} />
        </div>
      </main>
    </div>
  )
}

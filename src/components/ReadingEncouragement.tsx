'use client'

import { BookOpen, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { useRouter } from "next/navigation"

type ReadingEncouragementProps = {
  currentBookTitle: string
  currentBookAuthor: string
  zone?: string | null
}

export function ReadingEncouragement({
  currentBookTitle,
  currentBookAuthor,
  zone,
}: ReadingEncouragementProps) {
  const router = useRouter()

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8">
      {/* Icono animado */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100/50 blur-2xl" />
        <div className="relative rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <BookOpen className="h-16 w-16 text-blue-600" />
        </div>
      </div>

      {/* Mensaje principal */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
          ¡Tienes un libro esperándote!
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl">
          Termina de leer el libro que tienes prestado para poder coger otro.
          <br />
          <span className="text-base text-slate-500 mt-2 block">
            Cada historia merece su tiempo. ¡Disfruta de la lectura!
          </span>
        </p>
      </div>

      {/* Tarjeta del libro actual */}
      <Card className="w-full max-w-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Icono decorativo */}
            <div className="flex-shrink-0">
              <div className="rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            {/* Información del libro */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">
                  Tu libro actual
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {currentBookTitle}
                </h3>
                <p className="text-base text-slate-600">
                  {currentBookAuthor}
                </p>
              </div>

              {zone && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-sm text-slate-500">
                    Devuélvelo en: <span className="font-semibold text-slate-700">{zone}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje motivacional */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">
            Una vez que lo devuelvas, podrás coger otro
          </span>
        </div>
      </div>

      {/* Botón para ver el préstamo */}
      <Button
        onClick={() => router.push("/")}
        className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-base font-semibold"
      >
        Ver mi préstamo actual
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )
}

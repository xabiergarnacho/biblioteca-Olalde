'use client'

import { useTransition } from "react"
import { toast } from "sonner"

import { returnBook } from "@/app/actions"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type ActiveLoanViewProps = {
  loanId: string
  bookTitle: string
  zone?: string | null
  shelf?: string | null
}

export function ActiveLoanView({
  loanId,
  bookTitle,
  zone,
  shelf,
}: ActiveLoanViewProps) {
  const [isPending, startTransition] = useTransition()

  const handleReturn = () => {
    startTransition(async () => {
      try {
        await returnBook(loanId)
        toast.success("Libro devuelto. ¡Gracias por dejarlo en su sitio!")
      } catch (err) {
        console.error(err)
        const message =
          err instanceof Error
            ? err.message
            : "No se ha podido registrar la devolución"
        toast.error(message)
      }
    })
  }

  const resolvedZone = zone ?? "Zona desconocida"

  return (
    <Card className="w-full max-w-3xl border-l-4 border-l-orange-400 bg-white shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-900">
          Tienes un libro prestado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">Libro</p>
          <p className="text-xl font-semibold text-slate-900">{bookTitle}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">Ubicación de devolución</p>
          <p className="text-lg text-slate-700">
            <span className="font-semibold">{resolvedZone}</span>
            {shelf && <span> - <span className="font-semibold">{shelf}</span></span>}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="w-full bg-orange-500 text-base font-semibold text-white transition-colors hover:bg-orange-600"
          disabled={isPending}
          onClick={handleReturn}
        >
          {isPending ? "Registrando devolución..." : "Ya lo he devuelto"}
        </Button>
      </CardContent>
    </Card>
  )
}


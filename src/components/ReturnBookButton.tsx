'use client'

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { returnBook } from "@/app/actions"
import { Button } from "./ui/button"

type ReturnBookButtonProps = {
  loanId: string
}

export function ReturnBookButton({ loanId }: ReturnBookButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleReturn = () => {
    startTransition(async () => {
      try {
        await returnBook(loanId)
        toast.success("Libro devuelto. ¡Gracias!")
        
        // Redirigir al buscador después de un breve delay
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1000)
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

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleReturn}
      disabled={isPending}
      className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-6 text-lg font-semibold disabled:opacity-50"
    >
      {isPending ? "Registrando devolución..." : "Devolver Libro"}
    </Button>
  )
}

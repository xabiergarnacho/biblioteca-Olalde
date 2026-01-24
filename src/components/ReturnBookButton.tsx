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
        toast.success("Libro devuelto correctamente")
        
        // Redirigir al buscador inmediatamente
        router.push("/")
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
    <button
      type="button"
      onClick={handleReturn}
      disabled={isPending}
      className="w-full bg-[#1A1A1A] text-white py-4 text-sm font-sans uppercase tracking-widest hover:bg-[#1A1A1A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
    >
      {isPending ? "Registrando devolución..." : "Confirmar Devolución"}
    </button>
  )
}

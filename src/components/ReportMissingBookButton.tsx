'use client'

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { reportMissingBook } from "@/app/actions"

type ReportMissingBookButtonProps = {
  loanId: string
  bookId: number
}

export function ReportMissingBookButton({ loanId, bookId }: ReportMissingBookButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleReport = () => {
    startTransition(async () => {
      try {
        await reportMissingBook(loanId, bookId)
        toast.success("Incidencia reportada. Puedes buscar otro libro.")
        
        // Redirigir al buscador
        router.push("/")
      } catch (err) {
        console.error(err)
        const message =
          err instanceof Error
            ? err.message
            : "No se ha podido registrar la incidencia"
        toast.error(message)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={isPending}
      className="w-full h-12 text-sm font-sans text-red-600 dark:text-red-400 bg-white dark:bg-[#1E1E1E] border border-red-300 dark:border-red-800 hover:border-red-500 dark:hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-sm uppercase tracking-widest"
    >
      {isPending ? "Reportando..." : "No encuentro el libro en la estantería"}
    </button>
  )
}

'use client'

import { useTransition } from "react"
import { toast } from "sonner"
import { reportMissingBookFromDetail } from "@/app/actions"

type ReportMissingBookDetailButtonProps = {
  bookId: number
}

export function ReportMissingBookDetailButton({ bookId }: ReportMissingBookDetailButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleReport = () => {
    startTransition(async () => {
      try {
        await reportMissingBookFromDetail(bookId)
        toast.success("Gracias. El administrador revisará este libro.")
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
      className="w-full text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPending ? "Reportando..." : "¿No encuentras este libro en la estantería?"}
    </button>
  )
}

'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { returnBook } from "@/app/actions"
import { X } from "lucide-react"

type ReturnBookButtonProps = {
  loanId: string
}

export function ReturnBookButton({ loanId }: ReturnBookButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)

  const handleReturnClick = () => {
    setShowModal(true)
  }

  const handleReturn = (liked: boolean | null) => {
    startTransition(async () => {
      try {
        await returnBook(loanId, liked)
        toast.success("Libro devuelto correctamente")
        setShowModal(false)
        
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
    <>
      <button
        type="button"
        onClick={handleReturnClick}
        disabled={isPending}
        className="w-full bg-[#FF6B35] dark:bg-[#FF6B35] text-white py-4 text-base font-sans font-medium uppercase tracking-wider hover:bg-[#FF5A1F] dark:hover:bg-[#FF5A1F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg shadow-sm"
      >
        {isPending ? "Registrando devolución..." : "Ya lo he devuelto"}
      </button>

      {/* Modal de Valoración */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7]">
                ¿Qué te ha parecido?
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleReturn(true)}
                disabled={isPending}
                className="w-full h-12 bg-[#1A1A1A] dark:bg-[#E4E4E7] text-white dark:text-[#1A1A1A] font-sans text-sm uppercase tracking-wider hover:bg-[#1A1A1A]/90 dark:hover:bg-[#E4E4E7]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                <span>👍</span>
                <span>Me ha gustado</span>
              </button>
              <button
                type="button"
                onClick={() => handleReturn(false)}
                disabled={isPending}
                className="w-full h-12 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 text-[#1A1A1A] dark:text-[#E4E4E7] font-sans text-sm uppercase tracking-wider hover:border-[#1A1A1A] dark:hover:border-[#E4E4E7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center justify-center gap-2"
              >
                <span>😐</span>
                <span>Normal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

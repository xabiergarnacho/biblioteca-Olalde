'use client'

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type ReserveBookButtonProps = {
  bookId: number
}

export function ReserveBookButton({ bookId }: ReserveBookButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleReserve = () => {
    startTransition(async () => {
      const supabase = createClient()

      // Usar getUser() en lugar de getSession() para mayor seguridad
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Error de autenticación:", authError)
        toast.error("Sesión no válida. Por favor, inicia sesión de nuevo.")
        setTimeout(() => {
          window.location.href = "/login"
        }, 1000)
        return
      }

      const userId = user.id

      // La base de datos se encarga de verificar la restricción de un solo préstamo activo
      // mediante el UNIQUE INDEX. Si falla, capturamos el error 23505 abajo
      let loanId: string | null = null

      try {
        // Paso A: Insertar préstamo con status='active'
        const { data: newLoan, error: insertError } = await supabase
          .from("loans")
          .insert({
            user_id: userId,
            book_id: bookId,
            status: "active",
          })
          .select("id, status")
          .single()

        if (insertError) {
          console.error("Error insertando préstamo:", insertError)
          
          // Detectar violación de restricción UNIQUE (ya tienes un préstamo activo)
          // PostgreSQL error code 23505 = unique_violation
          if (
            insertError.code === '23505' || 
            insertError.message?.includes('one_active_loan_per_user') ||
            insertError.message?.includes('duplicate key')
          ) {
            toast.error("¡Ya tienes un libro activo! Devuélvelo antes de coger otro.")
            
            // Redirigir a Mis Préstamos después de 1.5 segundos
            setTimeout(() => {
              router.push("/mis-prestamos")
            }, 1500)
            return
          }
          
          throw new Error(`No se ha podido registrar el préstamo: ${insertError.message}`)
        }

        if (!newLoan) {
          throw new Error("No se ha podido registrar el préstamo")
        }

        loanId = newLoan.id

        // Paso B: Actualizar libro (disponible: false)
        const { error: updateError } = await supabase
          .from("books")
          .update({ disponible: false })
          .eq("id", bookId)

        if (updateError) {
          // Rollback manual: eliminar el préstamo si falla la actualización
          if (loanId) {
            await supabase.from("loans").delete().eq("id", loanId)
          }
          throw new Error("No se ha podido actualizar el estado del libro")
        }

        toast.success("¡Libro reservado! Disfruta de la lectura.")
        
        // Esperar un momento y redirigir
        await new Promise(resolve => setTimeout(resolve, 1000))
        window.location.href = "/mis-prestamos"
      } catch (err) {
        console.error(err)
        const message =
          err instanceof Error
            ? err.message
            : "No se ha podido registrar el préstamo"
        toast.error(message)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleReserve}
      disabled={isPending}
      className="w-full h-12 bg-[#1A1A1A] dark:bg-[#E4E4E7] text-white dark:text-[#1A1A1A] font-sans text-sm uppercase tracking-widest hover:bg-[#1A1A1A]/90 dark:hover:bg-[#E4E4E7]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm flex items-center justify-center gap-2"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : (
        "Confirmar Préstamo"
      )}
    </button>
  )
}


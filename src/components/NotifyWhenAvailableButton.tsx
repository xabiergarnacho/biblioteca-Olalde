'use client'

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Bell, BellOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type NotifyWhenAvailableButtonProps = {
  bookId: number
  isOnWaitlist?: boolean
}

export function NotifyWhenAvailableButton({ bookId, isOnWaitlist = false }: NotifyWhenAvailableButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isSubscribed, setIsSubscribed] = useState(isOnWaitlist)

  const handleToggle = () => {
    startTransition(async () => {
      const supabase = createClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error("Sesión no válida. Por favor, inicia sesión de nuevo.")
        return
      }

      try {
        if (isSubscribed) {
          // Eliminar de la waitlist
          const { error: deleteError } = await supabase
            .from("waitlist")
            .delete()
            .eq("book_id", bookId)
            .eq("user_id", user.id)

          if (deleteError) {
            throw new Error("No se ha podido cancelar la notificación")
          }

          setIsSubscribed(false)
          toast.success("Notificación cancelada")
        } else {
          // Añadir a la waitlist
          const { error: insertError } = await supabase
            .from("waitlist")
            .insert({
              book_id: bookId,
              user_id: user.id,
            })

          if (insertError) {
            // Si ya existe, no es un error crítico
            if (insertError.code === '23505') { // Unique violation
              setIsSubscribed(true)
              toast.info("Ya estás en la lista de espera")
            } else {
              throw new Error("No se ha podido activar la notificación")
            }
          } else {
            setIsSubscribed(true)
            toast.success("Te avisaremos cuando el libro esté disponible")
          }
        }
      } catch (err) {
        console.error(err)
        const message =
          err instanceof Error
            ? err.message
            : "No se ha podido procesar la solicitud"
        toast.error(message)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="w-full h-12 bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 text-[#1A1A1A] dark:text-[#E4E4E7] font-sans text-sm uppercase tracking-wider hover:border-[#1A1A1A] dark:hover:border-[#E4E4E7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm flex items-center justify-center gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          Cancelar notificación
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Avísame cuando vuelva
        </>
      )}
    </button>
  )
}

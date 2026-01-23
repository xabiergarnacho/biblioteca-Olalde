import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react"

export default async function UserHeader() {
  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const user = session.user
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    ""
  const email = user.email ?? ""
  const displayName = fullName || email || "Usuario"

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    undefined

  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    email?.[0]?.toUpperCase() ||
    "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="grid w-full max-w-5xl grid-cols-3 items-center px-6 py-4 mx-auto">
        {/* Columna 1: Vacía para equilibrio */}
        <div></div>

        {/* Columna 2: Información del usuario centrada (Pill) */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100/50 backdrop-blur-sm pl-1 pr-4 py-1">
            <Avatar className="h-7 w-7">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-slate-700">{displayName}</span>
          </div>
        </div>

        {/* Columna 3: Botón de cerrar sesión */}
        <div className="flex justify-end">
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 transition-colors hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}


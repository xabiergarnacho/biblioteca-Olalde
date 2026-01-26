import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { LogOut, Trophy } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import Link from "next/link"

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

  // Calcular iniciales: primera letra del nombre y primera del apellido
  let initials = "U"
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(" ").filter(Boolean)
    if (parts.length >= 2) {
      // Tomar primera letra del nombre y primera del último apellido
      initials = (parts[0][0]?.toUpperCase() || "") + (parts[parts.length - 1][0]?.toUpperCase() || "")
    } else if (parts.length === 1) {
      // Si solo hay un nombre, tomar las dos primeras letras
      initials = parts[0].substring(0, 2).toUpperCase()
    }
  } else if (email) {
    initials = email[0]?.toUpperCase() || "U"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-zinc-700 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md">
      <div className="grid w-full max-w-5xl grid-cols-3 items-center px-6 py-4 mx-auto">
        {/* Columna 1: Enlace Top Libros */}
        <div className="flex justify-start">
          <Link href="/ranking">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-slate-600 dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] transition-colors"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Top Libros</span>
            </Button>
          </Link>
        </div>

        {/* Columna 2: Información del usuario centrada (Pill) */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100/50 dark:bg-zinc-800/50 backdrop-blur-sm pl-1 pr-4 py-1">
            <Avatar className="h-7 w-7">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-slate-700 dark:text-[#F4F4F5]">{displayName}</span>
          </div>
        </div>

        {/* Columna 3: Botón de tema y cerrar sesión */}
        <div className="flex justify-end items-center gap-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 dark:text-zinc-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
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


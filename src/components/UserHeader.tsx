import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"

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
    <header className="sticky top-0 z-50 flex w-full justify-center border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="flex w-full max-w-5xl items-center justify-between px-6 py-4 text-sm">
        <div className="font-semibold tracking-tight">
          Biblioteca Olalde
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-medium">{displayName}</span>
              {email && !fullName && (
                <span className="text-xs text-muted-foreground">
                  {email}
                </span>
              )}
            </div>
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}


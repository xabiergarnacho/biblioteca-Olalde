import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Crear el response de redirección PRIMERO
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    console.error("Error en callback:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Verificar que la sesión se estableció
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("No se pudo obtener el usuario después del intercambio");
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  return response;
}

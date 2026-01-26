import { redirect } from "next/navigation";
import Image from "next/image";
import { ActiveLoanView } from "@/components/ActiveLoanView";
import { BookSearch } from "@/components/BookSearch";
import { createClient } from "@/lib/supabase/server";
import { getInitialBooks, type Book } from "@/app/actions";

type LoanWithBook = {
  id: string;
  book_id: string;
  status: string;
  book: Book | null;
};

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-16 font-sans">
        <main className="flex w-full max-w-5xl flex-col gap-12">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Configuración requerida
            </h2>
            <p className="text-sm text-muted-foreground">
              Por favor, configura las variables de entorno de Supabase en el archivo <code className="bg-background px-1 py-0.5 rounded">.env.local</code>
            </p>
          </div>
        </main>
      </div>
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("Error creando cliente de Supabase:", error);
    redirect("/login");
  }

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error obteniendo sesión:", sessionError);
    redirect("/login");
  }

  // Protección estricta: si no hay sesión, redirigir a login
  if (!session) {
    redirect("/login");
  }

  let activeLoan: LoanWithBook | null = null;
  let initialBooks: Book[] = [];

  // Ahora sabemos que hay sesión, consultamos préstamos activos
  try {
    const { data, error } = await supabase
      .from("loans")
      .select(
        `
        id,
        book_id,
        status,
        book:books (
          id,
          titulo,
          nombre,
          apellido,
          disponible,
          zona,
          codigo
        )
      `
      )
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle<LoanWithBook>();

    if (error) {
      console.error("Error consultando préstamo activo:", error);
    } else if (data) {
      activeLoan = data;
    }
  } catch (err) {
    console.error("Excepción al consultar préstamo activo:", err);
  }

  if (!activeLoan) {
    try {
      initialBooks = await getInitialBooks();
    } catch (err) {
      console.error("Excepción al cargar libros iniciales:", err);
    }
  }

  const book = activeLoan?.book;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FDFCF8] dark:bg-[#121212] px-4 py-16 font-sans">
      <main className="flex w-full max-w-6xl flex-col gap-12">

        {activeLoan && book ? (
          <ActiveLoanView
            loanId={activeLoan.id}
            book={book}
          />
        ) : (
          <BookSearch initialBooks={initialBooks} />
        )}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { ActiveLoanView } from "@/components/ActiveLoanView";
import { BookSearch } from "@/components/BookSearch";
import { createClient } from "@/lib/supabase/server";

type BookRow = {
  id: string;
  title: string;
  author: string;
  is_available: boolean;
  zone?: string | null;
  shelf?: string | null;
  location_zone?: string | null;
  location_shelf?: string | null;
};

type LoanWithBook = {
  id: string;
  book_id: string;
  returned_at: string | null;
  book: BookRow | null;
};

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
  let initialBooks: BookRow[] = [];

  // Ahora sabemos que hay sesión, consultamos préstamos activos
  try {
    const { data, error } = await supabase
      .from("loans")
      .select(
        `
        id,
        book_id,
        returned_at,
        book:books (
          id,
          title,
          author,
          is_available,
          location_zone,
          location_shelf
        )
      `
      )
      .eq("user_id", session.user.id)
      .is("returned_at", null)
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
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("is_available", true)
        .order("title", { ascending: true })
        .limit(12);

      if (error) {
        console.error("Error cargando libros iniciales:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else if (data) {
        initialBooks = data as BookRow[];
      }
    } catch (err) {
      console.error("Excepción al cargar libros iniciales:", err);
    }
  }

  const book = activeLoan?.book;
  const zone = book?.zone ?? book?.location_zone ?? null;
  const shelf = book?.shelf ?? book?.location_shelf ?? null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-16 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Biblioteca Olalde
          </h1>
          <p className="text-base text-slate-600">
            Coge un libro, disfrútalo y recuerda devolverlo a su sitio.
          </p>
        </header>

        {activeLoan && book ? (
          <ActiveLoanView
            loanId={activeLoan.id}
            bookTitle={book.title}
            zone={zone}
            shelf={shelf}
          />
        ) : (
          <BookSearch initialBooks={initialBooks} />
        )}
      </main>
    </div>
  );
}

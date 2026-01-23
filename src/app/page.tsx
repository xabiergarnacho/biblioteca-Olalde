import { redirect } from "next/navigation";
import Image from "next/image";
import { ActiveLoanView } from "@/components/ActiveLoanView";
import { BookSearch } from "@/components/BookSearch";
import { createClient } from "@/lib/supabase/server";
import { getInitialBooks, type Book } from "@/app/actions";

type LoanWithBook = {
  id: string;
  book_id: string;
  returned_at: string | null;
  book: Book | null;
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
  let initialBooks: Book[] = [];

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
          titulo,
          nombre,
          apellido,
          disponible,
          zona
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
      initialBooks = await getInitialBooks();
    } catch (err) {
      console.error("Excepción al cargar libros iniciales:", err);
    }
  }

  const book = activeLoan?.book;
  const zone = book?.zona ?? null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-16 font-sans">
      <main className="flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-black">
              Biblioteca
            </h1>
            <Image
              src="/logo-olalde.svg"
              alt="Logotipo Olalde"
              width={200}
              height={80}
              className="mt-2"
              priority
            />
          </div>
          <p className="text-lg text-slate-500 font-normal mt-2">
            Coge un libro, disfrútalo y recuerda devolverlo a su sitio.
          </p>
        </header>

        {activeLoan && book ? (
          <ActiveLoanView
            loanId={activeLoan.id}
            bookTitle={book.titulo}
            zone={zone}
            shelf={null}
          />
        ) : (
          <BookSearch initialBooks={initialBooks} />
        )}
      </main>
    </div>
  );
}

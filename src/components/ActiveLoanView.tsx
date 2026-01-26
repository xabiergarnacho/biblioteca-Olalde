'use client'

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

import { returnBook, type Book } from "@/app/actions"
import { BookCover } from "./BookCover"
import { ReturnBookButton } from "./ReturnBookButton"

type ActiveLoanViewProps = {
  loanId: string
  book: Book
}

export function ActiveLoanView({
  loanId,
  book,
}: ActiveLoanViewProps) {
  const autor = `${book.apellido}, ${book.nombre}`
  const zona = book.zona ?? "General"
  const zonaInitial = zona.charAt(0).toUpperCase()

  // Fecha límite (15 días desde hoy)
  const today = new Date()
  const returnDate = new Date(today)
  returnDate.setDate(returnDate.getDate() + 15)
  const formattedDate = returnDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="w-full max-w-5xl flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] tracking-tight mb-2">
          Tienes un libro prestado
        </h1>
        <p className="text-sm font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 uppercase tracking-widest">
          Información de tu préstamo activo
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Izquierda: Portada del Libro */}
            <div className="shrink-0 w-full lg:w-64">
              <Link href={`/libro/${book.id}`}>
                <div className="aspect-2/3 w-full max-w-xs mx-auto lg:mx-0 cursor-pointer transition-transform hover:scale-105">
                  <BookCover book={book} className="h-full w-full" />
                </div>
              </Link>
            </div>

            {/* Derecha: Información del Libro */}
            <div className="flex-1 space-y-6">
              {/* Título y Autor */}
              <div className="pb-6 border-b border-[#E5E5E5] dark:border-zinc-800">
                <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                  Libro
                </p>
                <Link href={`/libro/${book.id}`}>
                  <h2 className="text-2xl md:text-3xl font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight mb-2 hover:underline">
                    {book.titulo}
                  </h2>
                </Link>
                <p className="text-base font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 uppercase tracking-wider">
                  {autor}
                </p>
              </div>

              {/* Grid de Información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código del Libro */}
                <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                    Código
                  </p>
                  <p className="text-2xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7]">
                    {book.codigo}
                  </p>
                  <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                    Busca este código en la etiqueta
                  </p>
                </div>

                {/* Fecha Límite */}
                <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                  <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-2">
                    Fecha Límite
                  </p>
                  <p className="text-2xl font-mono font-bold text-[#1A1A1A] dark:text-[#E4E4E7]">
                    {formattedDate}
                  </p>
                  <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                    Día de devolución
                  </p>
                </div>
              </div>

              {/* Ubicación de Devolución */}
              <div className="bg-[#FDFCF8] dark:bg-[#18181B] border border-[#E5E5E5] dark:border-zinc-800 rounded-sm p-4">
                <p className="text-xs font-sans text-[#1A1A1A]/40 dark:text-[#E4E4E7]/40 uppercase tracking-widest mb-3">
                  Ubicación de devolución
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#1A1A1A] dark:bg-[#E4E4E7] flex items-center justify-center shrink-0">
                    <span className="text-white dark:text-[#1A1A1A] font-mono text-xl font-bold">
                      {zonaInitial}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-sans font-medium text-[#1A1A1A] dark:text-[#E4E4E7]">
                      {zona}
                    </p>
                    <p className="text-xs font-sans text-[#1A1A1A]/50 dark:text-[#E4E4E7]/50 mt-1">
                      Devuelve el libro en esta zona
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="space-y-3">
        <ReturnBookButton loanId={loanId} />
      </div>
    </div>
  )
}


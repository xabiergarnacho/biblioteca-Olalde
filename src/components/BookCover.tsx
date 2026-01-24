'use client'

import { useState } from "react"
import { BookOpen } from "lucide-react"
import type { Book } from "@/app/actions"

type BookCoverProps = {
  book: Book
  className?: string
}

export function BookCover({ book, className = "" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Construir URL de OpenLibrary basada en el título
  // OpenLibrary usa el título normalizado (sin espacios especiales, en minúsculas)
  const normalizeTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) // Limitar longitud
  }

  const openLibraryUrl = `https://covers.openlibrary.org/b/title/${normalizeTitle(book.titulo)}-M.jpg`

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Si hay error o no se está cargando, mostrar diseño editorial
  if (imageError || (!imageLoading && imageError)) {
    return (
      <div
        className={`bg-white dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 flex items-center justify-center ${className}`}
        style={{ aspectRatio: '2/3' }}
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-serif font-normal text-[#1A1A1A] dark:text-[#F4F4F5] leading-tight">
            {book.titulo.length > 50 
              ? `${book.titulo.substring(0, 50)}...` 
              : book.titulo}
          </h3>
        </div>
      </div>
    )
  }

  // Intentar cargar imagen real
  return (
    <div
      className={`relative bg-white dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 overflow-hidden ${className}`}
      style={{ aspectRatio: '2/3' }}
    >
      {/* Imagen real con fade-in */}
      <img
        src={openLibraryUrl}
        alt={book.titulo}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Estado de carga - Diseño editorial mientras carga */}
      {imageLoading && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-800 flex items-center justify-center">
          <div className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-[#E5E5E5] dark:text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-serif font-normal text-[#1A1A1A]/40 dark:text-[#F4F4F5]/40 leading-tight">
              {book.titulo.length > 40 
                ? `${book.titulo.substring(0, 40)}...` 
                : book.titulo}
            </h3>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from "react"
import type { Book } from "@/app/actions"

type BookCoverProps = {
  book: Book
  className?: string
}

export function BookCover({ book, className = "" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Construir URL de OpenLibrary usando encodeURIComponent
  const openLibraryUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.titulo)}-L.jpg?default=false`

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // Fallback Editorial: Diseño infalible cuando no hay imagen o falla la carga
  const FallbackEditorial = () => (
    <div
      className={`aspect-[2/3] w-full bg-[#E5E5E5] dark:bg-[#1E1E1E] p-4 flex flex-col justify-center items-center text-center border border-gray-200 dark:border-gray-800 rounded-sm ${className}`}
    >
      <h3 className="font-serif text-gray-900 dark:text-gray-100 font-bold leading-tight line-clamp-3 text-sm md:text-base px-2">
        {book.titulo}
      </h3>
      <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
        {book.apellido}, {book.nombre}
      </p>
    </div>
  )

  // Si hay error de imagen, mostrar fallback editorial
  if (imageError) {
    return <FallbackEditorial />
  }

  // Intentar cargar imagen real
  return (
    <div
      className={`relative bg-white dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden ${className}`}
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

      {/* Estado de carga - Fallback mientras carga */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-zinc-900 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="font-serif font-normal text-gray-700/60 dark:text-gray-300/60 leading-tight text-xs">
              {book.titulo.length > 60 
                ? `${book.titulo.substring(0, 60)}...` 
                : book.titulo}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

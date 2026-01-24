'use client'

import { useState } from "react"
import type { Book } from "@/app/actions"

type BookCoverProps = {
  book: Book
  className?: string
}

// Función para generar color de fallback basado en el título
function getFallbackColor(titulo: string): string {
  // Colores suaves aleatorios basados en el hash del título
  const colors = [
    'bg-stone-200 dark:bg-stone-700',
    'bg-amber-100 dark:bg-amber-900/30',
    'bg-blue-100 dark:bg-blue-900/30',
    'bg-slate-200 dark:bg-slate-700',
    'bg-zinc-200 dark:bg-zinc-700',
    'bg-neutral-200 dark:bg-neutral-700',
  ]
  
  // Generar índice basado en el título
  const hash = titulo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
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

  const fallbackColor = getFallbackColor(book.titulo)

  // Si hay error, mostrar fallback con color y título
  if (imageError) {
    return (
      <div
        className={`${fallbackColor} border border-[#E5E5E5] dark:border-zinc-800 rounded-sm shadow-sm flex items-center justify-center ${className}`}
        style={{ aspectRatio: '2/3' }}
      >
        <div className="p-4 text-center">
          <h3 className="text-base md:text-lg font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] leading-tight px-2">
            {book.titulo.length > 60 
              ? `${book.titulo.substring(0, 60)}...` 
              : book.titulo}
          </h3>
        </div>
      </div>
    )
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
        <div className={`absolute inset-0 ${fallbackColor} flex items-center justify-center`}>
          <div className="p-4 text-center">
            <h3 className="text-sm font-serif font-normal text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 leading-tight px-2">
              {book.titulo.length > 50 
                ? `${book.titulo.substring(0, 50)}...` 
                : book.titulo}
            </h3>
          </div>
        </div>
      )}
    </div>
  )
}

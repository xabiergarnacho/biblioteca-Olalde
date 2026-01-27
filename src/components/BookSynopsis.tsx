'use client'

import { useState, useEffect } from "react"

type BookSynopsisProps = {
  titulo: string
  autor: string
}

export function BookSynopsis({ titulo, autor }: BookSynopsisProps) {
  const [description, setDescription] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchSynopsis = async () => {
      try {
        // Limpiar título y autor para la búsqueda
        const cleanTitulo = encodeURIComponent(titulo.trim())
        const cleanAutor = encodeURIComponent(autor.trim())
        
        // Construir query para Google Books API
        const query = `intitle:${cleanTitulo}+inauthor:${cleanAutor}`
        
        // Usar la API key si está disponible para evitar rate limits
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1${apiKey ? `&key=${apiKey}` : ''}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Error al buscar en Google Books')
        }

        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
          const bookInfo = data.items[0].volumeInfo
          if (bookInfo.description) {
            // Limpiar HTML si existe en la descripción
            const cleanDescription = bookInfo.description
              .replace(/<[^>]*>/g, '') // Eliminar tags HTML
              .trim()
            setDescription(cleanDescription)
          }
        }
      } catch (error) {
        console.error('Error obteniendo sinopsis:', error)
        // Si hay error, simplemente no mostramos sinopsis
      } finally {
        setIsLoading(false)
      }
    }

    fetchSynopsis()
  }, [titulo, autor])

  // Si está cargando o no hay descripción, no mostrar nada
  if (isLoading || !description) {
    return null
  }

  // Determinar si la descripción es larga (más de ~300 caracteres)
  const isLong = description.length > 300
  const displayText = isLong && !isExpanded 
    ? `${description.substring(0, 300)}...` 
    : description

  return (
    <div className="pt-6 border-t border-[#E5E5E5] dark:border-zinc-800">
      <h3 className="text-lg font-serif font-normal text-[#1A1A1A] dark:text-[#E4E4E7] mb-3">
        Sinopsis
      </h3>
      <p className="font-serif leading-relaxed text-[#1A1A1A]/80 dark:text-[#E4E4E7]/80 text-base">
        {displayText}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm font-sans text-[#1A1A1A]/60 dark:text-[#E4E4E7]/60 hover:text-[#1A1A1A] dark:hover:text-[#E4E4E7] hover:underline transition-colors"
        >
          {isExpanded ? 'Leer menos' : 'Leer más'}
        </button>
      )}
    </div>
  )
}

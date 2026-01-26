'use client'

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
          
          // Verificar actualizaciones periódicamente
          setInterval(() => {
            registration.update()
          }, 60000) // Cada minuto
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

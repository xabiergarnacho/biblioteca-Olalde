'use client'

export function LetterPatternBackground() {
  // Letras aleatorias para el patrón (selección temática)
  const letters = ['a', 'g', 'k', 'm', 'ñ', 'z', 'b', 'c', 'd', 'e', 'f', 'h', 'i', 'j', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y']
  
  // Generar muchas letras dispersas para cubrir toda la pantalla
  const letterCount = 200 // Número de letras en el patrón
  
  const lettersArray = Array.from({ length: letterCount }, (_, i) => ({
    letter: letters[Math.floor(Math.random() * letters.length)],
    x: Math.random() * 100, // Posición X aleatoria (porcentaje)
    y: Math.random() * 100, // Posición Y aleatoria (porcentaje)
    size: 0.75 + Math.random() * 0.5, // Tamaño variado entre 0.75rem y 1.25rem
    rotation: Math.random() * 15 - 7.5, // Rotación aleatoria entre -7.5° y 7.5°
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0">
        {lettersArray.map((item, index) => (
          <span
            key={index}
            className="absolute text-gray-300 opacity-20 select-none"
            style={{
              fontFamily: 'Times, "Times New Roman", serif',
              fontSize: `${item.size}rem`,
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `rotate(${item.rotation}deg)`,
            }}
          >
            {item.letter}
          </span>
        ))}
      </div>
    </div>
  )
}

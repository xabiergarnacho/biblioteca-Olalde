import { ImageResponse } from 'next/og'

// Metadata para el icono
export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

// Genera el icono dinámicamente
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#FDFCF8',
        }}
      >
        <div
          style={{
            fontSize: 340,
            fontFamily: 'serif',
            color: '#1A1A1A',
            fontWeight: 'bold',
            lineHeight: 1,
          }}
        >
          O
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

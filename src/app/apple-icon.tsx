import { ImageResponse } from 'next/og'

// Metadata para el icono de Apple
export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

// Genera el icono de Apple dinámicamente
export default function AppleIcon() {
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
            fontSize: 120,
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

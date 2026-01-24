import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1A1A1A' },
    { media: '(prefers-color-scheme: dark)', color: '#18181B' },
  ],
}

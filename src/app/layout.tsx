import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import UserHeader from "@/components/UserHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Biblioteca Olalde",
    template: "%s | Biblioteca Olalde",
  },
  description: "Sistema de préstamos de la Biblioteca Olalde. Explora nuestra colección y gestiona tus lecturas.",
  keywords: ["biblioteca", "libros", "préstamos", "olalde", "lectura"],
  authors: [{ name: "Biblioteca Olalde" }],
  creator: "Biblioteca Olalde",
  publisher: "Biblioteca Olalde",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://biblioteca-olalde.vercel.app"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: "Biblioteca Olalde",
    description: "Sistema de préstamos de la Biblioteca Olalde. Explora nuestra colección y gestiona tus lecturas.",
    siteName: "Biblioteca Olalde",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Biblioteca Olalde",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biblioteca Olalde",
    description: "Sistema de préstamos de la Biblioteca Olalde",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Biblioteca Olalde",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Meta tags para iOS - Necesarios para PWA en iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Biblioteca Olalde" />
        {/* Iconos generados dinámicamente por Next.js desde icon.tsx y apple-icon.tsx */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Biblioteca Olalde" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen bg-[#FDFCF8] text-[#1A1A1A] dark:bg-[#121212] dark:text-[#E4E4E7] transition-colors duration-300`}
      >
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <Toaster />
          <UserHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

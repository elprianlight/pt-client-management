import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s — PT Client Management',
    default: 'PT Client Management System',
  },
  description:
    'Platform manajemen Personal Trainer terpadu — kelola client, sesi, workout, nutrisi, dan progress dalam satu ekosistem digital.',
  keywords: ['personal trainer', 'manajemen client', 'fitness', 'workout', 'nutrisi'],
  authors: [{ name: 'PT Management System' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08090d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}


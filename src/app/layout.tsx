import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: {
    template: '%s — PT Client Management',
    default: 'PT Client Management System',
  },
  description:
    'Platform manajemen Personal Trainer terpadu — kelola client, sesi, workout, nutrisi, dan progress dalam satu ekosistem digital.',
  keywords: ['personal trainer', 'manajemen client', 'fitness', 'workout', 'nutrisi'],
  authors: [{ name: 'PT Management System' }],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: ['/favicon.png'],
    apple: [
      { url: '/favicon.png', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-theme="dark">
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  )
}


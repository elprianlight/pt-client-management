import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-heading' })
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
    { media: '(prefers-color-scheme: dark)', color: '#1a1714' },
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-theme="light">
      <body className={`${dmSans.variable} ${dmSerif.variable} min-h-screen antialiased`}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  )
}


import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' })
const sora = Sora({ subsets: ['latin'], variable: '--font-heading' })
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
    { media: '(prefers-color-scheme: dark)', color: '#090913' },
    { media: '(prefers-color-scheme: light)', color: '#f3f4fb' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-theme="light">
      <body className={`${jakarta.variable} ${sora.variable} min-h-screen antialiased`}>
        <ThemeProvider />
        {children}
      </body>
    </html>
  )
}


import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — PT Client Management System',
  description: 'Masuk ke platform manajemen Personal Trainer terpadu',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

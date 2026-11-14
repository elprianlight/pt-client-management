'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme-store'

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const followSystem = useThemeStore((s) => s.followSystem)
  const applySystemTheme = useThemeStore((s) => s.applySystemTheme)

  // Ikuti pengaturan terang/gelap HP selama pengguna belum memilih manual
  useEffect(() => {
    if (!followSystem) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applySystemTheme(mq.matches ? 'dark' : 'light')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [followSystem, applySystemTheme])

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
  }, [theme])

  return <>{children}</>
}

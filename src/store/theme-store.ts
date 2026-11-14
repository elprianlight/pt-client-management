'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  /** PRD v2: tema bawaan mengikuti pengaturan HP sampai pengguna memilih manual. */
  followSystem: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  /** Dipakai ThemeProvider untuk menyelaraskan dengan sistem tanpa mematikan mode ikuti-sistem. */
  applySystemTheme: (theme: Theme) => void
  useSystemTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      followSystem: true,
      toggleTheme: () =>
        set({ theme: get().theme === 'dark' ? 'light' : 'dark', followSystem: false }),
      setTheme: (theme) => set({ theme, followSystem: false }),
      applySystemTheme: (theme) => set({ theme }),
      useSystemTheme: () => set({ followSystem: true }),
    }),
    {
      name: 'pt-theme-storage',
    }
  )
)

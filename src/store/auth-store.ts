'use client'

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  canAccess: (requiredRoles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        role: null,
        isLoading: true,
        isAuthenticated: false,

        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            role: user?.role ?? null,
          }),

        setRole: (role) => set({ role }),

        setLoading: (isLoading) => set({ isLoading }),

        clearAuth: () =>
          set({
            user: null,
            role: null,
            isAuthenticated: false,
          }),

        hasRole: (role) => {
          const currentRole = get().role
          if (!currentRole) return false
          if (Array.isArray(role)) return role.includes(currentRole)
          return currentRole === role
        },

        canAccess: (requiredRoles) => {
          const currentRole = get().role
          if (!currentRole) return false
          return requiredRoles.includes(currentRole)
        },
      }),
      {
        name: 'pt-auth-storage',
        partialize: (state) => ({
          user: state.user,
          role: state.role,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
)

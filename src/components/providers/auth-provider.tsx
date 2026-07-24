'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import type { UserRole } from '@/types'

export function AuthProvider({ user, role }: { user: any; role: UserRole }) {
  const initialized = useRef(false)
  
  // We initialize the store immediately on render so child components 
  // (like Sidebar/Header) have the correct state right away.
  if (!initialized.current) {
    useAuthStore.setState({ user, role, isAuthenticated: !!user, isLoading: false })
    initialized.current = true
  }

  // To ensure reactivity and sync if props change
  useEffect(() => {
    useAuthStore.setState({ user, role, isAuthenticated: !!user, isLoading: false })
  }, [user, role])

  return null
}

import { create } from 'zustand'

interface LayoutState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void

  isSessionModalOpen: boolean
  openSessionModal: () => void
  closeSessionModal: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  isSessionModalOpen: false,
  openSessionModal: () => set({ isSessionModalOpen: true }),
  closeSessionModal: () => set({ isSessionModalOpen: false }),
}))

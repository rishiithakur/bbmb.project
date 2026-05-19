import { create } from 'zustand'

// Detect if the initial viewport is mobile-sized.
// Sidebar defaults OPEN on desktop (≥768px), CLOSED on mobile.
const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768

interface UIState {
  sidebarOpen: boolean
  activeSiteId: number | null
  rightPanelVisible: boolean
  bottomPanelVisible: boolean

  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  closeSidebarOnMobile: () => void
  setActiveSiteId: (id: number | null) => void
  setRightPanel: (v: boolean) => void
  setBottomPanel: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Open on desktop, closed on mobile — checked once at app boot
  sidebarOpen: !isMobileViewport(),
  activeSiteId: null,
  rightPanelVisible: false,
  bottomPanelVisible: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  // Convenience: only closes sidebar when on mobile (≤768px).
  // Used by nav-link clicks so on desktop the sidebar stays open.
  closeSidebarOnMobile: () => {
    if (isMobileViewport()) set({ sidebarOpen: false })
  },

  setActiveSiteId: (id) => set({ activeSiteId: id, rightPanelVisible: id !== null }),
  setRightPanel: (v) => set({ rightPanelVisible: v }),
  setBottomPanel: (v) => set({ bottomPanelVisible: v }),
}))

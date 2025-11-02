import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User, UserRole } from '@/lib/types'

interface AuthState {
  user: SupabaseUser | null
  userProfile: User | null
  initialized: boolean
  setUser: (user: SupabaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setInitialized: (initialized: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      initialized: false,
      setUser: (user) => set({ user }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setInitialized: (initialized) => set({ initialized }),
      logout: () => set({ user: null, userProfile: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
      }),
    }
  )
)


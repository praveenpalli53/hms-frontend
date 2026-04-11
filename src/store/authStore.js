import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,          // { id, name, email, role }

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      login: (token, user) => set({ accessToken: token, user }),

      logout: () => set({ accessToken: null, user: null }),

      hasRole: (roles) => {
        const role = useAuthStore.getState().user?.role
        return roles.includes(role)
      },
    }),
    {
      name: 'hms-auth',
    }
  )
)

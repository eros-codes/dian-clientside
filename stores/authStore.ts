"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  iban?: string | null;
  [key: string]: any;
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
  setUser: (u: User | null) => void;
  setTokens: (access?: string | null, refresh?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
      get isAuthenticated() {
        return !!this.user;
      },

      setUser: (u: User | null) => set({ user: u }),
      setTokens: (access?: string | null, refresh?: string | null) =>
        set({ accessToken: access ?? null, refreshToken: refresh ?? null }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);

export default useAuthStore;

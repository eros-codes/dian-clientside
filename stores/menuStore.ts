"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MenuType = 'CAFE' | 'RESTAURANT';

interface MenuState {
  menuType: MenuType | null;
  hasHydrated: boolean;
  setMenuType: (type: MenuType) => void;
  clearMenuType: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      menuType: null,
      hasHydrated: false,
      setMenuType: (type) => set({ menuType: type }),
      clearMenuType: () => set({ menuType: null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'menu-preference',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ menuType: state.menuType }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

'use client';

import { useCartStore } from '@/stores/cartStore';
import { useSharedCart } from './useSharedCart';
import { useCurrentTable } from './useCurrentTable';
import { Product, SelectedOption } from '@/types';

/**
 * Hook that syncs cart operations to both local store and server
 * اضافه کردن, حذف, و آپدیت تعداد را هم محلی و هم سرور sync می‌کند
 * 
 * NOTE: useSharedCart() should be called ONCE in Header component
 * This hook uses the singleton instance created there
 */
export function useSyncedCart() {
  const cartStore = useCartStore();
  const sharedCart = useSharedCart(); // Get the singleton instance initialized in Header
  
  // Get sessionId from store (saved in Header when QR is scanned)
  const sessionId = cartStore.sessionId;
  const isSessionActive = Boolean(sessionId && sessionId.trim().length);

  const addItem = async (
    product: Product,
    quantity: number = 1,
    options?: SelectedOption[]
  ) => {
    // Always add to local store first
    // Only perform local update — server-side shared cart removed
    cartStore.addItem(product, quantity, options);
  };

  const removeItem = async (itemId: string) => {
    // Local-only remove (server shared cart removed)
    cartStore.removeItem(itemId);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // Local-only quantity update
    cartStore.updateQuantity(itemId, quantity);
  };

  return {
    items: cartStore.items,
    totalItems: cartStore.totalItems,
    totalAmount: cartStore.totalAmount,
    isOpen: cartStore.isOpen,
    addItem,
    removeItem,
    updateQuantity,
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
    clearCart: cartStore.clearCart,
  };
}

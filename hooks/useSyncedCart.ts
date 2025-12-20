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

  // Defensive check: if sharedCart is not properly initialized
  const hasSharedCart = sharedCart && typeof sharedCart.addItem === 'function';

  const addItem = async (
    product: Product,
    quantity: number = 1,
    options?: SelectedOption[]
  ) => {
    // Always add to local store first
    cartStore.addItem(product, quantity, options);

    // If there's an active session AND sharedCart is available, sync to server
    if (isSessionActive && sessionId && hasSharedCart) {
      try {
        await sharedCart.addItem(product, quantity, options);
        console.log('✅ Item synced to server:', product.id);
      } catch (error) {
        console.error('❌ Failed to sync item to server:', error);
        // Don't rethrow - let local update persist
      }
    }
  };

  const removeItem = async (itemId: string) => {
    cartStore.removeItem(itemId);

    if (isSessionActive && sessionId && hasSharedCart) {
      try {
        await sharedCart.removeItem(itemId);
        console.log('✅ Item removed from server:', itemId);
      } catch (error) {
        console.error('❌ Failed to remove item from server:', error);
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    cartStore.updateQuantity(itemId, quantity);

    if (isSessionActive && sessionId && hasSharedCart) {
      try {
        await sharedCart.updateQuantity(itemId, quantity);
        console.log('✅ Quantity synced to server:', itemId, quantity);
      } catch (error) {
        console.error('❌ Failed to update quantity on server:', error);
      }
    }
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

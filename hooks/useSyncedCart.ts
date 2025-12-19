'use client';

import { useCartStore } from '@/stores/cartStore';
import { useSharedCart } from './useSharedCart';
import { useCurrentTable } from './useCurrentTable';
import { Product, SelectedOption } from '@/types';

/**
 * Hook that syncs cart operations to both local store and server
 * اضافه کردن, حذف, و آپدیت تعداد را هم محلی و هم سرور sync می‌کند
 */
export function useSyncedCart() {
  const cartStore = useCartStore();
  const { isSessionActive, tableId } = useCurrentTable();
  
  // Pass tableId directly to useSharedCart so it initializes properly
  const sharedCart = useSharedCart(tableId || undefined);

  const addItem = async (
    product: Product,
    quantity: number = 1,
    options?: SelectedOption[]
  ) => {
    // Always add to local store first
    cartStore.addItem(product, quantity, options);

    // If there's an active session, also sync to server
    if (isSessionActive && tableId) {
      try {
        await sharedCart.addItem(
          product.id,
          quantity,
          product.price,
          product.price,
          0,
          options
        );
        console.log('✅ Item synced to server:', product.id);
      } catch (error) {
        console.error('❌ Failed to sync item to server:', error);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    cartStore.removeItem(itemId);

    if (isSessionActive && tableId) {
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

    if (isSessionActive && tableId) {
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

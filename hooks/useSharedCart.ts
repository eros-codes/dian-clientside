"use client";

import { useCallback, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

// Local-only shared-cart replacement: no network, no queueing.
export const useSharedCart = (tableId?: string) => {
  const {
    setTableId,
    items,
    addItem: storeAddItem,
    updateQuantity: storeUpdateQuantity,
    removeItem: storeRemoveItem,
    clearCart: storeClearCart,
  } = useCartStore();

  useEffect(() => {
    setTableId(tableId ?? null);
  }, [setTableId, tableId]);

  const addItem = useCallback((product: any, quantity = 1, options?: any[]) => {
    storeAddItem(product, quantity, options);
  }, [storeAddItem]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    storeUpdateQuantity(itemId, quantity);
  }, [storeUpdateQuantity]);

  const removeItem = useCallback((itemId: string) => {
    storeRemoveItem(itemId);
  }, [storeRemoveItem]);

  const fetchCart = useCallback(() => ({ items }), [items]);

  const clearCart = useCallback(() => storeClearCart(), [storeClearCart]);

  // initialization handled in useEffect to avoid state updates during render

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    fetchCart,
    clearCart,
    getPendingCount: () => 0,
    isConnected: false,
  };
};

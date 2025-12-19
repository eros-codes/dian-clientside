'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { SelectedOption } from '@/types';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  baseUnitPrice: number;
  optionsSubtotal: number;
  options: Record<string, any>[];
}

export interface SharedCart {
  id: string;
  tableId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: string;
}

/**
 * Hook for managing shared table carts with real-time sync
 * میز کو share کرتے ہوئے real-time sync فراہم کرتا ہے
 */
  export const useSharedCart = (tableId?: string) => {
    const socketRef = useRef<any>(null);
    const {
      setTableId,
      items,
      clearCart: storeClearCart,
    } = useCartStore();

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

    // Helper to update local store from server cart
    const updateLocalStore = (cart: SharedCart) => {
    if (!cart || !Array.isArray(cart.items)) {
      console.error('Invalid cart:', cart);
      return;
    }
    
    storeClearCart();
    
    cart.items.forEach(item => {
      if (!item?.productId) return;
      
      const { addItem } = useCartStore.getState();
      const product = { id: item.productId, name: '', price: item.unitPrice || 0, images: [] } as any;
      const options = Array.isArray(item.options) ? item.options.map(opt => ({
        id: opt?.id, name: opt?.name || '', additionalPrice: Number(opt?.additionalPrice) || 0
      })) : [];
      
      addItem(product, item.quantity || 1, options);
    });
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!tableId) return;

    setTableId(tableId);

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const socketUrl = apiBaseUrl
          .replace(/\/api\/?$/, '')
          .replace(/\/$/, '');

        socketRef.current = io(socketUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
          socketRef.current.emit('joinCart', { tableId, userId: undefined });
        });

        socketRef.current.on('cartSubscribed', (data: any) => {
          // Cart subscribed
        });

        socketRef.current.on('cartUpdated', (data: { cart: SharedCart }) => {
          updateLocalStore(data.cart);
        });

        socketRef.current.on('userJoined', (data: any) => {
          // User joined cart
        });

        socketRef.current.on('userLeft', (data: any) => {
          // User left cart
        });

        socketRef.current.on('error', (error: any) => {
          console.error('Socket error:', error);
        });

        socketRef.current.on('disconnect', () => {
          // Disconnected from cart server
        });
      } catch (error) {
        // Failed to initialize socket
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveCart', { tableId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [tableId, setTableId]);

  // Fetch initial cart data
  useEffect(() => {
    if (!tableId) return;
    
    const fetchInitialCart = async () => {
      try {
        const url = `${apiBaseUrl}/api/shared-carts/${tableId}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = (await response.json()) as SharedCart;
          updateLocalStore(data);
        }
      } catch (error) {
        console.error('Failed to fetch initial cart:', error);
      }
    };

    fetchInitialCart();
  }, [tableId, apiBaseUrl]);

  // Add item to shared cart
  const addItem = async (
    productId: string,
    quantity: number,
    unitPrice: number,
    baseUnitPrice: number,
    optionsSubtotal?: number,
    options?: Record<string, any>[] | null,
  ) => {
    if (!tableId) throw new Error('Table ID not set');

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${tableId}/items`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          unitPrice,
          baseUnitPrice,
          optionsSubtotal: optionsSubtotal || 0,
          options: options || [],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SharedCart;
      updateLocalStore(data);
      return data;
    } catch (error) {
      console.error('Failed to add item to shared cart:', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!tableId) throw new Error('Table ID not set');

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${tableId}/items/${itemId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SharedCart;
      updateLocalStore(data);
      return data;
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      throw error;
    }
  };

  // Remove item
  const removeItemAsync = async (itemId: string) => {
    if (!tableId) throw new Error('Table ID not set');

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${tableId}/items/${itemId}`;
      const response = await fetch(url, { method: 'DELETE' });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SharedCart;
      updateLocalStore(data);
      return data;
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  };

  // Get current cart
  const fetchCart = async () => {
    if (!tableId) throw new Error('Table ID not set');

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${tableId}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SharedCart;
      updateLocalStore(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    }
  };

  // Clear cart
  const clearCartAsync = async () => {
    if (!tableId) throw new Error('Table ID not set');

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${tableId}`;
      const response = await fetch(url, { method: 'DELETE' });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SharedCart;
      updateLocalStore(data);
      return data;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  return {
    items,
    addItem,
    updateQuantity,
    removeItem: removeItemAsync,
    fetchCart,
    clearCart: clearCartAsync,
    isConnected: socketRef.current?.connected || false,
  };
};

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
    if (!cart) {
      console.warn('⚠️ Cart is null or undefined, skipping update');
      return;
    }
    
    if (!Array.isArray(cart.items)) {
      console.error('❌ Invalid cart structure - items is not an array:', cart);
      return;
    }

    console.log('🔄 Updating local store with server cart. Items:', cart.items.length);
    
    const currentState = useCartStore.getState();
    const existingItemCount = currentState.items.length;
    
    // Always sync with server state — if server has 0 items, clear local
    // (This ensures consistency across devices)
    console.log(`📊 Server: ${cart.items.length} items, Local: ${existingItemCount} items`);
    
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
    
    console.log('✅ Local store synced. Now has', useCartStore.getState().items.length, 'items');
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!tableId) {
      console.log('⏭️ No tableId, skipping WebSocket init');
      return;
    }

    console.log('🚀 Initializing shared cart for table:', tableId);
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
          console.log('✅ WebSocket connected');
          socketRef.current.emit('joinCart', { tableId, userId: undefined });
        });

        socketRef.current.on('cartSubscribed', (data: any) => {
          console.log('📡 Cart subscribed:', data);
        });

        socketRef.current.on('cartUpdated', (data: { cart: SharedCart }) => {
          console.log('🔔 Cart updated from other device:', data.cart.items.length, 'items');
          updateLocalStore(data.cart);
        });

        socketRef.current.on('userJoined', (data: any) => {
          console.log('👤 User joined cart');
        });

        socketRef.current.on('userLeft', (data: any) => {
          console.log('👤 User left cart');
        });

        socketRef.current.on('error', (error: any) => {
          console.error('❌ Socket error:', error);
        });

        socketRef.current.on('disconnect', () => {
          console.warn('⚠️ WebSocket disconnected');
        });
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
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
      console.log('📥 Fetching initial cart for table:', tableId);
      try {
        const url = `${apiBaseUrl}/api/shared-carts/${tableId}`;
        const response = await fetch(url);

        if (response.ok) {
          const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
          // Handle both wrapped and unwrapped responses
          const cart = 'data' in json ? json.data : json;
          console.log('📦 Initial cart fetched:', cart.items.length, 'items');
          updateLocalStore(cart);
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial cart:', error);
      }
    };

    fetchInitialCart();
  }, [tableId, apiBaseUrl]);

  // Sync local items with server when items change locally
  useEffect(() => {
    if (!tableId) return;

    const syncLocalItemsWithServer = async () => {
      try {
        // Get current server state
        const response = await fetch(`${apiBaseUrl}/api/shared-carts/${tableId}`);
        if (!response.ok) return;
        
        const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
        const serverCart = 'data' in json ? json.data : json;
        const serverItemIds = new Set(serverCart.items.map(si => si.id));

        // Find new items (items in local store that aren't on server)
        for (const localItem of items) {
          if (!serverItemIds.has(localItem.id)) {
            console.log('⬆️ Pushing new item to server:', localItem.productId);
            await addItem(
              localItem.productId,
              localItem.quantity,
              localItem.unitPrice,
              localItem.baseUnitPrice,
              localItem.optionsSubtotal,
              localItem.options
            );
          }
        }
      } catch (error) {
        console.error('❌ Failed to sync local items with server:', error);
      }
    };

    // Debounce the sync to avoid too many requests
    const timer = setTimeout(() => {
      syncLocalItemsWithServer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [items, tableId, apiBaseUrl]);

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
      const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
      const cart = 'data' in json ? json.data : json;
      updateLocalStore(cart);
      return cart;
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
      const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
      const cart = 'data' in json ? json.data : json;
      updateLocalStore(cart);
      return cart;
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
      const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
      const cart = 'data' in json ? json.data : json;
      updateLocalStore(cart);
      return cart;
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
      const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
      const cart = 'data' in json ? json.data : json;
      updateLocalStore(cart);
      return cart;
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
      const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
      const cart = 'data' in json ? json.data : json;
      updateLocalStore(cart);
      return cart;
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

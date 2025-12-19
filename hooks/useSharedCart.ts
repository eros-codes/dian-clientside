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
    const tableIdRef = useRef<string | null>(null);
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
    
    cart.items.forEach(serverItem => {
      if (!serverItem?.productId) return;
      
      const { addItem } = useCartStore.getState();
      const product = { 
        id: serverItem.productId, 
        name: '', 
        price: serverItem.unitPrice || 0, 
        images: [] 
      } as any;
      
      // Use the server-generated item ID to maintain consistency
      // addItem will create the same ID locally as on server
      const localItem = {
        id: serverItem.id, // Use server ID directly
        productId: serverItem.productId,
        product,
        quantity: serverItem.quantity || 1,
        unitPrice: serverItem.unitPrice,
        baseUnitPrice: serverItem.baseUnitPrice,
        options: Array.isArray(serverItem.options) ? serverItem.options : [],
        optionsSubtotal: serverItem.optionsSubtotal || 0,
      };
      
      // Directly update store state instead of going through addItem
      // to preserve the server-generated IDs
      useCartStore.setState((state) => {
        const newItems = [...state.items, localItem as any];
        const { totalItems, totalAmount } = calculateTotals(newItems);
        return { items: newItems, totalItems, totalAmount };
      });
    });
    
    console.log('✅ Local store synced. Now has', useCartStore.getState().items.length, 'items');
  };

  // Helper function to calculate totals (same as in cartStore)
  const calculateTotals = (items: any[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    return { totalItems, totalAmount };
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!tableId) {
      console.log('⏭️ No tableId, skipping WebSocket init');
      return;
    }

    // Store tableId in ref so it's always available in closures
    tableIdRef.current = tableId;
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
    const currentTableId = tableIdRef.current;
    if (!currentTableId) return;
    
    const fetchInitialCart = async () => {
      console.log('📥 Fetching initial cart for table:', currentTableId);
      try {
        const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}`;
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

  // TODO: Sync local items with server when items change locally
  // Commented out for now as it causes duplicates - items should be added directly via addItem
  // useEffect(() => {
  //   if (!tableId) return;
  //   ...
  // }, [items, tableId, apiBaseUrl]);

  // Add item to shared cart
  const addItem = async (
    productId: string,
    quantity: number,
    unitPrice: number,
    baseUnitPrice: number,
    optionsSubtotal?: number,
    options?: Record<string, any>[] | null,
  ) => {
    const currentTableId = tableIdRef.current;
    if (!currentTableId) {
      console.warn('⚠️ No table session, skipping server sync. Item added locally only.');
      return null; // Return null instead of throwing
    }

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items`;
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
    const currentTableId = tableIdRef.current;
    if (!currentTableId) {
      console.warn('⚠️ No table session, skipping server sync. Quantity updated locally only.');
      return null;
    }

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items/${itemId}`;
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
    const currentTableId = tableIdRef.current;
    if (!currentTableId) {
      console.warn('⚠️ No table session, skipping server sync. Item removed locally only.');
      return null;
    }

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items/${itemId}`;
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
    const currentTableId = tableIdRef.current;
    if (!currentTableId) {
      console.warn('⚠️ No table session, cannot fetch from server.');
      return null;
    }

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}`;
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
    const currentTableId = tableIdRef.current;
    if (!currentTableId) {
      console.warn('⚠️ No table session, cannot clear from server.');
      return null;
    }

    try {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}`;
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

'use client';

import { useEffect } from 'react';
import { productsApi } from '@/lib/api';
import { readCurrentTable } from './useCurrentTable';
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
// Module-level singletons so Header can initialize once and other callers
// get the same socket/tableId state.
const socketRef: { current: any | null } = { current: null };
const tableIdRef: { current: string | null } = { current: null };

  export const useSharedCart = (tableId?: string) => {
    const {
      setTableId,
      items,
      clearCart: storeClearCart,
    } = useCartStore();

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

    // Helper to update local store from server cart — fetch product metadata when needed
    const updateLocalStore = async (cart: SharedCart) => {
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

    // Build local items, fetching product metadata when needed
    const productFetches: Array<Promise<void>> = [];
    const localItems: any[] = [];

    cart.items.forEach(serverItem => {
      if (!serverItem?.productId) return;

      const productPlaceholder = {
        id: serverItem.productId,
        name: '',
        price: serverItem.unitPrice || 0,
        images: [] as string[],
      } as any;

      const localItem = {
        id: serverItem.id,
        productId: serverItem.productId,
        product: productPlaceholder,
        quantity: serverItem.quantity || 1,
        unitPrice: serverItem.unitPrice,
        baseUnitPrice: serverItem.baseUnitPrice,
        options: Array.isArray(serverItem.options) ? serverItem.options : [],
        optionsSubtotal: serverItem.optionsSubtotal || 0,
      };

      // Fetch product details asynchronously
      const fetchPromise = (async () => {
        try {
          const prod = await productsApi.getProduct(serverItem.productId);
          if (prod) {
            localItem.product.name = prod.name || localItem.product.name;
            localItem.product.images = (prod.images && prod.images.length) ? prod.images : localItem.product.images;
            localItem.product.price = prod.price ?? localItem.product.price;
          }
        } catch (e) {
          // ignore fetch errors — use placeholder
        }
      })();

      productFetches.push(fetchPromise);
      localItems.push(localItem);
    });

    try {
      await Promise.all(productFetches);
    } catch {}

    // Write new items in single state update
    useCartStore.setState((state) => {
      const newItems = [...localItems];
      const { totalItems, totalAmount } = calculateTotals(newItems);
      return { items: newItems, totalItems, totalAmount };
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

  // Initialize WebSocket connection. Use provided tableId, or fallback to module ref or localStorage.
  useEffect(() => {
    const effectiveTableId = tableId || tableIdRef.current || readCurrentTable()?.tableId || null;
    if (!effectiveTableId) {
      console.log('⏭️ No tableId, skipping WebSocket init');
      return;
    }

    // If socket already exists for same tableId, skip re-init
    if (socketRef.current && tableIdRef.current === effectiveTableId) {
      // already initialized
      return;
    }

    // Store tableId in ref so it's always available in closures
    tableIdRef.current = effectiveTableId;
    console.log('🚀 Initializing shared cart for table:', effectiveTableId);
    setTableId(effectiveTableId);

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const socketUrl = apiBaseUrl
          .replace(/\/api\/?$/, '')
          .replace(/\/$/, '');

        console.log('🔗 socketUrl:', socketUrl);

        // Prefer polling first to avoid websocket upgrade/TransportError in some environments (proxy/CORS)
        socketRef.current = io(socketUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['polling', 'websocket'],
          upgrade: true,
        });

        socketRef.current.on('connect', () => {
          console.log('✅ WebSocket connected');
          // Use module-level tableIdRef in case tableId changed before connect
          try {
            const payload = { tableId: tableIdRef.current, userId: undefined };
            console.log('📣 Emitting joinCart', payload);
            // include optional ack to log server response if supported
            socketRef.current.emit('joinCart', payload, (ack: any) => {
              console.log('📣 joinCart ack:', ack);
            });
          } catch (e) {
            console.warn('❌ Failed to emit joinCart', e);
          }
        });
        socketRef.current.on('connect_error', (err: any) => {
          console.error('❌ Socket connect_error:', err);
        });
        socketRef.current.on('connect_timeout', (err: any) => {
          console.error('❌ Socket connect_timeout:', err);
        });
        socketRef.current.on('reconnect_attempt', (n: number) => {
          console.log('🔁 Socket reconnect attempt', n);
        });

        socketRef.current.on('cartSubscribed', (data: any) => {
          console.log('📡 Cart subscribed:', data);
        });

        socketRef.current.on('cartUpdated', (data: { cart: SharedCart }) => {
          console.log('🔔 Cart updated from other device:', data.cart.items.length, 'items');
          // Fire-and-forget update (async)
          updateLocalStore(data.cart).catch((e) => console.error('Failed to apply remote cart update', e));
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
        try {
          socketRef.current.emit('leaveCart', { tableId: tableIdRef.current });
        } catch {}
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  // run when provided tableId changes or on mount
  }, [tableId, setTableId]);

  // Fetch initial cart data
  // Wait-for utility: if add/update called before Header sets tableId, wait briefly
  const waitForTableId = async (timeoutMs = 2000) => {
    const start = Date.now();
    while (!tableIdRef.current && Date.now() - start < timeoutMs) {
      // Try reading from localStorage as a fallback (handles multiple bundles)
      try {
        const stored = readCurrentTable();
        if (stored?.tableId) {
          tableIdRef.current = stored.tableId;
          break;
        }
      } catch (e) {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    // final attempt to read storage
    if (!tableIdRef.current) {
      try {
        const stored = readCurrentTable();
        if (stored?.tableId) tableIdRef.current = stored.tableId;
      } catch {}
    }
    return tableIdRef.current;
  };
  useEffect(() => {
    if (!tableId) {
      console.log('⏭️ No tableId, cannot fetch initial cart');
      return;
    }
    
    tableIdRef.current = tableId; // Ensure ref is set
    
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
          await updateLocalStore(cart);
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
    let currentTableId = tableIdRef.current;
    if (!currentTableId) {
      currentTableId = await waitForTableId(2000);
    }

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
      await updateLocalStore(cart);
      return cart;
    } catch (error) {
      console.error('Failed to add item to shared cart:', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    let currentTableId = tableIdRef.current;
    if (!currentTableId) currentTableId = await waitForTableId(2000);
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
      await updateLocalStore(cart);
      return cart;
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      throw error;
    }
  };

  // Remove item
  const removeItemAsync = async (itemId: string) => {
    let currentTableId = tableIdRef.current;
    if (!currentTableId) currentTableId = await waitForTableId(2000);
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
      await updateLocalStore(cart);
      return cart;
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  };

  // Get current cart
  const fetchCart = async () => {
    let currentTableId = tableIdRef.current;
    if (!currentTableId) currentTableId = await waitForTableId(2000);
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
      await updateLocalStore(cart);
      return cart;
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      throw error;
    }
  };

  // Clear cart
  const clearCartAsync = async () => {
    let currentTableId = tableIdRef.current;
    if (!currentTableId) currentTableId = await waitForTableId(2000);
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
      await updateLocalStore(cart);
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

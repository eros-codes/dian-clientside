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
const fetchingRef: { current: boolean } = { current: false };
// Pending actions queue (persisted) for reliable saves when network fails
type PendingAction =
  | { type: 'add'; payload: any; attempts?: number }
  | { type: 'update'; payload: any; attempts?: number }
  | { type: 'remove'; payload: any; attempts?: number }
  | { type: 'clear'; payload?: any; attempts?: number };
const PENDING_KEY = 'pendingSharedCartActions';
const queueRef: { current: PendingAction[] } = { current: [] };
const runningRef: { current: boolean } = { current: false };
const timerRef: { current: number | null } = { current: null };

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

    // Do not clear the cart to avoid transient empty UI

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

    // Write new items in a single state update (do NOT clear first — avoids UI blink)
    const newItems = [...localItems];
    const { totalItems, totalAmount } = calculateTotals(newItems);
    useCartStore.setState(() => ({ items: newItems, totalItems, totalAmount }));

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

  // Persist/load pending queue
  const saveQueueToStorage = () => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(queueRef.current || []));
      try { window.dispatchEvent(new CustomEvent('sharedCart:queueChanged', { detail: { length: (queueRef.current||[]).length } })); } catch {}
    } catch {}
  };

  const loadQueueFromStorage = () => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return [] as PendingAction[];
      const parsed = JSON.parse(raw) as PendingAction[];
      queueRef.current = Array.isArray(parsed) ? parsed : [];
      try { window.dispatchEvent(new CustomEvent('sharedCart:queueChanged', { detail: { length: queueRef.current.length } })); } catch {}
      return queueRef.current;
    } catch {
      queueRef.current = [];
      return [] as PendingAction[];
    }
  };

  const enqueueAction = (action: PendingAction) => {
    queueRef.current = queueRef.current || [];
    queueRef.current.push({ attempts: 0, ...action });
    saveQueueToStorage();
    console.log('🗂️ Enqueued shared-cart action:', action.type, 'queueLength=', queueRef.current.length);
    scheduleFlush(0);
  };

  const performAction = async (action: PendingAction) => {
    const currentTableId = tableIdRef.current;
    if (!currentTableId) throw new Error('no-table');

    if (action.type === 'add') {
      const body = action.payload;
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          const errMsg = `HTTP ${res.status} ${res.statusText} ${txt}`;
          console.error('performAction:add http error:', errMsg, url, body);
          throw new Error(errMsg);
        }
        const json = await res.json();
        const cart = 'data' in json ? json.data : json;
        await updateLocalStore(cart);
        return cart;
      } catch (err: any) {
        const isNetwork = err instanceof TypeError || String(err.message).includes('Failed to fetch');
        console.error('performAction:add failed', { isNetwork, message: err?.message, action, url });
        throw err;
      }
    }

    if (action.type === 'update') {
      const { itemId, quantity } = action.payload;
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items/${itemId}`;
      try {
        const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          const errMsg = `HTTP ${res.status} ${res.statusText} ${txt}`;
          console.error('performAction:update http error:', errMsg, url, { itemId, quantity });
          throw new Error(errMsg);
        }
        const json = await res.json();
        const cart = 'data' in json ? json.data : json;
        await updateLocalStore(cart);
        return cart;
      } catch (err: any) {
        const isNetwork = err instanceof TypeError || String(err.message).includes('Failed to fetch');
        console.error('performAction:update failed', { isNetwork, message: err?.message, action, url });
        throw err;
      }
    }

    if (action.type === 'remove') {
      const { itemId } = action.payload;
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}/items/${itemId}`;
      try {
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          const errMsg = `HTTP ${res.status} ${res.statusText} ${txt}`;
          console.error('performAction:remove http error:', errMsg, url, { itemId });
          throw new Error(errMsg);
        }
        const json = await res.json();
        const cart = 'data' in json ? json.data : json;
        await updateLocalStore(cart);
        return cart;
      } catch (err: any) {
        const isNetwork = err instanceof TypeError || String(err.message).includes('Failed to fetch');
        console.error('performAction:remove failed', { isNetwork, message: err?.message, action, url });
        throw err;
      }
    }

    if (action.type === 'clear') {
      const url = `${apiBaseUrl}/api/shared-carts/${currentTableId}`;
      try {
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          const errMsg = `HTTP ${res.status} ${res.statusText} ${txt}`;
          console.error('performAction:clear http error:', errMsg, url);
          throw new Error(errMsg);
        }
        const json = await res.json();
        const cart = 'data' in json ? json.data : json;
        await updateLocalStore(cart);
        return cart;
      } catch (err: any) {
        const isNetwork = err instanceof TypeError || String(err.message).includes('Failed to fetch');
        console.error('performAction:clear failed', { isNetwork, message: err?.message, action, url });
        throw err;
      }
    }
  };

  const scheduleFlush = (delayMs = 500) => {
    try {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setTimeout(async () => {
        // If already running, we'll still attempt again once the current run finishes
        try {
          await flushQueue();
        } catch {}
      }, delayMs);
    } catch {}
  };

  const flushQueue = async () => {
    if (runningRef.current) return; // avoid concurrent runs
    runningRef.current = true;
    try {
      loadQueueFromStorage();
        console.log('🗂️ Flushing shared-cart queue, length=', queueRef.current.length);
      if (!queueRef.current || queueRef.current.length === 0) return;

      // Process sequentially
      for (let i = 0; i < queueRef.current.length; ) {
        const action = queueRef.current[i];
        try {
            console.debug('Flushing action', action);
            await performAction(action);
          // remove from queue
          queueRef.current.splice(i, 1);
          saveQueueToStorage();
          try { window.dispatchEvent(new CustomEvent('sharedCart:queueChanged', { detail: { length: queueRef.current.length } })); } catch {}
        } catch (err) {
          action.attempts = (action.attempts || 0) + 1;
          // If too many attempts, drop and log
          if ((action.attempts || 0) >= 5) {
            console.warn('Dropping pending shared-cart action after retries', action);
            queueRef.current.splice(i, 1);
            saveQueueToStorage();
            try { window.dispatchEvent(new CustomEvent('sharedCart:queueChanged', { detail: { length: queueRef.current.length } })); } catch {}
            continue;
          }
          // exponential backoff for next retry
          const backoff = Math.min(30000, 500 * Math.pow(2, (action.attempts || 1)));
          // schedule another flush later and move to next item
          scheduleFlush(backoff);
          i++;
        }
      }
    } finally {
      runningRef.current = false;
    }
  };

  const getPendingCount = () => (queueRef.current ? queueRef.current.length : 0);

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
            const s = socketRef.current;
            const payload = { tableId: tableIdRef.current, userId: undefined };
            console.log('📣 Emitting joinCart', payload);
            if (s && typeof s.emit === 'function') {
              s.emit('joinCart', payload, (ack: any) => {
                console.log('📣 joinCart ack:', ack);
                // Try flushing any pending actions when socket is available
                try {
                  scheduleFlush(0);
                } catch {}
              });
            } else {
              console.warn('⚠️ Socket not available to emit joinCart');
            }
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
        // On full reconnect, re-join the cart room to ensure server sends missed updates
        socketRef.current.on('reconnect', (n: number) => {
          console.log('🔁 Socket reconnected', n);
          try {
            const s = socketRef.current;
            const payload = { tableId: tableIdRef.current, userId: undefined };
            if (s && typeof s.emit === 'function') {
              console.log('📣 Re-emitting joinCart after reconnect', payload);
              s.emit('joinCart', payload, (ack: any) => {
                console.log('📣 joinCart ack after reconnect:', ack);
                // flush pending queue after reconnect
                try {
                  scheduleFlush(0);
                } catch {}
              });
            }
          } catch (e) {
            console.warn('❌ Failed to re-emit joinCart on reconnect', e);
          }
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
    let mounted = true;
    const fetchInitialCart = async () => {
      if (fetchingRef.current) return;
      // Load any pending queued actions persisted from previous sessions
      try {
        loadQueueFromStorage();
        scheduleFlush(0);
      } catch {}
      fetchingRef.current = true;
      try {
        // Determine effective tableId: prefer provided prop, then module ref, then storage
        const effectiveTableId = tableId || tableIdRef.current || await waitForTableId(2000);
        if (!effectiveTableId) {
          console.log('⏭️ No tableId, cannot fetch initial cart');
          return;
        }

        tableIdRef.current = effectiveTableId;
        setTableId(effectiveTableId);

        console.log('📥 Fetching initial cart for table:', effectiveTableId);
        try {
          const url = `${apiBaseUrl}/api/shared-carts/${effectiveTableId}`;
          const response = await fetch(url);

          if (response.ok) {
            const json = (await response.json()) as { success: boolean; data: SharedCart; timestamp: string } | SharedCart;
            const cart = 'data' in json ? json.data : json;
            console.log('📦 Initial cart fetched:', cart.items.length, 'items');
            await updateLocalStore(cart);
          }
        } catch (error) {
          console.error('❌ Failed to fetch initial cart:', error);
        }
      } finally {
        fetchingRef.current = false;
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

    const action = {
      type: 'add' as const,
      payload: {
        productId,
        quantity,
        unitPrice,
        baseUnitPrice,
        optionsSubtotal: optionsSubtotal || 0,
        options: options || [],
      },
    };

    try {
      // Try immediate perform
      const res = await performAction(action);
      return res;
    } catch (err) {
      console.warn('Add item failed, enqueuing for retry', err);
      try {
        enqueueAction(action as any);
      } catch {}
      // Optimistically add to local store so UI shows item immediately
      try {
        const current = useCartStore.getState();
        const newItem = {
          id: `local-${Date.now()}`,
          productId,
          product: { id: productId, name: '', images: [], price: unitPrice },
          quantity,
          unitPrice,
          baseUnitPrice,
          options: options || [],
          optionsSubtotal: optionsSubtotal || 0,
        } as any;
        const newItems = [...current.items, newItem];
        const { totalItems, totalAmount } = calculateTotals(newItems);
        useCartStore.setState(() => ({ items: newItems, totalItems, totalAmount }));
      } catch {}
      return null;
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

    const action = { type: 'update' as const, payload: { itemId, quantity } };
    try {
      const res = await performAction(action);
      return res;
    } catch (err) {
      console.warn('Update quantity failed, enqueuing', err);
      try {
        enqueueAction(action as any);
      } catch {}
      // Optimistic local update
      try {
        const state = useCartStore.getState();
        const items = state.items.map((it: any) => (it.id === itemId ? { ...it, quantity } : it));
        const { totalItems, totalAmount } = calculateTotals(items);
        useCartStore.setState(() => ({ items, totalItems, totalAmount }));
      } catch {}
      return null;
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

    const action = { type: 'remove' as const, payload: { itemId } };
    try {
      const res = await performAction(action);
      return res;
    } catch (err) {
      console.warn('Remove item failed, enqueuing', err);
      try {
        enqueueAction(action as any);
      } catch {}
      // Optimistic remove locally
      try {
        const state = useCartStore.getState();
        const items = state.items.filter((it: any) => it.id !== itemId);
        const { totalItems, totalAmount } = calculateTotals(items);
        useCartStore.setState(() => ({ items, totalItems, totalAmount }));
      } catch {}
      return null;
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

    const action = { type: 'clear' as const };
    try {
      const res = await performAction(action);
      return res;
    } catch (err) {
      console.warn('Clear cart failed, enqueuing', err);
      try {
        enqueueAction(action as any);
      } catch {}
      // Clear local store optimistically
      try {
        useCartStore.setState(() => ({ items: [], totalItems: 0, totalAmount: 0 }));
      } catch {}
      return null;
    }
  };

  return {
    items,
    addItem,
    updateQuantity,
    removeItem: removeItemAsync,
    fetchCart,
    clearCart: clearCartAsync,
    getPendingCount,
    isConnected: socketRef.current?.connected || false,
  };
};

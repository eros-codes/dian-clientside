'use client';

import { useCartStore } from '@/stores/cartStore';
import { useSharedCart } from './useSharedCart';
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
  useSharedCart(); // ensure the sharedCart singleton is initialized in Header when present
  
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

    // Schedule sending full cart to server (debounced + retried)
    scheduleSend();
  };

  const removeItem = async (itemId: string) => {
    // Local-only remove (server shared cart removed)
    cartStore.removeItem(itemId);
    scheduleSend();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // Local-only quantity update
    cartStore.updateQuantity(itemId, quantity);
    scheduleSend();
  };

  const syncFromServer = async () => {
    try {
      if (!isSessionActive) return;
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const url = (apiBase.replace(/\/$/, '') || '') + '/api/cart/session';
      const res = await fetch(url, { headers: { 'x-table-session': sessionId || '' } });
      if (!res.ok) return;
      const body = await res.json();
      if (body && body.ok && body.cart) {
        try {
          const srv = body.cart;
          if (Array.isArray(srv.items)) {
            // Merge server items with local items by productId + options signature
            const localItems = cartStore.items || [];
            const mergedMap: Record<string, any> = {};

            const keyFor = (it: any) => {
              const opts = Array.isArray(it.options) ? it.options.map((o: any) => `${o.id || o.name}:${o.value ?? ''}`).sort().join('|') : '';
              return `${it.productId ?? it.product?.id ?? it.product?.sku || it.product?.name}:${opts}`;
            };

            const pushToMap = (it: any) => {
              const key = keyFor(it);
              if (!mergedMap[key]) mergedMap[key] = { product: it.product ?? it.productId ? { id: it.productId, name: it.name } : it.product, quantity: 0, options: it.options ?? [] };
              mergedMap[key].quantity += Number(it.quantity ?? 1) || 0;
            };

            for (const it of localItems) pushToMap(it);
            for (const it of srv.items) pushToMap(it);

            // Replace local store with merged items
            cartStore.clearCart();
            for (const k of Object.keys(mergedMap)) {
              const m = mergedMap[k];
              cartStore.addItem(m.product as any, m.quantity, m.options);
            }
          }
        } catch (e) {
          // ignore merge errors
        }
      }
    } catch {}
  };

  // --- send scheduling & retry helpers ---
  let sendTimer: any = null;
  let pending = false;
  const scheduleSend = (delay = 500) => {
    if (!isSessionActive) return;
    pending = true;
    if (sendTimer) clearTimeout(sendTimer);
    sendTimer = setTimeout(() => {
      pending = false;
      void attemptSendWithRetry(0);
    }, delay);
  };

  const attemptSendWithRetry = async (attempt: number) => {
    const MAX = 3;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const url = (apiBase.replace(/\/$/, '') || '') + '/api/cart/session';
      const payload = { cart: { items: cartStore.items, totalItems: cartStore.totalItems, totalAmount: cartStore.totalAmount }, ttlSeconds: 60 * 60 * 24 * 7 };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-table-session': sessionId || '' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('send_failed');
    } catch (err) {
      if (attempt < MAX - 1) {
        const backoff = Math.pow(2, attempt) * 500;
        setTimeout(() => void attemptSendWithRetry(attempt + 1), backoff);
      } else {
        // final failure: keep data locally; we'll retry on next schedule or on syncFromServer
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
    syncFromServer,
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
    clearCart: cartStore.clearCart,
  };
}

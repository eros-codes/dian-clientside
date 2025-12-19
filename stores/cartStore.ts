"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, Product, SelectedOption } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalAmount: number;
  tableId: string | null; // Track which table this cart belongs to
  sessionId: string | null; // Track the session ID (from QR scan)
  addItem: (product: Product, quantity?: number, options?: SelectedOption[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setTableId: (tableId: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
}

const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  return { totalItems, totalAmount };
};

const normalizeOptions = (options?: SelectedOption[]) => {
  return (options ?? []).map((opt) => ({
    ...opt,
    name: opt.name,
    additionalPrice: Number(opt.additionalPrice) || 0,
  }));
};

const buildCartItemId = (productId: string, options?: SelectedOption[]) => {
  if (!options || options.length === 0) return productId;
  const sorted = [...options]
    .map((opt) => ({
      key: opt.id != null ? String(opt.id) : opt.name.trim(),
      price: Number(opt.additionalPrice) || 0,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  const signature = sorted.map((opt) => `${opt.key}:${opt.price}`).join("|");
  return `${productId}::${signature}`;
};

const ensureCartItemShape = (rawItem: CartItem): CartItem => {
  const normalizedOptions = normalizeOptions(rawItem.options);
  const optionsSubtotal = normalizedOptions.reduce(
    (sum, opt) => sum + opt.additionalPrice,
    0
  );

  const inferredBaseFromProduct = Number((rawItem.product?.price ?? 0)) || 0;
  const inferredBaseFromUnit = Number(rawItem.unitPrice ?? 0) - optionsSubtotal;
  const candidateBase = Number.isFinite(Number(rawItem.baseUnitPrice))
    ? Number(rawItem.baseUnitPrice)
    : inferredBaseFromUnit;

  const baseUnitPrice = Number.isFinite(candidateBase) && candidateBase >= 0
    ? candidateBase
    : Math.max(0, inferredBaseFromProduct);

  const candidateUnit = Number(rawItem.unitPrice);
  const unitPrice = Number.isFinite(candidateUnit) && candidateUnit >= 0
    ? candidateUnit
    : baseUnitPrice + optionsSubtotal;

  const quantity = Number(rawItem.quantity);
  const sanitizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

  const id = rawItem.id ?? buildCartItemId(rawItem.productId, normalizedOptions);

  return {
    ...rawItem,
    id,
    baseUnitPrice,
    unitPrice,
    options: normalizedOptions,
    optionsSubtotal,
    quantity: sanitizedQuantity,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalAmount: 0,
      tableId: null,
      sessionId: null,

      setTableId: (tableId: string | null) => {
        set({ tableId });
      },

      setSessionId: (sessionId: string | null) => {
        set({ sessionId });
      },

      addItem: (product: Product, quantity = 1, options?: SelectedOption[]) => {
        set((state) => {
          const normalizedOptions = normalizeOptions(options);
          const optionsSubtotal = normalizedOptions.reduce(
            (sum, opt) => sum + opt.additionalPrice,
            0
          );
          const baseUnitPrice = Number(product.price) || 0;
          const unitPrice = baseUnitPrice + optionsSubtotal;
          const cartItemId = buildCartItemId(product.id, normalizedOptions);

          const existingItem = state.items.find((item) => item.id === cartItemId);

          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map((item) =>
              item.id === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            const newItem: CartItem = {
              id: cartItemId,
              productId: product.id,
              product,
              quantity,
              unitPrice,
              baseUnitPrice,
              options: normalizedOptions,
              optionsSubtotal,
            };
            newItems = [...state.items, newItem];
          }

          const sanitizedItems = newItems.map(ensureCartItemShape);

          const { totalItems, totalAmount } = calculateTotals(sanitizedItems);

          return {
            items: sanitizedItems,
            totalItems,
            totalAmount,
          };
        });
      },

      removeItem: (cartItemId: string) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== cartItemId);
          const { totalItems, totalAmount } = calculateTotals(newItems);

          return {
            items: newItems,
            totalItems,
            totalAmount,
          };
        });
      },

      updateQuantity: (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === cartItemId ? { ...item, quantity } : item
          );

          const { totalItems, totalAmount } = calculateTotals(newItems);

          return {
            items: newItems,
            totalItems,
            totalAmount,
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalAmount: 0,
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount,
        tableId: state.tableId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const sanitizedItems = (state.items ?? []).map(ensureCartItemShape);
          const { totalItems, totalAmount } = calculateTotals(sanitizedItems);
          state.items = sanitizedItems;
          state.totalItems = totalItems;
          state.totalAmount = totalAmount;
        }
      },
      // Hydrate automatically on load so persisted cart is available
      // (removed skipHydration to avoid race where other hooks clear storage before rehydrate)
    }
  )
);

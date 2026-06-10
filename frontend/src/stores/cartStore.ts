'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { CartItem, ApiResponse } from '@/types/api';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isHydrated: boolean;

  fetchItems: () => Promise<void>;
  addItem: (productId: number, poScheduleId: number, qty: number) => Promise<void>;
  updateQty: (cartId: number, qty: number) => Promise<void>;
  removeItem: (cartId: number) => Promise<void>;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setHydrated: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isHydrated: false,

      fetchItems: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get<ApiResponse<CartItem[]>>('/cart');
          set({ items: data.data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, poScheduleId, qty) => {
        await api.post('/cart', {
          product_id: productId,
          po_schedule_id: poScheduleId,
          qty,
        });
        await get().fetchItems();
      },

      updateQty: async (cartId, qty) => {
        await api.put(`/cart/${cartId}`, { qty });
        await get().fetchItems();
      },

      removeItem: async (cartId) => {
        await api.delete(`/cart/${cartId}`);
        await get().fetchItems();
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = parseFloat(item.unit_price || item.product?.price || '0');
          return total + price * item.qty;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.qty, 0);
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

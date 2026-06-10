'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User, AuthResponse, ApiResponse } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  isAuthenticated: boolean;

  login: (wa_number: string, password: string) => Promise<void>;
  register: (name: string, wa_number: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isHydrated: false,
      isAuthenticated: false,

      login: async (wa_number: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { wa_number, password });
          const { user, token } = data.data;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name, wa_number, password, password_confirmation) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
            name, wa_number, password, password_confirmation,
          });
          const { user, token } = data.data;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const token = localStorage.getItem('auth_token');
        try {
          await api.post('/auth/logout', undefined, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        } catch {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth-storage');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        window.location.href = '/';
      },

      fetchUser: async () => {
        try {
          const { data } = await api.get<ApiResponse<User>>('/auth/me');
          localStorage.setItem('auth_user', JSON.stringify(data.data));
          set({ user: data.data, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      },

      setUser: (user: User) => {
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { normalizeWhatsApp } from '@/lib/utils';
import type { LoginForm } from '@/types/api';

type LoginError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const cleanedWa = data.wa_number.replace(/[^0-9]/g, '');
      await login(cleanedWa, data.password);
      // Redirect based on role
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        router.push('/admin');
      } else if (user?.role === 'reseller') {
        router.push('/reseller/invoices');
      } else {
        router.push('/orders');
      }
    } catch (err: unknown) {
      const message = (err as LoginError).response?.data?.message;
      setError(message || 'Login gagal. Periksa nomor WA dan password.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="card !p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="text-4xl">🧡</span>
            <h1 className="mt-4 text-2xl font-bold">Selamat Datang</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Masuk ke akun Ketupat Cinta Anda</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nomor WhatsApp</label>
              <input
                {...register('wa_number', {
                  required: 'Nomor WA wajib diisi',
                  onChange: (e) => {
                    e.target.value = normalizeWhatsApp(e.target.value);
                  },
                  validate: (value) => {
                    if (!value.startsWith('08')) {
                      return 'Nomor WhatsApp harus diawali dengan 08.';
                    }
                    if (value.length < 10 || value.length > 15) {
                      return 'Nomor WhatsApp harus terdiri dari 10 sampai 15 digit.';
                    }
                    return true;
                  }
                })}
                type="tel"
                placeholder="081234567890"
                className="input-field"
              />
              {errors.wa_number && <p className="mt-1 text-xs text-red-500">{errors.wa_number.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password wajib diisi' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  className="input-field !pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Masuk
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterForm } from '@/types/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await registerUser(data.name, data.wa_number, data.password, data.password_confirmation);
      router.push('/products');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const messages = axiosErr.response?.data?.message || 'Registrasi gagal.';
      const validationErrors = axiosErr.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat()[0] as string;
        setError(firstError);
      } else {
        setError(messages);
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="card !p-8 shadow-xl">
          <div className="mb-8 text-center">
            <span className="text-4xl">🧡</span>
            <h1 className="mt-4 text-2xl font-bold">Buat Akun</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Bergabung dan pesan ketupat premium</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
              <input
                {...register('name', { required: 'Nama wajib diisi' })}
                placeholder="Nama Anda"
                className="input-field"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Nomor WhatsApp</label>
              <input
                {...register('wa_number', {
                  required: 'Nomor WA wajib diisi',
                  pattern: { value: /^\d+$/, message: 'Nomor WhatsApp hanya boleh berisi angka' },
                  minLength: { value: 10, message: 'Nomor WhatsApp minimal 10 digit' },
                  maxLength: { value: 13, message: 'Nomor WhatsApp maksimal 13 digit' },
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
                  {...register('password', { required: 'Password wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  className="input-field !pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Konfirmasi Password</label>
              <input
                {...register('password_confirmation', {
                  required: 'Konfirmasi password wajib diisi',
                  validate: (value) => value === watch('password') || 'Password tidak cocok',
                })}
                type="password"
                placeholder="Ulangi password"
                className="input-field"
              />
              {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-3.5 disabled:opacity-60">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} />
                  Daftar
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

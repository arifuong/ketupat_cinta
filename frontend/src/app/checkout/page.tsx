'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { MapPin, Truck, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { UserAddress, ApiResponse, CheckoutForm } from '@/types/api';

const shippingMethods = [
  { value: 'gosend_customer', label: 'GoSend (Customer Driver)', desc: 'Driver GoSend yang Anda pesan sendiri' },
  { value: 'gosend_toko', label: 'GoSend (Toko Driver)', desc: 'Driver GoSend dipesan oleh toko' },
  { value: 'kurir_internal', label: 'Kurir Internal', desc: 'Kurir toko langsung ke alamat Anda' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { items, getTotal, fetchItems } = useCartStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutForm>();

  const isTrustedReseller = user?.role === 'reseller' && user?.is_trusted;
  const isReseller = user?.role === 'reseller';

  const paymentMethods = useMemo(() => {
    const methods: { value: string; label: string; desc: string }[] = [];

    if (isReseller) {
      methods.push({ value: 'transfer_manual', label: 'Transfer Manual', desc: 'Upload bukti transfer bank' });
    }

    methods.push({ value: 'midtrans', label: 'Pembayaran Online', desc: 'Via Midtrans (QRIS, VA, dll)' });

    if (isTrustedReseller) {
      methods.push({ value: 'tempo', label: 'Bayar Tempo (Reseller)', desc: 'Bayar setelah pesanan selesai. Khusus reseller terpercaya.' });
    }

    return methods;
  }, [isReseller, isTrustedReseller]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role === 'admin') { router.push('/admin'); return; }
    loadData();
  }, [isHydrated, isAuthenticated, user?.role]);

  async function loadData() {
    try {
      await fetchItems();
      const { data } = await api.get<ApiResponse<UserAddress[]>>('/user/addresses');
      setAddresses(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function onSubmit(formData: CheckoutForm) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/orders', formData);
      router.push(`/orders/${data.data.id}?success=true`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const validationErrors = axiosErr.response?.data?.errors;
      if (validationErrors) {
        setError(Object.values(validationErrors).flat().join('. '));
      } else {
        setError(axiosErr.response?.data?.message || 'Checkout gagal.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isHydrated || loading) return <LoadingSpinner size="lg" />;

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <MapPin size={20} className="text-[var(--color-primary)]" />
                Alamat Pengiriman
              </h3>
              {addresses.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Belum ada alamat. <a href="/profile" className="text-[var(--color-primary)] font-medium">Tambahkan alamat</a> terlebih dahulu.
                </p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${watch('address_id') === addr.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}>
                      <input type="radio" value={addr.id} {...register('address_id', { required: 'Pilih alamat' })} className="mt-1 accent-[var(--color-primary)]" />
                      <div>
                        <span className="text-sm font-semibold">{addr.label} {addr.is_default && <span className="text-xs text-[var(--color-primary)]">(Default)</span>}</span>
                        <p className="text-sm text-[var(--color-text-muted)]">{addr.detail}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{addr.district ? `${addr.district}, ` : ''}{addr.city === 'bandung' ? 'Bandung' : 'Cimahi'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.address_id && <p className="mt-2 text-xs text-red-500">{errors.address_id.message}</p>}
            </div>

            {/* Shipping */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Truck size={20} className="text-[var(--color-secondary)]" />
                Metode Pengiriman
              </h3>
              <div className="space-y-2">
                {shippingMethods.map((method) => (
                  <label key={method.value} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${watch('shipping_method') === method.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}>
                    <input type="radio" value={method.value} {...register('shipping_method', { required: 'Pilih metode pengiriman' })} className="mt-1 accent-[var(--color-primary)]" />
                    <div>
                      <span className="text-sm font-semibold">{method.label}</span>
                      <p className="text-xs text-[var(--color-text-muted)]">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.shipping_method && <p className="mt-2 text-xs text-red-500">{errors.shipping_method.message}</p>}
            </div>

            {/* Payment */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <CreditCard size={20} className="text-[var(--color-accent)]" />
                Metode Pembayaran
              </h3>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label key={method.value} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                    watch('payment_type') === method.value
                      ? method.value === 'tempo'
                        ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                        : 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                  }`}>
                    <input type="radio" value={method.value} {...register('payment_type', { required: 'Pilih pembayaran' })} className={`mt-1 ${method.value === 'tempo' ? 'accent-[var(--color-secondary)]' : 'accent-[var(--color-primary)]'}`} />
                    <div>
                      <span className={`text-sm font-semibold ${method.value === 'tempo' ? 'text-[var(--color-secondary)]' : ''}`}>
                        {method.value === 'tempo' ? '💎 ' : ''}{method.label}
                      </span>
                      <p className="text-xs text-[var(--color-text-muted)]">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.payment_type && <p className="mt-2 text-xs text-red-500">{errors.payment_type.message}</p>}
            </div>

            {/* Notes */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <FileText size={20} className="text-[var(--color-text-muted)]" />
                Catatan
              </h3>
              <textarea {...register('notes')} rows={3} placeholder="Catatan untuk pesanan (opsional)" className="input-field resize-none" />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h3 className="text-lg font-bold mb-4">Ringkasan Pesanan</h3>
              <div className="space-y-3 border-b pb-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">{item.product?.name} × {item.qty}</span>
                    <span className="font-medium">{formatRupiah(parseFloat(item.unit_price || item.product?.price || '0') * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Subtotal</span>
                <span className="font-medium">{formatRupiah(getTotal())}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-[var(--color-text-muted)]">Ongkir</span>
                <span className="text-xs text-[var(--color-text-muted)]">Dihitung saat proses</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-bold">Estimasi Total</span>
                <span className="text-xl font-bold gradient-text">{formatRupiah(getTotal())}</span>
              </div>

              <button type="submit" disabled={submitting || addresses.length === 0} className="btn-primary w-full mt-6 !py-3.5 disabled:opacity-50">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Buat Pesanan
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

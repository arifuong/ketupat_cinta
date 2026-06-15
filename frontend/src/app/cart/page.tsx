'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRupiah } from '@/lib/utils';
import { formatImageUrl } from '@/lib/imageUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CartPage() {
  const { items, isLoading, fetchItems, updateQty, removeItem, getTotal } = useCartStore();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated && user?.role !== 'admin') fetchItems();
  }, [isHydrated, isAuthenticated, user?.role]);

  async function handleUpdateQty(cartId: number, newQty: number) {
    setUpdatingId(cartId);
    try {
      await updateQty(cartId, newQty);
    } catch { } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(cartId: number) {
    setUpdatingId(cartId);
    try {
      await removeItem(cartId);
    } catch { } finally {
      setUpdatingId(null);
    }
  }

  if (!isHydrated) return <LoadingSpinner size="lg" />;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg text-[var(--color-text-muted)]">Silakan <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">masuk</Link> untuk melihat keranjang.</p>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg text-[var(--color-text-muted)]">Admin tidak dapat berbelanja.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Keranjang Belanja</h1>

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingBag size={56} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-[var(--color-text-muted)]">Keranjang kosong</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Yuk pilih produk dan jadwal PO dulu!</p>
          <Link href="/products" className="btn-primary mt-6 inline-flex">Lihat Produk</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemPrice = parseFloat(item.unit_price || item.product?.price || '0');
              const itemSubtotal = itemPrice * item.qty;

              return (

                <div key={item.id} className={`card !p-4 flex gap-4 transition-opacity ${updatingId === item.id ? 'opacity-50' : ''}`}>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={formatImageUrl(item.product?.image_url)}
                      alt={item.product?.name || 'Produk'}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.product?.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      PO: {item.poSchedule?.schedule_date_formatted || item.po_schedule_id}
                    </p>
                    <p className="text-sm font-bold gradient-text mt-1">{formatRupiah(itemPrice)}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Subtotal: <span className="font-semibold text-[var(--color-text-main)]">{formatRupiah(itemSubtotal)}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => handleRemove(item.id)} className="btn-ghost !p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
                      <button onClick={() => handleUpdateQty(item.id, Math.max(1, item.qty - 1))} className="px-2 py-1 hover:bg-gray-100">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => handleUpdateQty(item.id, item.qty + 1)} className="px-2 py-1 hover:bg-gray-100">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h3 className="text-lg font-bold mb-4">Ringkasan</h3>

              <div className="space-y-2 text-sm border-b pb-3 mb-3">
                {items.map((item) => {
                  const price = parseFloat(item.unit_price || item.product?.price || '0');
                  return (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-[var(--color-text-muted)] truncate mr-2">{item.product?.name} × {item.qty}</span>
                      <span className="font-medium whitespace-nowrap">{formatRupiah(price * item.qty)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Total item</span>
                  <span className="font-medium">{items.reduce((s, i) => s + i.qty, 0)} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Subtotal</span>
                  <span className="font-bold text-lg gradient-text">{formatRupiah(getTotal())}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link href="/checkout" className="btn-primary w-full">
                  Checkout
                </Link>
                <Link href="/products" className="btn-secondary w-full text-center">
                  Lanjut Belanja
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';
import { OrderSkeleton } from '@/components/SkeletonLoader';
import type { Order, PaginatedResponse } from '@/types/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated) fetchOrders();
  }, [isHydrated, isAuthenticated, page]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<Order>>(`/orders?page=${page}`);
      setOrders(data.data);
      setLastPage(data.meta.last_page);
    } catch { } finally {
      setLoading(false);
    }
  }

  if (!isHydrated || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <h1 className="section-title mb-6">Pesanan Saya</h1>
        <OrderSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
          Riwayat Pembelian
        </span>
        <h1 className="section-title mt-2">Pesanan Saya</h1>
        <p className="text-xs text-[var(--color-text-muted)] font-light mt-1">Daftar riwayat pesanan pre-order ketupat Anda beserta status pengiriman.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={56} className="mx-auto mb-4 text-gray-300 animate-float" />
          <p className="text-sm text-[var(--color-text-muted)] italic">Belum ada riwayat pesanan.</p>
          <Link href="/products" className="btn-primary mt-6 inline-flex text-xs">Mulai Belanja Sekarang</Link>
        </div>
      ) : (
        <div className="space-y-4 animate-scale-in">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card !p-0 block group overflow-hidden">
              <div className="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-0.5 rounded">
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.order_status} label={order.order_status_label} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDateTime(order.created_at)}</span>
                    <span className="font-medium">{order.items?.length || 0} produk</span>
                    <span className="font-medium">{order.payment_type_label}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-base font-extrabold text-[var(--color-primary)]">{formatRupiah(order.total_amount)}</p>
                    {order.payment && (
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">{order.payment.payment_status_label}</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)} 
                className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>
              <span className="flex items-center px-4 text-xs font-bold text-[var(--color-text-muted)]">{page} / {lastPage}</span>
              <button 
                disabled={page >= lastPage} 
                onClick={() => setPage(page + 1)} 
                className="btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
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

  if (!isHydrated || loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={56} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-[var(--color-text-muted)]">Belum ada pesanan</p>
          <Link href="/products" className="btn-primary mt-6 inline-flex">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card !p-0 block group">
              <div className="flex items-center justify-between p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[var(--color-primary)]">{order.order_number}</span>
                    <StatusBadge status={order.order_status} label={order.order_status_label} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(order.created_at)}</span>
                    <span>{order.items?.length || 0} produk</span>
                    <span>{order.payment_type_label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold gradient-text">{formatRupiah(order.total_amount)}</p>
                    {order.payment && (
                      <p className="text-xs text-[var(--color-text-muted)]">{order.payment.payment_status_label}</p>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-ghost disabled:opacity-30">← Sebelumnya</button>
              <span className="flex items-center px-4 text-sm text-[var(--color-text-muted)]">{page} / {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="btn-ghost disabled:opacity-30">Selanjutnya →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

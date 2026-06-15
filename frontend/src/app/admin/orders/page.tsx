'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Filter, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Order, PaginatedResponse } from '@/types/api';
import toast from 'react-hot-toast';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'pending_payment', label: 'Menunggu Pembayaran' },
  { value: 'waiting_verification', label: 'Menunggu Verifikasi' },
  { value: 'processing', label: 'Sedang Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const adminActionStatuses = [
  { value: 'processing', label: 'Proses Pesanan' },
  { value: 'cancelled', label: 'Batalkan' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Custom Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get<PaginatedResponse<Order>>(`/admin/orders?${params}`);
      setOrders(data.data);
      setLastPage(data.meta.last_page);
      setTotal(data.meta.total);
    } catch { } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(order: Order, newStatus: string) {
    if (order.order_status === newStatus) return;

    setSelectedOrder(order);
    setSelectedStatus(newStatus);
    setCancelReason('');
    setModalOpen(true);
  }

  async function executeStatusChange() {
    if (!selectedOrder || !selectedStatus) return;

    if (selectedStatus === 'cancelled' && !cancelReason.trim()) {
      toast.error('Alasan pembatalan wajib diisi');
      return;
    }

    setActionLoading(true);
    const t = toast.loading('Memproses...');
    try {
      if (selectedStatus === 'cancelled') {
        await api.patch(`/admin/orders/${selectedOrder.id}/cancel`, { cancel_reason: cancelReason });
        toast.success('Pesanan dibatalkan', { id: t });
      } else {
        await api.patch(`/admin/orders/${selectedOrder.id}/status`, { order_status: selectedStatus });
        toast.success('Status berhasil diperbarui', { id: t });
      }
      setModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal update status', { id: t });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Kelola Pesanan</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{total} pesanan ditemukan</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost"><RefreshCw size={18} /></button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Filter size={16} className="text-[var(--color-text-muted)]" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field !w-auto !py-2 text-sm">
          {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Pembayaran</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Tanggal</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[var(--color-primary)] hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{order.user?.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{order.user?.role_label}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{formatRupiah(order.total_amount)}</td>
                    <td className="py-3 pr-4">
                      {order.payment && <StatusBadge status={order.payment.payment_status} label={order.payment.payment_status_label} />}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.order_status} label={order.order_status_label} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-[var(--color-text-muted)]">{formatDateTime(order.created_at)}</td>
                    <td className="py-3">
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className="input-field !py-1.5 !px-2 !text-xs !w-auto"
                      >
                        <option value={order.order_status}>{order.order_status_label}</option>
                        {adminActionStatuses.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && <p className="text-center py-12 text-[var(--color-text-muted)]">Tidak ada pesanan.</p>}

          {lastPage > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-ghost disabled:opacity-30">←</button>
              <span className="flex items-center px-4 text-sm text-[var(--color-text-muted)]">{page} / {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="btn-ghost disabled:opacity-30">→</button>
            </div>
          )}
        </>
      )}

      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 bg-white rounded-2xl shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold mb-2 text-gray-950">
              {selectedStatus === 'cancelled' ? 'Batalkan Pesanan' : 'Ubah Status Pesanan'}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Apakah Anda yakin ingin {selectedStatus === 'cancelled' ? 'membatalkan' : 'mengubah status menjadi ' + selectedStatus} untuk pesanan <strong>{selectedOrder.order_number}</strong>?
            </p>
            
            {selectedStatus === 'cancelled' && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 block mb-1.5 uppercase tracking-wider">Alasan Pembatalan</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Masukkan alasan pembatalan..."
                  className="input-field min-h-[80px]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                disabled={actionLoading}
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-sm !py-2 !px-4"
              >
                Batal
              </button>
              <button
                disabled={actionLoading}
                onClick={executeStatusChange}
                className={`btn-primary text-sm !py-2 !px-4 ${selectedStatus === 'cancelled' ? '!bg-[var(--color-error)]' : ''}`}
              >
                {actionLoading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

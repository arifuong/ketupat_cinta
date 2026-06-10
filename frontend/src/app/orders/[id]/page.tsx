'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Package, MapPin, Truck, CreditCard, Upload, Clock, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Order, ApiResponse } from '@/types/api';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(isSuccess ? '✅ Pesanan berhasil dibuat! Silakan lakukan pembayaran.' : '');

  useEffect(() => { fetchOrder(); }, [id]);

  async function fetchOrder() {
    try {
      const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
      setOrder(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handleUploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('proof_image', file);

    try {
      await api.post(`/payments/${order.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('✅ Bukti pembayaran berhasil diunggah!');
      fetchOrder();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setMessage(apiErr.response?.data?.message || 'Gagal upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleCancelOrder() {
    if (!order) return;
    const cancel_reason = window.prompt('Alasan pembatalan pesanan (opsional)');
    try {
      const { data } = await api.patch<ApiResponse<Order>>(`/orders/${order.id}/cancel`, { cancel_reason });
      setOrder(data.data);
      setMessage('Pesanan berhasil dibatalkan.');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setMessage(apiErr.response?.data?.message || 'Gagal membatalkan pesanan');
    }
  }

  async function handleReceived() {
    if (!order) return;
    try {
      const { data } = await api.patch<ApiResponse<Order>>(`/orders/${order.id}/received`);
      setOrder(data.data);
      setMessage('Barang diterima. Pesanan selesai.');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setMessage(apiErr.response?.data?.message || 'Gagal mengonfirmasi barang diterima');
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!order) return <div className="text-center py-20 text-[var(--color-text-muted)]">Pesanan tidak ditemukan.</div>;

  const paymentPending = order.payment?.payment_status === 'menunggu_pembayaran';
  const isManual = order.payment?.method === 'transfer_manual' || order.payment?.method === 'qris_manual';
  const canCancel = order.order_status === 'pending_payment' || order.order_status === 'waiting_verification';
  const canReceive = order.order_status === 'shipped';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {message && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1"><Clock size={14} />{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.order_status} label={order.order_status_label} />
          {order.payment && <StatusBadge status={order.payment.payment_status} label={order.payment.payment_status_label} />}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {canCancel && (
          <button onClick={handleCancelOrder} className="btn-ghost text-red-700">
            <XCircle size={16} /> Batalkan Pesanan
          </button>
        )}
        {canReceive && (
          <button onClick={handleReceived} className="btn-primary">
            <CheckCircle2 size={16} /> Barang Diterima
          </button>
        )}
      </div>

      {order.order_status === 'cancelled' && order.cancel_reason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Alasan pembatalan:</span> {order.cancel_reason}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Items */}
        <div className="card md:col-span-2">
          <h3 className="flex items-center gap-2 text-lg font-bold mb-4"><Package size={20} className="text-[var(--color-primary)]" />Produk</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                <div>
                  <p className="font-semibold">{item.product?.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.qty} × {formatRupiah(item.unit_price)}</p>
                </div>
                <span className="font-bold">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Subtotal</span><span>{formatRupiah(order.subtotal_amount)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Ongkir ({order.shipping_method_label})</span><span>{formatRupiah(order.shipping_cost)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold text-lg">Total</span><span className="text-xl font-bold gradient-text">{formatRupiah(order.total_amount)}</span></div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold mb-3"><MapPin size={18} className="text-[var(--color-primary)]" />Alamat</h3>
          {order.address ? (
            <div className="text-sm text-[var(--color-text-muted)]">
              <p>{order.address.detail}</p>
              <p>{order.address.district ? `${order.address.district}, ` : ''}{order.address.city}</p>
              {order.address.map_link && (
                <a href={order.address.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-[var(--color-primary)] text-xs hover:underline">
                  <ExternalLink size={12} />Buka Maps
                </a>
              )}
            </div>
          ) : <p className="text-sm text-[var(--color-text-muted)]">-</p>}
        </div>

        {/* Payment Info */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-bold mb-3"><CreditCard size={18} className="text-[var(--color-accent)]" />Pembayaran</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-[var(--color-text-muted)]">Metode:</span> {order.payment?.method_label}</p>
            <p><span className="text-[var(--color-text-muted)]">Status:</span> {order.payment?.payment_status_label}</p>
            {order.expired_at && <p><span className="text-[var(--color-text-muted)]">Batas waktu:</span> {formatDateTime(order.expired_at)}</p>}
            {order.payment?.proof_image_url && (
              <a href={order.payment.proof_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--color-primary)] text-xs hover:underline mt-2">
                <ExternalLink size={12} />Lihat Bukti
              </a>
            )}
          </div>

          {/* Upload Proof */}
          {paymentPending && isManual && (
            <div className="mt-4 border-t pt-4">
              <label className={`btn-primary w-full cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                <Upload size={16} />
                {uploading ? 'Mengunggah...' : 'Upload Bukti Bayar'}
                <input type="file" accept="image/*,.pdf" onChange={handleUploadProof} className="hidden" disabled={uploading} />
              </label>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Format: JPG, PNG, PDF. Maks 2MB.</p>
            </div>
          )}
        </div>

        {/* Shipment */}
        {order.shipment && (
          <div className="card md:col-span-2">
            <h3 className="flex items-center gap-2 font-bold mb-3"><Truck size={18} className="text-[var(--color-secondary)]" />Pengiriman</h3>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              {order.shipment.courier_name && <div><span className="text-[var(--color-text-muted)]">Kurir</span><p className="font-medium">{order.shipment.courier_name}</p></div>}
              {order.shipment.driver_name && <div><span className="text-[var(--color-text-muted)]">Driver</span><p className="font-medium">{order.shipment.driver_name}</p></div>}
              {order.shipment.tracking_link && (
                <div>
                  <span className="text-[var(--color-text-muted)]">Tracking</span>
                  <a href={order.shipment.tracking_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--color-primary)] font-medium hover:underline">
                    <ExternalLink size={12} />Lacak
                  </a>
                </div>
              )}
              {order.shipment.tracking_number && <div><span className="text-[var(--color-text-muted)]">No. Resi</span><p className="font-medium">{order.shipment.tracking_number}</p></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

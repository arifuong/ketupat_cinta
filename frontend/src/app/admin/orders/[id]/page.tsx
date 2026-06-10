'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, MessageCircle, Package, Truck, User, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import type { ApiResponse, Order } from '@/types/api';

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [shipment, setShipment] = useState({
    courier_name: '',
    tracking_number: '',
    tracking_link: '',
  });

  async function refreshOrder() {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Order>>(`/admin/orders/${params.id}`);
      setOrder(data.data);
      setShipment({
        courier_name: data.data.shipment?.courier_name || '',
        tracking_number: data.data.shipment?.tracking_number || '',
        tracking_link: data.data.shipment?.tracking_link || '',
      });
    } catch {
      setMessage('Gagal memuat detail pesanan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) refreshOrder();
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleProcess() {
    await api.patch(`/admin/orders/${params.id}/status`, { order_status: 'processing' });
    await refreshOrder();
  }

  async function handleShip() {
    await api.patch(`/admin/orders/${params.id}/ship`, shipment);
    await refreshOrder();
  }

  async function handleCancel() {
    const cancel_reason = window.prompt('Alasan pembatalan pesanan');
    if (!cancel_reason?.trim()) return alert('Alasan pembatalan wajib diisi');
    await api.patch(`/admin/orders/${params.id}/cancel`, { cancel_reason });
    await refreshOrder();
  }

  if (loading) return <LoadingSpinner size="lg" />;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <Link href="/admin/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="card text-center text-[var(--color-text-muted)]">{message || 'Pesanan tidak ditemukan.'}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link href="/admin/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
        <ArrowLeft size={16} /> Kembali ke daftar pesanan
      </Link>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="section-title">{order.order_number}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.order_status} label={order.order_status_label} />
          {order.payment && <StatusBadge status={order.payment.payment_status} label={order.payment.payment_status_label} />}
        </div>
      </div>

      {message && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><User size={18} />Data Customer</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Nama customer" value={order.user?.name} />
            <Info label="Nomor WhatsApp" value={order.user?.wa_number} icon={<MessageCircle size={14} />} />
            <Info label="Kota" value={order.address?.city} />
            <Info label="Metode pengiriman" value={order.shipping_method_label} icon={<Truck size={14} />} />
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-border)] p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              <MapPin size={14} /> Alamat lengkap
            </p>
            <p className="font-medium">{order.address?.detail || '-'}</p>
            {order.address?.district && <p className="mt-1 text-sm text-[var(--color-text-muted)]">Kecamatan {order.address.district}</p>}
            {order.address?.map_link && (
              <a href={order.address.map_link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-[var(--color-primary)] hover:underline">
                Buka map
              </a>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-border)] p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-muted)]">Catatan pesanan</p>
            <p className="text-sm">{order.notes || '-'}</p>
          </div>
        </section>

        <aside className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Package size={18} />Ringkasan</h2>
          <div className="space-y-3 text-sm">
            <Summary label="Subtotal" value={formatRupiah(order.subtotal_amount)} />
            <Summary label="Ongkir" value={formatRupiah(order.shipping_cost)} />
            <Summary label="Total" value={formatRupiah(order.total_amount)} strong />
            <Summary label="Metode bayar" value={order.payment_type_label} />
          </div>
        </aside>
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Truck size={18} />Aksi Pesanan</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <button onClick={handleProcess} disabled={!['pending_payment', 'waiting_verification'].includes(order.order_status)} className="btn-primary disabled:opacity-40">
            Proses Pesanan
          </button>
          <button onClick={handleCancel} disabled={['cancelled', 'completed'].includes(order.order_status)} className="btn-ghost text-red-700 disabled:opacity-40">
            <XCircle size={16} /> Batalkan
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={shipment.courier_name} onChange={(e) => setShipment({ ...shipment, courier_name: e.target.value })} className="input-field" placeholder="Nama kurir" />
          <input value={shipment.tracking_number} onChange={(e) => setShipment({ ...shipment, tracking_number: e.target.value })} className="input-field" placeholder="Nomor resi" />
          <input value={shipment.tracking_link} onChange={(e) => setShipment({ ...shipment, tracking_link: e.target.value })} className="input-field" placeholder="Link tracking" />
        </div>
        <button onClick={handleShip} disabled={order.order_status !== 'processing'} className="btn-primary mt-3 disabled:opacity-40">
          <Truck size={16} /> Simpan Resi dan Tandai Dikirim
        </button>
        {order.order_status === 'cancelled' && order.cancel_reason && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><span className="font-semibold">Alasan pembatalan:</span> {order.cancel_reason}</p>
        )}
      </section>

      <section className="card mt-6">
        <h2 className="mb-4 text-lg font-bold">Item Pesanan</h2>
        <div className="divide-y">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="font-medium">{item.product?.name || 'Produk'}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{item.qty} x {formatRupiah(item.unit_price)}</p>
              </div>
              <p className="font-semibold">{formatRupiah(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] p-4">
      <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="flex items-center gap-2 font-medium">{icon}{value || '-'}</p>
    </div>
  );
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className={strong ? 'text-lg font-bold gradient-text' : 'font-medium'}>{value}</span>
    </div>
  );
}

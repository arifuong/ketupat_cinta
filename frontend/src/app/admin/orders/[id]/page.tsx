'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, MessageCircle, Package, Truck, User, XCircle } from 'lucide-react';
import WhatsAppLink from '@/components/WhatsAppLink';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import type { ApiResponse, Order } from '@/types/api';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [shipment, setShipment] = useState({
    courier_name: '',
    courier_wa: '',
    vehicle_plate: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  async function refreshOrder() {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Order>>(`/admin/orders/${params.id}`);
      setOrder(data.data);
      setShipment({
        courier_name: data.data.shipment?.courier_name || '',
        courier_wa: data.data.shipment?.courier_wa || '',
        vehicle_plate: data.data.shipment?.vehicle_plate || data.data.shipment?.vehicle_number || '',
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
    if (order?.order_status === 'processing') return;
    setActionLoading(true);
    const t = toast.loading('Memproses...');
    try {
      await api.patch(`/admin/orders/${params.id}/status`, { order_status: 'processing' });
      toast.success('Status diperbarui menjadi Processing', { id: t });
      await refreshOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pesanan', { id: t });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShip() {
    if (order?.order_status === 'shipped') return;
    if (order?.shipping_method !== 'gosend_customer') {
      if (!shipment.courier_name.trim() || !shipment.vehicle_plate.trim()) {
        toast.error('Nama kurir dan Plat nomor kendaraan wajib diisi.');
        return;
      }
    }
    setActionLoading(true);
    const t = toast.loading('Mengirim pesanan...');
    try {
      const payload = order?.shipping_method === 'gosend_customer' ? {} : {
        courier_name: shipment.courier_name.trim(),
        vehicle_plate: shipment.vehicle_plate.trim(),
        courier_wa: shipment.courier_wa ? shipment.courier_wa.replace(/[^0-9+]/g, '') : null,
      };
      await api.patch(`/admin/orders/${params.id}/ship`, payload);
      toast.success('Pesanan berhasil dikirim', { id: t });
      await refreshOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pesanan', { id: t });
    } finally {
      setActionLoading(false);
    }
  }

  function handleCancel() {
    if (order?.order_status === 'cancelled') return;
    setCancelReason('');
    setCancelModalOpen(true);
  }

  async function executeCancel() {
    if (!cancelReason.trim()) {
      toast.error('Alasan pembatalan wajib diisi');
      return;
    }
    setActionLoading(true);
    const t = toast.loading('Membatalkan pesanan...');
    try {
      await api.patch(`/admin/orders/${params.id}/cancel`, { cancel_reason: cancelReason });
      toast.success('Pesanan berhasil dibatalkan', { id: t });
      setCancelModalOpen(false);
      await refreshOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan', { id: t });
    } finally {
      setActionLoading(false);
    }
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
            <Info label="Nomor WhatsApp" value={<WhatsAppLink phone={order.user?.wa_number} />} icon={<MessageCircle size={14} />} />
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

      {/* Shipment info if already shipped/completed */}
      {['shipped', 'completed'].includes(order.order_status) && (
        <section className="card mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Truck size={18} />Informasi Pengiriman</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <span className="text-[var(--color-text-muted)] text-xs block">Nama Kurir / Driver</span>
              <p className="font-bold text-gray-900 mt-0.5">{order.shipment?.courier_name || '-'}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] text-xs block">Plat Nomor Kendaraan</span>
              <p className="font-bold text-gray-900 mt-0.5">{order.shipment?.vehicle_plate || order.shipment?.vehicle_number || '-'}</p>
            </div>
            {order.shipment?.courier_wa && (
              <div>
                <span className="text-[var(--color-text-muted)] text-xs block">No WhatsApp</span>
                <p className="font-bold text-gray-900 mt-0.5">{order.shipment.courier_wa}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {['pending_payment', 'waiting_verification', 'processing'].includes(order.order_status) && (
        <section className="card mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Truck size={18} />Aksi Pesanan</h2>
          
          <div className="grid gap-3 md:grid-cols-2 mb-6">
            <button 
              onClick={handleProcess} 
              disabled={actionLoading || !['pending_payment', 'waiting_verification'].includes(order.order_status)} 
              className="btn-primary disabled:opacity-40"
            >
              Proses Pesanan
            </button>
            <button 
              onClick={handleCancel} 
              disabled={actionLoading} 
              className="btn-ghost text-red-700 hover:bg-red-50 disabled:opacity-40 border border-red-200"
            >
              <XCircle size={16} /> Batalkan
            </button>
          </div>

          {order.order_status === 'processing' && (
            <div className="border-t border-dashed pt-4 mt-4 animate-scale-in">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Pengiriman & Kurir
              </h3>
              
              {order.shipping_method === 'gosend_customer' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <span className="badge bg-blue-100 text-blue-700 !text-[10px] font-bold">GoSend Customer</span>
                    <p className="text-xs text-blue-800">
                      Customer yang memesan driver GoSend sendiri. Berikut data driver yang diinput oleh customer:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs pt-1">
                      <div>
                        <strong>Nama Driver:</strong> {order.shipment?.courier_name || <span className="text-red-500 italic">Belum diisi customer</span>}
                      </div>
                      <div>
                        <strong>Plat Nomor:</strong> {order.shipment?.vehicle_plate || order.shipment?.vehicle_number || <span className="text-red-500 italic">Belum diisi customer</span>}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleShip} 
                    disabled={actionLoading || !order.shipment?.courier_name || !(order.shipment?.vehicle_plate || order.shipment?.vehicle_number)} 
                    className="btn-primary w-full disabled:opacity-40"
                  >
                    <Truck size={16} /> {!order.shipment?.courier_name || !(order.shipment?.vehicle_plate || order.shipment?.vehicle_number) ? 'Menunggu Customer Isi Driver' : 'Tandai Dikirim'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1 uppercase tracking-wider">Nama Kurir/Driver *</label>
                      <input 
                        value={shipment.courier_name} 
                        onChange={(e) => setShipment({ ...shipment, courier_name: e.target.value })} 
                        className="input-field" 
                        placeholder="Contoh: Pak Budi" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1 uppercase tracking-wider">Plat Nomor Kendaraan *</label>
                      <input 
                        value={shipment.vehicle_plate} 
                        onChange={(e) => setShipment({ ...shipment, vehicle_plate: e.target.value })} 
                        className="input-field" 
                        placeholder="Contoh: D 1234 ABC" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1 uppercase tracking-wider">Nomor WA Kurir (Opsional)</label>
                      <input 
                        value={shipment.courier_wa} 
                        onChange={(e) => setShipment({ ...shipment, courier_wa: e.target.value })} 
                        className="input-field" 
                        placeholder="Contoh: 0812345678" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleShip} 
                    disabled={actionLoading} 
                    className="btn-primary w-full"
                  >
                    <Truck size={16} /> Simpan dan Tandai Dikirim
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {order.order_status === 'cancelled' && (
        <section className="card mt-6 border-red-100 bg-red-50/50">
          <h2 className="mb-2 text-lg font-bold text-red-800">Pesanan Dibatalkan</h2>
          <p className="text-sm text-red-700">
            <span className="font-semibold">Alasan pembatalan:</span> {order.cancel_reason || '-'}
          </p>
        </section>
      )}

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

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 bg-white rounded-2xl shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold mb-2 text-gray-950">Batalkan Pesanan</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Apakah Anda yakin ingin membatalkan pesanan <strong>{order.order_number}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5 uppercase tracking-wider">Alasan Pembatalan</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Masukkan alasan pembatalan..."
                className="input-field min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                disabled={actionLoading}
                onClick={() => setCancelModalOpen(false)}
                className="btn-secondary text-sm !py-2 !px-4"
              >
                Batal
              </button>
              <button
                disabled={actionLoading}
                onClick={executeCancel}
                className="btn-primary text-sm !py-2 !px-4 !bg-[var(--color-error)]"
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

function Info({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: ReactNode }) {
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

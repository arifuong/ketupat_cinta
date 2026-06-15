'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, MapPin, Truck, CreditCard, Upload, Clock, CheckCircle2, ExternalLink, XCircle, FileText, MessageCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import { Shimmer } from '@/components/SkeletonLoader';
import type { Order, ApiResponse } from '@/types/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'cancel' | 'receive' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [courierName, setCourierName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [savingDriver, setSavingDriver] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (isSuccess && order) {
      if (order.payment?.method === 'tempo') {
        toast.success('Invoice berhasil dibuat. Silakan lakukan pembayaran.', { duration: 5000 });
      } else {
        toast.success('Pesanan berhasil dibuat. Menunggu pembayaran.', { duration: 5000 });
      }
    }
  }, [isSuccess, order]);

  useEffect(() => { fetchOrder(); }, [id]);

  async function fetchOrder() {
    try {
      const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
      setOrder(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (order?.shipment) {
      setCourierName(order.shipment.courier_name || '');
      setVehiclePlate(order.shipment.vehicle_plate || order.shipment.vehicle_number || '');
    }
  }, [order]);

  async function handleSaveDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!courierName.trim() || !vehiclePlate.trim()) {
      toast.error('Nama Driver dan Plat Nomor wajib diisi.');
      return;
    }
    setSavingDriver(true);
    const t = toast.loading('Menyimpan data driver...');
    try {
      const { data } = await api.patch<ApiResponse<Order>>(`/orders/${order!.id}/gosend-driver`, {
        courier_name: courierName.trim(),
        vehicle_plate: vehiclePlate.trim(),
      });
      setOrder(data.data);
      toast.success('Data driver GoSend berhasil disimpan.', { id: t });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Gagal menyimpan data driver.', { id: t });
    } finally {
      setSavingDriver(false);
    }
  }

  const handleDownloadReceipt = async () => {
    if (!order) return;
    const t = toast.loading('Mengunduh struk...');
    try {
      const response = await api.get(`/orders/${order.id}/receipt`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `struk-pesanan-${order.order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Struk berhasil diunduh', { id: t });
    } catch {
      toast.error('Gagal mengunduh struk', { id: t });
    }
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Bukti pembayaran harus berupa gambar JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran bukti pembayaran maksimal 2 MB.");
      return;
    }

    setSelectedFile(file);
    
    // Revoke previous url if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function submitProof() {
    if (!selectedFile || !order) return;

    setUploading(true);
    const t = toast.loading('Mengunggah bukti...');
    const formData = new FormData();
    formData.append('proof_image', selectedFile);

    try {
      await api.post(`/payments/${order.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Bukti pembayaran berhasil diunggah!', { id: t });
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      fetchOrder();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Gagal upload', { id: t });
    } finally {
      setUploading(false);
    }
  }

  function cancelSelection() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  function triggerCancel() {
    setCancelReason('');
    setModalType('cancel');
    setModalOpen(true);
  }

  function triggerReceive() {
    setModalType('receive');
    setModalOpen(true);
  }

  async function executeCancelOrder() {
    if (!order) return;

    if (isAdmin && !cancelReason.trim()) {
      toast.error('Alasan pembatalan wajib diisi untuk admin.');
      return;
    }

    setActionLoading(true);
    const t = toast.loading('Membatalkan pesanan...');
    const endpoint = isReseller
      ? `/reseller/orders/${order.id}/cancel`
      : `/orders/${order.id}/cancel`;

    try {
      const payload = { cancel_reason: cancelReason.trim() || null };
      const { data } = await api.patch<ApiResponse<Order>>(endpoint, payload);
      setOrder(data.data);
      toast.success('Pesanan berhasil dibatalkan.', { id: t });
      setModalOpen(false);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Gagal membatalkan pesanan', { id: t });
    } finally {
      setActionLoading(false);
    }
  }

  async function executeReceived() {
    if (!order) return;

    setActionLoading(true);
    const t = toast.loading('Mengonfirmasi...');
    try {
      const endpoint = isReseller
        ? `/reseller/orders/${order.id}/received`
        : `/orders/${order.id}/received`;

      const { data } = await api.patch<ApiResponse<Order>>(endpoint);
      setOrder(data.data);
      toast.success('Barang diterima. Pesanan selesai.', { id: t });
      setModalOpen(false);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      toast.error(apiErr.response?.data?.message || 'Gagal mengonfirmasi', { id: t });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-6">
        <div className="space-y-2">
          <Shimmer className="h-8 w-48" />
          <Shimmer className="h-4 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Shimmer className="h-44 w-full rounded-2xl md:col-span-2" />
          <Shimmer className="h-32 w-full rounded-2xl" />
          <Shimmer className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-[var(--color-text-muted)] font-medium">Pesanan tidak ditemukan.</div>;
  }

  const paymentPending = order.payment?.payment_status === 'menunggu_pembayaran';
  const isManual = order.payment?.method === 'transfer_manual' || order.payment?.method === 'qris_manual';
  const isReseller = order.user?.role === 'reseller';
  const isAdmin = order.user?.role === 'admin';
  const canCancel = order.order_status === 'pending_payment' || order.order_status === 'waiting_verification';
  const canReceive = order.order_status === 'shipped';
  const canUploadProof = isManual && 
    (order.payment?.payment_status === 'menunggu_pembayaran' || 
     order.payment?.payment_status === 'menunggu_verifikasi');

  // Order timeline calculations
  const statuses = ['pending_payment', 'processing', 'shipped', 'completed'];
  const statusLabels = [
    { key: 'pending_payment', label: 'Pending', desc: 'Menunggu Pembayaran' },
    { key: 'processing', label: 'Processing', desc: 'Sedang Diproduksi' },
    { key: 'shipped', label: 'Shipped', desc: 'Dalam Pengiriman' },
    { key: 'completed', label: 'Completed', desc: 'Pesanan Selesai' },
  ];

  // Get active index based on current order status
  let activeIndex = 0;
  if (order.order_status === 'waiting_verification') {
    activeIndex = 0; // Still pending / verifying payment
  } else if (order.order_status === 'processing') {
    activeIndex = 1;
  } else if (order.order_status === 'shipped') {
    activeIndex = 2;
  } else if (order.order_status === 'completed') {
    activeIndex = 3;
  } else if (order.order_status === 'cancelled') {
    activeIndex = -1; // Special canceled state
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-[var(--color-border)]">
        <div>
          <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
            Detail Pesanan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mt-2">{order.order_number}</h1>
          <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1">
            <Clock size={12} /> {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={order.order_status} label={order.order_status_label} />
          {order.payment && <StatusBadge status={order.payment.payment_status} label={order.payment.payment_status_label} />}
          <button 
            onClick={handleDownloadReceipt}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[var(--color-border)] text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileText size={14} className="text-[var(--color-primary)]" /> Download Struk
          </button>
        </div>
      </div>

      {/* Buttons Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={triggerCancel}
            className="btn-secondary !border-red-200 !text-red-600 hover:!bg-red-50 !py-2.5 !px-4 text-xs font-bold"
          >
            <XCircle size={15} /> Batalkan Pesanan
          </button>
        )}

        {canReceive && (
          <button onClick={triggerReceive} className="btn-primary !py-2.5 !px-5 text-xs shadow-lg">
            <CheckCircle2 size={15} /> Barang Diterima
          </button>
        )}

        {isSuccess && (
          <Link href="/orders" className="btn-secondary !py-2.5 !px-5 text-xs font-bold">
            Lihat Pesanan Lainnya
          </Link>
        )}
      </div>

      {order.order_status === 'cancelled' && order.cancel_reason && (
        <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs sm:text-sm text-red-700 leading-relaxed shadow-sm">
          <span className="font-bold">Alasan Pembatalan:</span> {order.cancel_reason}
        </div>
      )}

      {/* ═══ Order Shipment Timeline ═══ */}
      {order.order_status !== 'cancelled' && (
        <div className="card mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-6">Status Pengiriman</h3>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 md:px-4">
            {/* Horizontal Line background (Desktop) */}
            <div className="absolute top-[18px] left-[4%] right-[4%] h-0.5 bg-gray-200 hidden md:block z-0" />
            
            {statusLabels.map((step, index) => {
              const isPassed = index < activeIndex;
              const isCurrent = index === activeIndex;
              const isUpcoming = index > activeIndex;

              return (
                <div key={step.key} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 flex-1 md:text-center">
                  {/* Step bubble */}
                  <div 
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                      isPassed 
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow'
                        : isCurrent
                        ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)] text-gray-950 animate-glow'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={16} className="text-white" /> : index + 1}
                  </div>
                  
                  {/* Step label / details */}
                  <div>
                    <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-[var(--color-primary)] font-black text-sm' : 'text-gray-900'}`}>{step.label}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-light">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Items */}
        <div className="card md:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4"><Package size={16} className="text-[var(--color-primary)]" />Produk Pesanan</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3 bg-white hover:border-[var(--color-primary)]/20 transition-colors">
                <div>
                  <p className="font-bold text-sm text-gray-900">{item.product?.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.qty} × {formatRupiah(item.unit_price)}</p>
                </div>
                <span className="font-extrabold text-sm text-[var(--color-primary)]">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-dashed pt-4 text-xs sm:text-sm">
            <div className="flex justify-between text-[var(--color-text-muted)]"><span>Subtotal Produk</span><span>{formatRupiah(order.subtotal_amount)}</span></div>
            <div className="flex justify-between text-[var(--color-text-muted)]"><span>Biaya Pengiriman ({order.shipping_method_label})</span><span>{formatRupiah(order.shipping_cost)}</span></div>
            <div className="flex justify-between border-t border-dashed pt-3 mt-3"><span className="font-bold text-gray-950">Total Pembayaran</span><span className="text-lg font-black text-[var(--color-primary)]">{formatRupiah(order.total_amount)}</span></div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3"><MapPin size={16} className="text-[var(--color-primary)]" />Alamat Pengiriman</h3>
          {order.address ? (
            <div className="text-xs sm:text-sm text-gray-800 space-y-1">
              <p className="font-bold text-gray-950 text-xs">Penerima / Lokasi:</p>
              <p className="font-light leading-relaxed">{order.address.detail}</p>
              <p className="font-semibold text-xs text-gray-900">{order.address.district ? `${order.address.district}, ` : ''}{order.address.city}</p>
              {order.address.map_link && (
                <a href={order.address.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-[var(--color-primary)] text-xs font-bold hover:underline">
                  <ExternalLink size={12} /> Buka Google Maps
                </a>
              )}
            </div>
          ) : <p className="text-xs text-[var(--color-text-muted)] italic">Alamat belum diisi.</p>}
        </div>

        {/* Payment Info */}
        <div className="card">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3"><CreditCard size={16} className="text-[var(--color-secondary)]" />Informasi Pembayaran</h3>
          <div className="text-xs sm:text-sm space-y-1 text-gray-800 mb-4">
            <p><span className="text-[var(--color-text-muted)]">Metode:</span> <strong className="text-gray-900 font-semibold">{order.payment?.method_label}</strong></p>
            <p><span className="text-[var(--color-text-muted)]">Status:</span> <strong className="text-gray-900 font-semibold">{order.payment?.payment_status_label}</strong></p>
            {order.expired_at && <p><span className="text-[var(--color-text-muted)]">Batas Waktu:</span> <strong className="text-red-600 font-semibold">{formatDateTime(order.expired_at)}</strong></p>}
            
            {(() => {
              const rawProofUrl = order.payment?.proof_image_url || null;
              const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
              const proofUrl = rawProofUrl
                ? (rawProofUrl.startsWith('http://') || rawProofUrl.startsWith('https://') || rawProofUrl.startsWith('/')
                  ? rawProofUrl
                  : `${apiBaseUrl}/storage/proofs/${rawProofUrl}`)
                : null;
              
              return proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--color-primary)] text-xs font-bold hover:underline mt-2">
                  <ExternalLink size={12} /> Lihat Bukti Pembayaran
                </a>
              ) : null;
            })()}
          </div>

          {/* Upload / Change Proof */}
          {canUploadProof && (
            <div className="mt-4 border-t border-dashed pt-4 space-y-4">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {order.payment?.proof_image_url ? 'Ganti Bukti Pembayaran' : 'Upload Bukti Pembayaran'}
              </p>
              
              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-gray-50">
                    <img src={previewUrl} alt="Preview Bukti" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={submitProof} 
                      disabled={uploading}
                      className="btn-primary flex-1 text-xs !py-2.5 shadow"
                    >
                      {uploading ? 'Mengirim...' : 'Kirim Bukti'}
                    </button>
                    <button 
                      onClick={cancelSelection} 
                      disabled={uploading}
                      className="btn-secondary text-xs !py-2.5"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`btn-primary w-full cursor-pointer text-xs !py-3 ${uploading ? 'opacity-50' : ''}`}>
                    <Upload size={14} />
                    {order.payment?.proof_image_url ? 'Pilih Gambar Baru' : 'Pilih Gambar Bukti'}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      disabled={uploading} 
                    />
                  </label>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">Format: JPG, JPEG, PNG, WEBP. Maksimal 2MB.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shipment Info & Form */}
        {order.shipping_method === 'gosend_customer' ? (
          <div className="card md:col-span-2">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              <Truck size={16} className="text-[var(--color-primary)]" />
              Informasi Pengiriman GoSend (Customer Driver)
            </h3>
            {['pending_payment', 'waiting_verification', 'processing'].includes(order.order_status) ? (
              <form onSubmit={handleSaveDriver} className="space-y-4">
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Silakan masukkan informasi Driver GoSend yang Anda pesan untuk mengambil pesanan ini.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Nama Driver GoSend *</label>
                    <input 
                      type="text" 
                      value={courierName} 
                      onChange={(e) => setCourierName(e.target.value)} 
                      placeholder="Contoh: Pak Budi" 
                      className="input-field !py-2.5" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Plat Nomor Kendaraan *</label>
                    <input 
                      type="text" 
                      value={vehiclePlate} 
                      onChange={(e) => setVehiclePlate(e.target.value)} 
                      placeholder="Contoh: D 1234 ABC" 
                      className="input-field !py-2.5" 
                      required 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={savingDriver} className="btn-primary text-xs !py-2.5 !px-5 shadow-md">
                    {savingDriver ? 'Menyimpan...' : 'Simpan Info Driver'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 text-xs sm:text-sm md:grid-cols-2">
                <div>
                  <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold block">Nama Driver GoSend</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{order.shipment?.courier_name || '-'}</p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold block">Plat Nomor Kendaraan</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{order.shipment?.vehicle_plate || order.shipment?.vehicle_number || '-'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          order.shipment && (
            <div className="card md:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                <Truck size={16} className="text-[var(--color-primary)]" />
                Informasi Kurir
              </h3>
              <div className="grid gap-4 text-xs sm:text-sm md:grid-cols-4">
                {order.shipment.courier_name && (
                  <div>
                    <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold block">Nama Kurir</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{order.shipment.courier_name}</p>
                  </div>
                )}
                {order.shipment.vehicle_plate && (
                  <div>
                    <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold block">Plat Nomor</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{order.shipment.vehicle_plate}</p>
                  </div>
                )}
                {order.shipment.courier_wa && (
                  <div>
                    <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold block">No WhatsApp</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{order.shipment.courier_wa}</p>
                  </div>
                )}
                {order.shipment.courier_wa && (
                  <div className="flex items-end">
                    <a
                      href={`https://wa.me/${(() => {
                        let clean = order.shipment.courier_wa.replace(/\D/g, '');
                        if (clean.startsWith('0')) {
                          clean = '62' + clean.slice(1);
                        }
                        return clean;
                      })()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 btn-primary text-xs !py-2.5 !px-4 font-bold hover:scale-105 active:scale-95 duration-300 w-full shadow"
                    >
                      <MessageCircle size={14} /> Hubungi Kurir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {modalOpen && modalType && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] card w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-[var(--color-border)]"
            >
              <h3 className="text-lg font-bold mb-2 text-gray-950">
                {modalType === 'cancel' ? 'Batalkan Pesanan Ini?' : 'Barang Sudah Diterima?'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-light leading-relaxed mb-6">
                {modalType === 'cancel'
                  ? 'Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.'
                  : 'Pastikan barang telah Anda terima dengan baik sebelum melakukan konfirmasi. Konfirmasi ini akan menyelesaikan pesanan Anda.'}
              </p>

              {modalType === 'cancel' && isAdmin && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-700 block mb-1.5 uppercase tracking-wider">Alasan Pembatalan</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tulis alasan pembatalan untuk customer..."
                    className="input-field min-h-[80px] text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  disabled={actionLoading}
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs !py-2.5 !px-4"
                >
                  Kembali
                </button>
                <button
                  disabled={actionLoading}
                  onClick={modalType === 'cancel' ? executeCancelOrder : executeReceived}
                  className={`btn-primary text-xs !py-2.5 !px-4 shadow ${modalType === 'cancel' ? '!bg-[var(--color-danger)] hover:!bg-red-700' : ''}`}
                >
                  {actionLoading ? 'Memproses...' : 'Ya, Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Payment, PaginatedResponse } from '@/types/api';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('menunggu_verifikasi');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/payments?${params}`);
      setPayments(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handleVerify(paymentId: number, approved: boolean) {
    setProcessing(paymentId);
    const t = toast.loading('Memproses verifikasi...');
    try {
      await api.patch(`/admin/payments/${paymentId}/verify`, { approved });
      toast.success(approved ? 'Pembayaran disetujui' : 'Pembayaran ditolak', { id: t });
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal', { id: t });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Verifikasi Pembayaran</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Approve atau reject bukti pembayaran</p>
        </div>
        <button onClick={fetchPayments} className="btn-ghost"><RefreshCw size={18} /></button>
      </div>

      <div className="flex gap-2 mb-6">
        {['menunggu_verifikasi', 'pembayaran_berhasil', 'pembayaran_ditolak', ''].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`badge cursor-pointer transition-all ${statusFilter === status ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {status === '' ? 'Semua' : status === 'menunggu_verifikasi' ? '⏳ Menunggu' : status === 'pembayaran_berhasil' ? '✅ Berhasil' : '❌ Ditolak'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <div key={payment.id} className={`card !p-5 ${processing === payment.id ? 'opacity-50' : ''}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--color-primary)]">Order #{payment.order_number || payment.order?.order_number || '-'}</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-semibold text-gray-700">Invoice: {payment.invoice_number || payment.order?.reseller_invoice?.invoice_number || '-'}</span>
                    <StatusBadge status={payment.payment_status || '-'} label={payment.payment_status_label || '-'} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-[var(--color-text-muted)]">
                    <p>Customer/Reseller: <strong className="text-[var(--color-text)]">{payment.customer_name || payment.order?.user?.name || payment.user?.name || '-'}</strong></p>
                    <p>Metode Pembayaran: <strong className="text-[var(--color-text)]">{payment.method_label || '-'}</strong></p>
                    <p>Total Pembayaran: <strong className="text-green-600">{formatRupiah(payment.amount || 0)}</strong></p>
                    <p>Tanggal Transaksi: <strong className="text-[var(--color-text)]">{payment.created_at ? formatDateTime(payment.created_at) : '-'}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payment.proof_image_url && (payment.proof_image_url.startsWith('http://') || payment.proof_image_url.startsWith('https://') || payment.proof_image_url.startsWith('/')) ? (
                    <a href={payment.proof_image_url} target="_blank" rel="noreferrer" className="btn-ghost text-sm flex items-center gap-1">
                      <ExternalLink size={14} />Bukti
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)] italic">Bukti tidak tersedia</span>
                  )}

                  {payment.payment_status === 'menunggu_verifikasi' && (
                    <>
                      <button
                        onClick={() => handleVerify(payment.id, true)}
                        disabled={processing === payment.id}
                        className="btn-primary !py-2 !px-4 text-sm !bg-[var(--color-success)]"
                      >
                        <Check size={16} />Approve
                      </button>
                      <button
                        onClick={() => handleVerify(payment.id, false)}
                        disabled={processing === payment.id}
                        className="btn-primary !py-2 !px-4 text-sm !bg-[var(--color-error)]"
                      >
                        <X size={16} />Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {payments.length === 0 && <p className="text-center py-12 text-[var(--color-text-muted)]">Tidak ada pembayaran.</p>}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, Upload } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Invoice, PaginatedResponse } from '@/types/api';

export default function ResellerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchInvoices(); }, []);

  async function fetchInvoices() {
    try {
      const { data } = await api.get<PaginatedResponse<Invoice>>('/reseller/invoices');
      setInvoices(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handlePay(invoiceId: number, file?: File) {
    const formData = new FormData();
    formData.append('amount', payAmount);
    formData.append('payment_method', 'transfer_manual');
    if (file) formData.append('proof_image', file);

    try {
      await api.post(`/reseller/invoices/${invoiceId}/pay`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('✅ Pembayaran berhasil dicatat!');
      setPayingId(null);
      setPayAmount('');
      fetchInvoices();
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Gagal'));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Tagihan Saya</h1>

      {message && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={56} className="mx-auto mb-4 text-gray-300" />
          <p className="text-[var(--color-text-muted)]">Tidak ada tagihan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--color-primary)]">{invoice.invoice_number}</span>
                    <StatusBadge status={invoice.status} label={invoice.status_label} />
                    {invoice.is_overdue && (
                      <span className="badge bg-red-100 text-red-600 flex items-center gap-1">
                        <AlertTriangle size={10} />Terlambat
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)] space-y-0.5">
                    <p>Total: <strong>{formatRupiah(invoice.total_debt)}</strong></p>
                    <p>Terbayar: {formatRupiah(invoice.paid_amount)} | Sisa: <strong className="text-[var(--color-error)]">{formatRupiah(invoice.remaining_debt)}</strong></p>
                    <p>Jatuh tempo: {invoice.due_date_formatted}</p>
                  </div>
                </div>

                <div>
                  {invoice.status !== 'lunas' && (
                    <button onClick={() => setPayingId(payingId === invoice.id ? null : invoice.id)} className="btn-primary text-sm !py-2">
                      Bayar
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Form */}
              {payingId === invoice.id && (
                <div className="mt-4 border-t pt-4 animate-scale-in">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Jumlah Bayar</label>
                      <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={`Max: ${invoice.remaining_debt}`} className="input-field" />
                    </div>
                    <label className="btn-secondary text-sm !py-3 cursor-pointer">
                      <Upload size={16} />Upload & Bayar
                      <input type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) handlePay(invoice.id, e.target.files[0]); }} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

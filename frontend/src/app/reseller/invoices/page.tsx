'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle, Upload, ChevronRight, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import { InvoiceSkeleton } from '@/components/SkeletonLoader';
import type { Invoice, PaginatedResponse } from '@/types/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResellerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => { fetchInvoices(); }, []);

  async function fetchInvoices() {
    try {
      const { data } = await api.get<PaginatedResponse<Invoice>>('/reseller/invoices');
      setInvoices(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  const handleDownloadReceipt = async (id: number, number: string) => {
    const t = toast.loading('Mengunduh struk...');
    try {
      const response = await api.get(`/reseller/invoices/${id}/receipt`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `struk-tagihan-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Struk berhasil diunduh', { id: t });
    } catch {
      toast.error('Gagal mengunduh struk', { id: t });
    }
  };

  async function handlePay(invoiceId: number, file?: File) {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (targetInvoice) {
      const remainingDebt = parseFloat(targetInvoice.remaining_debt);
      const inputAmount = parseFloat(payAmount);
      
      if (isNaN(inputAmount) || inputAmount <= 0) {
        toast.error('Masukkan nominal pembayaran yang valid.');
        return;
      }
      
      if (inputAmount > remainingDebt) {
        toast.error("Nominal pembayaran melebihi sisa tagihan.");
        return;
      }
    }

    const t = toast.loading('Memproses pembayaran...');
    const formData = new FormData();
    formData.append('amount', payAmount);
    formData.append('payment_method', 'tempo');

    if (file) formData.append('proof_image', file);

    try {
      await api.post(`/reseller/invoices/${invoiceId}/pay`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pembayaran berhasil dicatat!', { id: t });
      setPayingId(null);
      setPayAmount('');
      fetchInvoices();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal memproses pembayaran. Silakan coba lagi.';
      toast.error('❌ ' + errMsg, { id: t });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <h1 className="section-title mb-6">Tagihan Saya</h1>
        <InvoiceSkeleton />
      </div>
    );
  }

  // Calculate overall metrics if invoices exist
  const totalDebtSum = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_debt || '0'), 0);
  const totalPaidSum = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || '0'), 0);
  const totalRemainingSum = invoices.reduce((sum, inv) => sum + parseFloat(inv.remaining_debt || '0'), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
          Halaman Reseller
        </span>
        <h1 className="section-title mt-2">Tagihan Saya</h1>
        <p className="text-xs text-[var(--color-text-muted)] font-light mt-1">Pantau rincian penagihan tempo reseller, cicilan, dan jatuh tempo pembayaran Anda.</p>
      </div>

      {/* Reseller Overall Summary Cards */}
      {invoices.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
          <div className="card !p-4 border-l-4 border-l-[var(--color-primary)]">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Total Tagihan Tempo</span>
            <p className="text-xl font-black text-gray-950 mt-1">{formatRupiah(totalDebtSum.toString())}</p>
          </div>
          <div className="card !p-4 border-l-4 border-l-[var(--color-success)]">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Total Terbayar</span>
            <p className="text-xl font-black text-green-600 mt-1">{formatRupiah(totalPaidSum.toString())}</p>
          </div>
          <div className="card !p-4 border-l-4 border-l-[var(--color-danger)]">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Sisa Hutang Tagihan</span>
            <p className="text-xl font-black text-red-600 mt-1">{formatRupiah(totalRemainingSum.toString())}</p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={56} className="mx-auto mb-4 text-gray-300 animate-float" />
          <p className="text-sm text-[var(--color-text-muted)] italic">Tidak ada rincian tagihan tempo saat ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {invoices.map((invoice) => {
            // Calculate progress percent
            const debtNum = parseFloat(invoice.total_debt || '0');
            const paidNum = parseFloat(invoice.paid_amount || '0');
            const paidPercent = debtNum > 0 ? Math.min(100, Math.max(0, Math.round((paidNum / debtNum) * 100))) : 0;

            // Generate characters progress bar: e.g. ██████░░░░ 60%
            const totalBlocks = 10;
            const activeBlocks = Math.round((paidPercent / 100) * totalBlocks);
            const textBar = '█'.repeat(activeBlocks) + '░'.repeat(totalBlocks - activeBlocks);

            return (
              <div key={invoice.id} className="card relative overflow-hidden group">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Invoice Number & Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2.5 py-1 rounded-lg">
                        {invoice.invoice_number}
                      </span>
                      <StatusBadge status={invoice.status} label={invoice.status_label} />
                      {invoice.is_overdue && (
                        <span className="badge bg-red-100 text-red-600 border border-red-200 flex items-center gap-1 animate-pulse-slow">
                          <AlertTriangle size={11} /> Terlambat
                        </span>
                      )}
                    </div>

                    {/* Progress Bar (Visual + Text block character) */}
                    <div className="bg-[var(--color-bg)]/60 rounded-xl p-3.5 border border-gray-100">
                      <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-2">
                        <span className="text-[var(--color-text-muted)] font-semibold">Progress Pembayaran</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--color-primary)] font-bold">{textBar}</span>
                          <span className="text-gray-950 font-black">{paidPercent}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${paidPercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] h-full rounded-full"
                        />
                      </div>
                    </div>

                    {/* Rincian Tagihan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-2 text-xs sm:text-sm text-gray-800">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[var(--color-text-muted)] font-light">Total Tagihan:</span>
                        <strong className="text-gray-950 font-bold">{formatRupiah(invoice.total_debt)}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[var(--color-text-muted)] font-light">Total Terbayar:</span>
                        <strong className="text-green-600 font-bold">{formatRupiah(invoice.paid_amount)}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[var(--color-text-muted)] font-light">Sisa Tagihan:</span>
                        <strong className="text-red-600 font-extrabold">{formatRupiah(invoice.remaining_debt)}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-[var(--color-text-muted)] font-light">Cicilan Berjalan:</span>
                        <strong className="text-[var(--color-secondary)] font-bold">{invoice.current_installment} / {invoice.installment_count}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5 sm:col-span-2">
                        <span className="text-[var(--color-text-muted)] font-light">Jatuh Tempo:</span>
                        <strong className="text-amber-800 font-bold flex items-center gap-1">
                          <Calendar size={13} /> {invoice.due_date_formatted}
                        </strong>
                      </div>
                    </div>

                    {/* Breakdown Tagihan Periode Ini */}
                    <div className="border-t border-dashed border-gray-200 mt-2 pt-3 space-y-1.5 text-xs bg-gray-50/50 p-3 rounded-xl">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Rincian Periode Berjalan</p>
                      <div className="flex justify-between"><span className="text-gray-500">Tagihan Periode Ini:</span><span className="font-semibold text-gray-900">{invoice.tagihan_periode_ini_formatted || formatRupiah(invoice.installment_amount || '0')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Sudah Dibayar Periode Ini:</span><span className="font-semibold text-green-600">{invoice.sudah_dibayar_periode_ini_formatted || formatRupiah('0')}</span></div>
                      <div className="flex justify-between border-t border-dashed pt-1.5"><span className="font-semibold text-gray-800">Sisa Tagihan Periode Ini:</span><span className="font-bold text-red-600">{invoice.sisa_tagihan_periode_ini_formatted || formatRupiah(invoice.installment_amount || '0')}</span></div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-36 mt-2 md:mt-0">
                    {invoice.status !== 'lunas' && (
                      <>
                        <button 
                          onClick={() => {
                            setPayingId(payingId === invoice.id ? null : invoice.id);
                            setPayAmount(invoice.installment_amount || '');
                          }} 
                          className="btn-primary text-xs !py-2.5 shadow-sm"
                        >
                          Bayar Cicilan
                        </button>
                        <button 
                          onClick={() => {
                            setPayingId(payingId === invoice.id ? null : invoice.id);
                            setPayAmount(invoice.installment_amount || '');
                          }} 
                          className="btn-secondary text-xs !py-2.5 flex items-center justify-center gap-1"
                        >
                          <Upload size={13} /> Upload Bukti
                        </button>
                      </>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      <Link href={`/orders/${invoice.order?.id}`} className="btn-ghost !text-[9px] !py-2 !px-1.5 flex-1 border border-gray-200 text-center hover:bg-gray-50 font-bold rounded-lg">
                        Pesanan
                      </Link>
                      <button 
                        onClick={() => handleDownloadReceipt(invoice.id, invoice.invoice_number)}
                        className="btn-ghost !text-[9px] !py-2 !px-1.5 flex-1 border border-gray-200 text-center hover:bg-gray-50 font-bold rounded-lg"
                      >
                        Struk PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Riwayat Pembayaran</p>
                  {invoice.payments && invoice.payments.length > 0 ? (
                    <div className="space-y-1.5">
                      {invoice.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                          <div>
                            <span className="font-semibold text-gray-900">{formatDate(p.created_at)}</span>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <span className="text-[var(--color-text-muted)] capitalize">{p.payment_method}</span>
                            {p.verified_at ? (
                              <span className="ml-2 text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Verified</span>
                            ) : (
                              <span className="ml-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Pending</span>
                            )}
                          </div>
                          <span className="font-bold text-green-600">{formatRupiah(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)] italic">Belum ada riwayat pembayaran untuk invoice ini.</p>
                  )}
                </div>

                {/* Inline Payment Form */}
                <AnimatePresence>
                  {payingId === invoice.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 border-t border-dashed pt-4 overflow-hidden"
                    >
                      <div className="mb-2.5 text-xs text-[var(--color-text-muted)]">
                        Maksimal nominal pembayaran saat ini: <strong className="text-gray-900">{formatRupiah(invoice.remaining_debt)}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-end bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 block uppercase tracking-wider">Jumlah Bayar Cicilan</label>
                          <input 
                            type="number" 
                            value={payAmount} 
                            onChange={(e) => setPayAmount(e.target.value)} 
                            placeholder="Masukkan nominal bayar" 
                            className="input-field text-xs" 
                          />
                        </div>
                        <label className="btn-secondary text-xs !py-3 px-4 cursor-pointer bg-white border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white shrink-0 shadow-sm flex items-center justify-center gap-1 font-bold">
                          <Upload size={14} /> Upload Bukti &amp; Bayar
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => { if (e.target.files?.[0]) handlePay(invoice.id, e.target.files[0]); }} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-[10px] text-[var(--color-text-muted)] italic">Catatan: Bukti transfer akan ditinjau dan diverifikasi oleh admin.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

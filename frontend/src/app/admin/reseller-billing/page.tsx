'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import type { Invoice, PaginatedResponse } from '@/types/api';
import toast from 'react-hot-toast';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type VerifyPayload = { approved: boolean };
type InvoiceLoose = Invoice & {
  proof_image_url?: string | null;
  reseller_name?: string | null;
  user?: { name?: string | null };
  order?: { order_number?: string | number | null; id?: number };
  installment_count: number;
  current_installment: number;
};

function BillingList() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [remindingId, setRemindingId] = useState<number | null>(null);

  async function fetchInvoices() {
    try {
      const { data } = await api.get<PaginatedResponse<Invoice>>('/admin/invoices', {
        params: { status: statusParam || undefined },
      });
      setInvoices(data.data);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [statusParam]);



  async function verify(invoiceId: number, approved: boolean) {
    setVerifyingId(invoiceId);
    const t = toast.loading('Memproses verifikasi...');

    try {
      const payload: VerifyPayload = { approved };
      await api.patch(`/admin/reseller-invoices/${invoiceId}/verify`, payload);
      toast.success(approved ? '✅ Approve berhasil' : '❌ Reject berhasil', { id: t });
      await fetchInvoices();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal';
      toast.error('❌ ' + msg, { id: t });
    } finally {
      setVerifyingId(null);
    }
  }

  async function remind(invoiceId: number) {
    setRemindingId(invoiceId);
    const t = toast.loading('Mengirim notifikasi...');

    try {
      await api.post(`/admin/reseller-invoices/${invoiceId}/remind`);
      toast.success('✅ Notifikasi penagihan dikirim!', { id: t });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal';
      toast.error('❌ ' + msg, { id: t });
    } finally {
      setRemindingId(null);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-2">Penagihan Reseller</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        {statusParam === 'terlambat' ? 'Daftar invoice tempo terlambat.' : 'Kelola invoice tempo reseller.'}
      </p>

      {invoices.length === 0 ? (
        <div className="card text-center py-16">Tidak ada tagihan.</div>
      ) : (
        <div className="space-y-4">
          {invoices.map((rawInv) => {
            const inv = rawInv as InvoiceLoose;
            const rawProofUrl = inv.proof_image_url || null;
            const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
            const proofUrl = rawProofUrl
              ? (rawProofUrl.startsWith('http://') || rawProofUrl.startsWith('https://') || rawProofUrl.startsWith('/')
                ? rawProofUrl
                : `${apiBaseUrl}/storage/proofs/${rawProofUrl}`)
              : null;

            return (
              <div key={inv.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                       <span className="font-bold text-[var(--color-primary)]">{inv.invoice_number}</span>
                       <StatusBadge status={inv.status} label={inv.status_label} />
                       {inv.is_overdue && <span className="badge bg-red-100 text-red-700">Terlambat</span>}
                       <span className="badge bg-gray-100 text-gray-700">Jatuh Tempo: {inv.due_date_formatted}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-[var(--color-text-muted)]">
                       <p>Nama Reseller: <strong className="text-[var(--color-text)]">{inv.reseller_name || inv.user?.name || '-'}</strong></p>
                       <p>Nomor Order: <strong className="text-[var(--color-text)]">{inv.order?.order_number || inv.order?.id || '-'}</strong></p>
                       <p>Total Tagihan: <strong className="text-[var(--color-text)]">{formatRupiah(inv.total_debt)}</strong></p>
                       <p>Sudah Dibayar: <strong className="text-green-600">{formatRupiah(inv.paid_amount)}</strong></p>
                       <p>Sisa Tagihan: <strong className="text-red-600">{formatRupiah(inv.remaining_debt)}</strong></p>
                       <p>Cicilan: <strong className="text-[var(--color-secondary)]">{inv.current_installment} / {inv.installment_count}</strong></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-[var(--color-text-muted)] mt-2 pt-2 border-t border-dashed">
                       <p>Tagihan Periode Ini: <strong className="text-[var(--color-text)]">{inv.tagihan_periode_ini_formatted || formatRupiah(inv.installment_amount || '0')}</strong></p>
                       <p>Sudah Dibayar Periode Ini: <strong className="text-green-600">{inv.sudah_dibayar_periode_ini_formatted || formatRupiah('0')}</strong></p>
                       <p>Sisa Tagihan Periode Ini: <strong className="text-red-600">{inv.sisa_tagihan_periode_ini_formatted || formatRupiah(inv.installment_amount || '0')}</strong></p>
                    </div>

                    {proofUrl ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold mb-1">Bukti Pembayaran Terkini:</p>
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          Lihat Bukti Transfer
                        </a>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs italic text-[var(--color-text-muted)]">Bukti tidak tersedia</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      className="btn-ghost !py-2 !px-4 text-xs font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/5"
                      disabled={remindingId === inv.id}
                      onClick={() => remind(inv.id)}
                    >
                      {remindingId === inv.id ? 'Mengirim...' : 'Tagih'}
                    </button>
                    
                    {inv.status === 'menunggu_verifikasi' && (
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary !py-2 !px-4 text-sm"
                          disabled={verifyingId === inv.id}
                          onClick={() => verify(inv.id, false)}
                        >
                          Reject
                        </button>
                        <button
                          className="btn-primary !py-2 !px-4 text-sm"
                          disabled={verifyingId === inv.id}
                          onClick={() => verify(inv.id, true)}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminResellerBillingPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <BillingList />
    </Suspense>
  );
}


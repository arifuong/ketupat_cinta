'use client';

import { useState } from 'react';
import { FileText, Download, Printer, BarChart2, DollarSign, ShoppingBag, Users } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const reportTypes = [
  { id: 'orders', label: 'Laporan Pesanan', icon: <ShoppingBag className="text-blue-500" />, endpoint: '/admin/reports/orders', filename: 'laporan-pesanan' },
  { id: 'payments', label: 'Laporan Pembayaran', icon: <CreditCardIcon className="text-green-500" />, endpoint: '/admin/reports/payments', filename: 'laporan-pembayaran' },
  { id: 'billing', label: 'Laporan Tagihan Reseller', icon: <DollarSign className="text-amber-500" />, endpoint: '/admin/reports/reseller-billing', filename: 'laporan-penagihan' },
  { id: 'installments', label: 'Laporan Cicilan Tempo', icon: <BarChart2 className="text-purple-500" />, endpoint: '/admin/reports/reseller-billing', filename: 'laporan-cicilan' },
];

function CreditCardIcon({ className }: { className?: string }) {
    return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDownload = async (type: typeof reportTypes[0], format: 'pdf' | 'csv') => {
    const loaderId = `${type.id}-${format}`;
    setLoading(loaderId);
    const t = toast.loading(`Menyiapkan laporan ${format.toUpperCase()}...`);
    
    try {
      const response = await api.get(type.endpoint, {
        params: { 
            id: type.id,
            export: format,
            start_date: startDate || undefined,
            end_date: endDate || undefined
        },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type.filename}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`, { id: t });
    } catch (err) {
      toast.error('Gagal mengunduh laporan.', { id: t });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="section-title">Laporan & Analisis</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">Unduh laporan bisnis dalam format PDF atau CSV (Excel)</p>
      </div>

      <div className="card mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Filter Periode</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block">Tanggal Mulai</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block">Tanggal Selesai</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((type) => (
          <div key={type.id} className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 group-hover:bg-white transition-colors">
                  {type.icon}
                </div>
                <div>
                  <h3 className="font-bold">{type.label}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Data real-time</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                    disabled={!!loading}
                    onClick={() => handleDownload(type, 'pdf')}
                    className="btn-ghost !p-2 rounded-lg border border-gray-200 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                    title="Unduh PDF"
                >
                    <FileText size={18} />
                </button>
                <button
                    disabled={!!loading}
                    onClick={() => handleDownload(type, 'csv')}
                    className="btn-ghost !p-2 rounded-lg border border-gray-200 hover:border-green-200 hover:text-green-600 disabled:opacity-50"
                    title="Export CSV (Excel)"
                >
                    <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center p-8 border-2 border-dashed border-gray-200 rounded-3xl">
        <Printer size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-bold text-gray-400">Mode Cetak Langsung</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto mt-2">Gunakan tombol print pada browser (Ctrl+P) saat melihat detail untuk mencetak struk secara langsung.</p>
      </div>
    </div>
  );
}

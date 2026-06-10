'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ShoppingBag, CreditCard, Users, AlertTriangle, DollarSign, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { DashboardStats, ApiResponse } from '@/types/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
        setStats(data.data);
      } catch { } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const cards = [
    { icon: <ShoppingBag size={24} />, label: 'Pesanan Hari Ini', value: stats?.total_orders_today || 0, color: 'var(--color-primary)', bg: 'var(--color-primary)' },
    { icon: <Clock size={24} />, label: 'Menunggu Verifikasi', value: stats?.orders_pending_payment || 0, color: 'var(--color-warning)', bg: 'var(--color-warning)' },
    { icon: <CreditCard size={24} />, label: 'Sedang Diproses', value: stats?.orders_processing || 0, color: 'var(--color-secondary)', bg: 'var(--color-secondary)' },
    { icon: <TrendingUp size={24} />, label: 'Total Revenue', value: formatRupiah(stats?.total_revenue || 0), color: 'var(--color-success)', bg: 'var(--color-success)' },
    { icon: <Users size={24} />, label: 'Total Customer', value: stats?.total_customers || 0, color: '#6366f1', bg: '#6366f1' },
    { icon: <Users size={24} />, label: 'Total Reseller', value: stats?.total_resellers || 0, color: '#8b5cf6', bg: '#8b5cf6' },
    { icon: <AlertTriangle size={24} />, label: 'Invoice Terlambat', value: stats?.overdue_invoices || 0, color: 'var(--color-error)', bg: 'var(--color-error)' },
    { icon: <DollarSign size={24} />, label: 'Total Piutang', value: formatRupiah(stats?.total_unpaid_debt || 0), color: '#f59e0b', bg: '#f59e0b' },
  ];

  const quickLinks = [
    { href: '/admin/orders', label: 'Kelola Pesanan', icon: <ShoppingBag size={20} />, desc: 'Lihat, verifikasi, dan update status pesanan' },
    { href: '/admin/payments', label: 'Verifikasi Pembayaran', icon: <CreditCard size={20} />, desc: 'Approve atau reject bukti bayar' },
    { href: '/admin/products', label: 'Kelola Produk & PO', icon: <BarChart3 size={20} />, desc: 'Tambah produk dan buat jadwal PO' },
    { href: '/admin/users', label: 'Manajemen User', icon: <Users size={20} />, desc: 'Kelola customer dan reseller' },
    { href: '/admin/reseller-applications', label: 'Pengajuan Reseller', icon: <Users size={20} />, desc: 'Approve atau reject pengajuan reseller' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="section-title">Dashboard Admin</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">Monitoring bisnis Ketupat Cinta</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="card !p-5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: `${card.bg}` }}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-bold mb-4">Menu Cepat</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, i) => (
          <Link key={i} href={link.href} className="card-product !p-5 group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[var(--color-primary)]">{link.icon}</span>
              <h3 className="font-semibold">{link.label}</h3>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

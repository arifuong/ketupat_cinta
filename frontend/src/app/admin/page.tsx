'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ShoppingBag, CreditCard, Users, AlertTriangle, DollarSign, Clock, TrendingUp, ChevronRight, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import type { DashboardStats, ApiResponse } from '@/types/api';
import { motion } from 'framer-motion';

// CountUp Component for stats numbers
function CountUp({ to, isCurrency = false }: { to: number; isCurrency?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    let startTime: number | null = null;
    const duration = 1200; // ms

    const step = (timestamp: number) => {
      if (!active) return;
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * to));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);

    return () => {
      active = false;
    };
  }, [to]);

  if (isCurrency) {
    return <span>{formatRupiah(count.toString())}</span>;
  }
  return <span>{count}</span>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [todoCounts, setTodoCounts] = useState<{
    pending_orders: number;
    pending_payments: number;
    pending_reseller_billings: number;
    pending_users: number;
  } | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchAllData() {
      try {
        const [statsRes, todoRes] = await Promise.all([
          api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),
          api.get<ApiResponse<{
            pending_orders: number;
            pending_payments: number;
            pending_reseller_billings: number;
            pending_users: number;
          }>>('/admin/dashboard/todo-summary')
        ]);
        setStats(statsRes.data.data);
        setTodoCounts(todoRes.data.data);
      } catch { } finally {
        setLoading(false);
      }
    }

    fetchAllData();
    intervalId = setInterval(fetchAllData, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getBadgeCount = (label: string) => {
    if (!todoCounts) return 0;
    switch (label) {
      case 'Kelola Pesanan':
        return todoCounts.pending_orders;
      case 'Verifikasi Pembayaran':
        return todoCounts.pending_payments;
      case 'Penagihan Reseller':
        return todoCounts.pending_reseller_billings;
      case 'Manajemen User':
        return todoCounts.pending_users;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="section-title">Dashboard Admin</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">Monitoring bisnis Ketupat Cinta</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const cards = [
    { icon: <ShoppingBag size={22} />, label: 'Pesanan Hari Ini', value: stats?.total_orders_today || 0, isCurrency: false, color: 'var(--color-primary)', bg: 'rgba(11, 90, 74, 0.1)', href: '/admin/orders' },
    { icon: <TrendingUp size={22} />, label: 'Total Revenue', value: stats?.total_revenue || 0, isCurrency: true, color: 'var(--color-success)', bg: 'rgba(22, 163, 74, 0.1)', href: '/admin/payments' },
    { icon: <Users size={22} />, label: 'Total Customer', value: stats?.total_customers || 0, isCurrency: false, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', href: '/admin/users?role=customer' },
    { icon: <Users size={22} />, label: 'Total Reseller', value: stats?.total_resellers || 0, isCurrency: false, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', href: '/admin/users?role=reseller' },
  ];

  const quickLinks = [
    { href: '/admin/orders', label: 'Kelola Pesanan', icon: <ShoppingBag size={18} />, desc: 'Lihat, verifikasi, dan update status pesanan' },
    { href: '/admin/payments', label: 'Verifikasi Pembayaran', icon: <CreditCard size={18} />, desc: 'Approve atau reject bukti bayar' },
    { href: '/admin/reseller-billing', label: 'Penagihan Reseller', icon: <DollarSign size={18} />, desc: 'Kelola invoice tempo dan verifikasi bayar' },
    { href: '/admin/reports', label: 'Laporan Penjualan', icon: <BarChart3 size={18} />, desc: 'Download laporan pesanan, bayar, & penagihan' },
    { href: '/admin/products', label: 'Kelola Produk & PO', icon: <BarChart3 size={18} />, desc: 'Tambah produk dan buat jadwal PO' },
    { href: '/admin/users', label: 'Manajemen User', icon: <Users size={18} />, desc: 'Kelola customer dan reseller' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
          Halaman Admin
        </span>
        <h1 className="section-title mt-2">Dashboard Admin</h1>
        <p className="mt-1 text-xs text-[var(--color-text-muted)] font-light">Ringkasan operasional bisnis dan menu pengelolaan toko Ketupat Cinta.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        {cards.map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className="card !p-5 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 border border-[var(--color-border)] bg-white relative overflow-hidden group block"
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105" 
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
            </div>
            
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              <CountUp to={Number(card.value)} isCurrency={card.isCurrency} />
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Reseller Billings section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5">
          <DollarSign size={16} className="text-[var(--color-primary)]" />
          Status Penagihan Reseller
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Menunggu Verifikasi', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.08)', href: '/admin/reseller-billing?status=menunggu_verifikasi' },
            { label: 'Cicilan Berjalan', color: 'var(--color-secondary)', bg: 'rgba(212, 175, 55, 0.08)', href: '/admin/reseller-billing?status=sebagian_dibayar' },
            { label: 'Tagihan Lunas', color: 'var(--color-success)', bg: 'rgba(22, 163, 74, 0.08)', href: '/admin/reseller-billing?status=lunas' },
            { label: 'Terlambat', color: 'var(--color-danger)', bg: 'rgba(220, 38, 38, 0.08)', href: '/admin/reseller-billing?status=terlambat' },
          ].map((item, i) => (
            <Link 
              key={i} 
              href={item.href} 
              className="card !p-4 hover:border-[var(--color-primary)]/30 hover:shadow bg-white transition-all duration-300 block"
            >
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2.5" 
                style={{ color: item.color, backgroundColor: item.bg }}
              >
                {item.label}
              </span>
              <p className="text-base font-bold text-gray-900 flex items-center justify-between">
                Lihat Tagihan <ChevronRight size={14} className="text-gray-400" />
              </p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Links / Navigation Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5">
          <BarChart3 size={16} className="text-[var(--color-primary)]" />
          Menu Pengelolaan
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, i) => {
            const count = getBadgeCount(link.label);
            return (
              <Link 
                key={i} 
                href={link.href} 
                className="card-product !p-5 group flex flex-col justify-between relative overflow-hidden"
              >
                {count > 0 && (
                  <span className="absolute top-4 right-4 flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border border-white select-none">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
                    <h3 className="font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{link.label}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] font-light leading-relaxed">{link.desc}</p>
                </div>
                <div className="mt-4 text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka Menu <ArrowRight size={10} />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

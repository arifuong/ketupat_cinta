'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Bell, Menu, X, LogOut, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import api from '@/lib/api';
import type { Notification, ApiResponse } from '@/types/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const isAdmin = user?.role === 'admin';

  // Fetch unread count & notifications
  async function fetchNotifications() {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications');
      setUnreadNotifications(data.meta?.unread_count || 0);
      setRecentNotifications(data.data?.slice(0, 4) || []);
    } catch { }
  }

  // Handle Scroll
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch count & updates
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      setRecentNotifications([]);
      return;
    }
    
    fetchNotifications();

    window.addEventListener('notifications_updated', fetchNotifications);
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      window.removeEventListener('notifications_updated', fetchNotifications);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Click Outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = isAdmin
    ? [{ href: '/admin', label: 'Dashboard Admin' }]
    : [
        { href: '/products', label: 'Produk' },
        ...(isAuthenticated ? [{ href: '/orders', label: 'Pesanan' }] : []),
        ...(user?.role === 'reseller' ? [{ href: '/reseller/invoices', label: 'Tagihan' }] : []),
      ];

  const dashboardHref = isAdmin ? '/admin' : '/orders';

  async function markRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
      window.dispatchEvent(new Event('notifications_updated'));
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
      window.dispatchEvent(new Event('notifications_updated'));
    } catch {}
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 bg-white shadow-sm ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md py-2 border-b border-[var(--color-border)]' 
          : 'py-4 border-b border-[var(--color-border)]/50'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <span className="text-2xl animate-float">🌿</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--color-primary)]">
            Ketupat <span className="text-[var(--color-secondary)]">Cinta</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {isAuthenticated ? (
            <>
              {/* Cart — hidden for admin */}
              {!isAdmin && (
                <Link href="/cart" className="btn-ghost relative hover:scale-105 active:scale-95 transition-transform">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[10px] font-bold text-white shadow-sm"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </Link>
              )}

              {/* Notifications Dropdown Toggle */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="btn-ghost relative hover:scale-105 active:scale-95 transition-transform"
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[9px] font-bold text-white animate-pulse-slow shadow">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-2xl z-50"
                    >
                      <div className="flex items-center justify-between border-b pb-2 mb-2 px-1">
                        <span className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                          <Bell size={16} className="text-[var(--color-primary)]" />
                          Notifikasi ({unreadNotifications})
                        </span>
                        {unreadNotifications > 0 && (
                          <button 
                            onClick={markAllRead} 
                            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <CheckCheck size={14} /> Baca Semua
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                        {recentNotifications.length === 0 ? (
                          <div className="text-center py-8 text-xs text-[var(--color-text-muted)] italic">
                            Tidak ada notifikasi baru
                          </div>
                        ) : (
                          recentNotifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-2.5 rounded-xl border border-transparent transition-all flex items-start gap-2.5 ${
                                !notif.is_read 
                                  ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/10' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-950 leading-tight">{notif.title}</p>
                                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-normal">{notif.message}</p>
                                <p className="text-[9px] text-gray-400 mt-1 font-medium">{notif.time_ago}</p>
                              </div>
                              {!notif.is_read && (
                                <button 
                                  onClick={() => markRead(notif.id)}
                                  className="text-xs text-[var(--color-primary)] hover:bg-white p-1 rounded-lg border border-transparent hover:border-gray-100 shadow-sm shrink-0"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t pt-2.5 mt-2.5 text-center">
                        <Link 
                          href="/notifications" 
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors inline-block w-full"
                        >
                          Lihat Semua Notifikasi
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Dropdown */}
              <div className="hidden lg:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="btn-ghost flex items-center gap-1.5 md:gap-2 px-1 py-1 hover:bg-[var(--color-primary)]/5 rounded-xl transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-xs font-bold text-white shadow-sm border border-white/20">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-semibold lg:block max-w-[80px] truncate">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 text-[var(--color-text-muted)] ${dropdownOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-3 w-56 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-2xl z-50"
                    >
                      <div className="border-b px-3 py-2.5 mb-1.5">
                        <p className="text-sm font-bold text-gray-950 leading-tight">{user?.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 font-medium">{user?.role_label}</p>
                      </div>
                      <Link href="/profile" className="sidebar-link text-sm" onClick={() => setDropdownOpen(false)}>
                        <User size={16} /> Profil Saya
                      </Link>
                      <Link href={dashboardHref} className="sidebar-link text-sm" onClick={() => setDropdownOpen(false)}>
                        <Menu size={16} /> Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          await logout();
                          setDropdownOpen(false);
                          router.replace('/');
                        }}
                        className="sidebar-link text-sm w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold"
                      >
                        <LogOut size={16} /> Keluar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="btn-ghost text-xs md:text-sm">Masuk</Link>
              <Link href="/register" className="btn-primary text-xs md:text-sm !py-2 !px-4">Daftar</Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden">
            <button className="btn-ghost px-2" onClick={() => setMobileOpen(true)}>
              <Menu size={22} className="text-[var(--color-primary)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Drawer Menu (Slide from right) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-[55] lg:hidden"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 h-screen w-[75%] max-w-[80vw] bg-white shadow-2xl z-[60] p-6 flex flex-col lg:hidden border-l border-[var(--color-border)] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <span className="font-bold text-[var(--color-primary)] text-lg">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="btn-ghost !p-2">
                  <X size={20} className="text-gray-500 hover:text-[var(--color-primary)]" />
                </button>
              </div>

              {isAuthenticated && (
                <div className="flex items-center gap-3 border-b pb-4 mb-6 px-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-sm font-bold text-white shadow-sm border border-white/20">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{user?.role_label}</p>
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-2 overflow-y-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`sidebar-link !py-3 !px-4 ${pathname === link.href ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="border-t my-4" />
                    
                    <Link
                      href="/profile"
                      className={`sidebar-link !py-3 !px-4 ${pathname === '/profile' ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <User size={16} /> Profil Saya
                    </Link>

                    {!isAdmin && (
                      <Link
                        href="/orders"
                        className={`sidebar-link !py-3 !px-4 ${pathname === '/orders' ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <ShoppingCart size={16} /> Pesanan Saya
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={`sidebar-link !py-3 !px-4 ${pathname === '/admin' ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Menu size={16} /> Dashboard Admin
                      </Link>
                    )}

                    {user?.role === 'reseller' && (
                      <Link
                        href="/reseller/invoices"
                        className={`sidebar-link !py-3 !px-4 ${pathname === '/reseller/invoices' ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Menu size={16} /> Dashboard Reseller
                      </Link>
                    )}

                    <div className="border-t my-4" />
                    
                    <button
                      onClick={async () => {
                        await logout();
                        setMobileOpen(false);
                        router.replace('/');
                      }}
                      className="sidebar-link text-sm w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold !py-3 !px-4"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

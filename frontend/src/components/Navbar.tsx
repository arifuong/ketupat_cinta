'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Bell, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = isAdmin
    ? [{ href: '/admin', label: 'Dashboard Admin' }]
    : [
        { href: '/products', label: 'Produk' },
        ...(isAuthenticated ? [{ href: '/orders', label: 'Pesanan' }] : []),
        ...(user?.role === 'reseller' ? [{ href: '/reseller/invoices', label: 'Tagihan' }] : []),
      ];

  const dashboardHref = isAdmin ? '/admin' : '/orders';

  return (
    <header className="glass sticky top-0 z-50 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Ketupat Cinta"
            width={200}
            height={60}
            priority
            className="h-12 w-auto object-contain"
          />
          <span className="text-xl font-bold gradient-text">
            Ketupat Cinta
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                pathname === link.href
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/8'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-black/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Cart — hidden for admin */}
              {!isAdmin && (
                <Link href="/cart" className="btn-ghost relative">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Notifications */}
              <Link href="/notifications" className="btn-ghost">
                <Bell size={20} />
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-xs font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium md:block">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="animate-scale-in absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white p-2 shadow-xl">
                    <div className="border-b px-3 py-2 mb-1">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{user?.role_label}</p>
                    </div>
                    <Link href="/profile" className="sidebar-link text-sm" onClick={() => setDropdownOpen(false)}>
                      <User size={16} /> Profil Saya
                    </Link>
                    <Link href={dashboardHref} className="sidebar-link text-sm" onClick={() => setDropdownOpen(false)}>
                      <Menu size={16} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="sidebar-link text-sm w-full text-red-500 hover:text-red-600"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost text-sm">Masuk</Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4">Daftar</Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button className="btn-ghost md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="animate-slide-up border-t bg-white px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="sidebar-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

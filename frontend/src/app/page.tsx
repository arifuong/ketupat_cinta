'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Star, Leaf, Calendar, Tag, Heart, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { formatImageUrl } from '@/lib/imageUtils';
import type { Product, ApiResponse } from '@/types/api';

const testimonials = [
  { name: 'Ibu Sari', initials: 'IS', role: 'Pelanggan Setia', text: 'Ketupatnya enak banget, fresh, dan pengirimannya cepat!', rating: 5 },
  { name: 'Pak Dedi', initials: 'PD', role: 'Pelanggan', text: 'Sudah langganan 2 tahun, kualitas selalu konsisten.', rating: 5 },
  { name: 'Teh Rina', initials: 'TR', role: 'Pelanggan', text: 'Cocok untuk arisan keluarga, semua suka!', rating: 5 },
  { name: 'Kang Aldi', initials: 'KA', role: 'Reseller', text: 'Harga reseller sangat bersahabat, margin bagus.', rating: 5 },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get<ApiResponse<Product[]>>('/products');
        setProducts(data.data);
      } catch {}
    }
    fetchProducts();
  }, []);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 5000);
    return () => clearInterval(timer);
  }, [nextTestimonial]);

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2FA084, #1F6F5F)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <span className="mb-6 inline-block text-6xl">🧡</span>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Ketupat Premium<br />Buatan Rumahan
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-white/80 leading-relaxed">
              Pre-order ketupat berkualitas terbaik dengan sistem PO terjadwal.
              Melayani area <strong className="text-white">Bandung</strong> &amp; <strong className="text-white">Cimahi</strong>
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#2FA084] shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                <ShoppingBag size={20} />
                Pesan Sekarang
                <ArrowRight size={18} />
              </Link>
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10">
                Lihat Produk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Cerita Ketupat Cinta ═══ */}
      <section className="py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Cerita <span className="gradient-text">Ketupat Cinta</span></h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Dibalik setiap ketupat ada cerita cinta</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="card text-center animate-slide-up">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
                <span className="text-2xl">📜</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Sejarah</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Berawal dari dapur rumah, kini melayani ratusan pelanggan setia di Bandung dan Cimahi dengan resep autentik turun temurun.
              </p>
            </div>
            <div className="card text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary)]/10">
                <span className="text-2xl">💚</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Filosofi</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Setiap ketupat dibuat dengan cinta dan kehati-hatian. Kami percaya makanan terbaik lahir dari hati yang tulus.
              </p>
            </div>
            <div className="card text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Kualitas</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Bahan pilihan, produksi higienis, dan rasa autentik. Standar kualitas kami tidak pernah kompromi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Kenapa Memilih Kami ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Kenapa Memilih <span className="gradient-text">Kami</span>?</h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Keunggulan yang membedakan kami</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: <Star className="text-[var(--color-primary)]" size={28} />, title: 'Premium Quality', desc: 'Bahan pilihan terbaik dengan resep turun temurun.' },
              { icon: <Leaf className="text-[var(--color-secondary)]" size={28} />, title: 'Fresh Made', desc: 'Dibuat segar setiap batch PO, tidak pakai pengawet.' },
              { icon: <Calendar className="text-[var(--color-accent)]" size={28} />, title: 'PO Terjadwal', desc: 'Sistem pre-order terorganisir dan tepat waktu.' },
              { icon: <Tag className="text-[var(--color-primary-dark)]" size={28} />, title: 'Harga Reseller', desc: 'Harga khusus untuk reseller, margin menarik.' },
              { icon: <Heart className="text-red-400" size={28} />, title: 'Dukungan UMKM', desc: 'Mendukung ekonomi lokal dan keluarga Indonesia.' },
            ].map((feature, i) => (
              <div key={i} className="card text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-bg)]">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Produk Unggulan ═══ */}
      <section className="py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Produk <span className="gradient-text">Unggulan</span></h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Pilihan ketupat terbaik untuk Anda</p>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <Link key={product.id} href="/products" className="card-product group">
                  <div className="flex h-48 items-center justify-center rounded-xl mb-4 overflow-hidden bg-gray-100">
                    <Image src={formatImageUrl(product.image_url)} alt={product.name} width={400} height={300} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold gradient-text">{formatRupiah(product.price)}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">/ pcs</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-[var(--color-text-muted)]">Belum ada produk tersedia.</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-10 text-center">
              <Link href="/products" className="btn-primary text-base !px-8 !py-4">
                Lihat Semua Produk
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Cara Pemesanan ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Cara <span className="gradient-text">Pemesanan</span></h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Mudah dan cepat dalam 5 langkah</p>
          </div>

          <div className="grid gap-8 md:grid-cols-5">
            {[
              { step: '1', title: 'Pilih Produk', desc: 'Pilih ketupat atau menu yang tersedia.' },
              { step: '2', title: 'Pilih Jadwal PO', desc: 'Tentukan tanggal PO sesuai kebutuhan.' },
              { step: '3', title: 'Checkout', desc: 'Masukkan alamat dan pilih pengiriman.' },
              { step: '4', title: 'Pembayaran', desc: 'Transfer, QRIS, atau pembayaran online.' },
              { step: '5', title: 'Pengiriman', desc: 'Pesanan diantar ke alamat Anda.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #2FA084, #1F6F5F)' }}>
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{item.desc}</p>
                {i < 4 && (
                  <div className="absolute right-0 top-6 hidden w-full -translate-x-1/2 md:block">
                    <div className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimoni ═══ */}
      <section className="py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="section-title">Apa Kata <span className="gradient-text">Mereka</span>?</h2>
            <p className="mt-3 text-[var(--color-text-muted)]">Testimoni pelanggan kami</p>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <div className="card !p-8 text-center animate-scale-in" key={currentTestimonial}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #2FA084, #1F6F5F)' }}>
                {testimonials[currentTestimonial].initials}
              </div>
              <div className="mb-3 flex items-center justify-center gap-1">
                {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-lg italic text-[var(--color-text-main)] leading-relaxed">
                &ldquo;{testimonials[currentTestimonial].text}&rdquo;
              </p>
              <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{testimonials[currentTestimonial].role}</p>
            </div>

            {/* Navigation arrows */}
            <button onClick={prevTestimonial} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all border border-[var(--color-border)]">
              <ChevronLeft size={20} className="text-[var(--color-text-muted)]" />
            </button>
            <button onClick={nextTestimonial} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all border border-[var(--color-border)]">
              <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
            </button>

            {/* Dots */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all ${i === currentTestimonial ? 'w-8 bg-[var(--color-primary)]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white md:px-16" style={{ background: 'linear-gradient(135deg, #1F6F5F, #2FA084)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Siap Pesan Ketupat?</h2>
              <p className="mx-auto mb-8 max-w-lg text-white/80">
                Bergabunglah sekarang dan nikmati ketupat premium untuk keluarga Anda.
                Daftar gratis, pesan mudah!
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#2FA084] shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                Mulai Sekarang
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Star, Leaf, Calendar, Tag, Heart, Package, ChevronLeft, ChevronRight, HelpCircle, Check, Quote } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { formatImageUrl } from '@/lib/imageUtils';
import type { Product, ApiResponse } from '@/types/api';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  { name: 'Ibu Sari', initials: 'IS', role: 'Pelanggan Setia', text: 'Ketupatnya enak banget, gurih, pulen, dan pengirimannya tepat waktu!', rating: 5 },
  { name: 'Pak Dedi', initials: 'PD', role: 'Pelanggan', text: 'Sudah langganan 2 tahun untuk acara keluarga. Rasa dan kualitas selalu konsisten.', rating: 5 },
  { name: 'Teh Rina', initials: 'TR', role: 'Pelanggan', text: 'Cocok banget buat arisan keluarga. Semua saudara memuji rasanya!', rating: 5 },
  { name: 'Kang Aldi', initials: 'KA', role: 'Reseller', text: 'Harga reseller bersahabat, pembayarannya fleksibel. Sangat membantu bisnis saya.', rating: 5 },
];

const faqData = [
  {
    question: 'Bagaimana sistem pre-order Ketupat Cinta?',
    answer: 'Ketupat Cinta diproduksi segar berdasarkan jadwal batch pre-order (PO) pilihan Anda. Saat berbelanja, Anda dapat melihat tanggal PO terdekat yang tersedia dan memilih pengiriman yang sesuai.'
  },
  {
    question: 'Apakah melayani pengiriman ke luar kota?',
    answer: 'Untuk menjaga kesegaran dan rasa autentik ketupat rumahan premium kami, saat ini pengiriman hanya melayani wilayah Bandung Raya dan Cimahi menggunakan kurir khusus.'
  },
  {
    question: 'Bagaimana cara menjadi Reseller?',
    answer: 'Silakan daftar akun baru terlebih dahulu, kemudian ajukan permohonan Reseller melalui halaman Profil Anda. Setelah diverifikasi oleh admin, Anda akan mendapatkan skema harga reseller dan fasilitas pembayaran tempo.'
  },
  {
    question: 'Berapa minimal order pembelian?',
    answer: 'Untuk pelanggan umum, minimal order 1. Khusus member Reseller, terdapat minimal order 10 pcs untuk mengaktifkan harga grosir khusus.'
  }
];

// Helper Animated CountUp Component
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let active = true;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let startTime: number | null = null;
        const duration = 1500; // ms
        
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
        observer.disconnect();
      }
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [to]);

  return <span ref={elementRef}>{count}{suffix}</span>;
}

// Helper FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-white transition-all duration-300">
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 text-left font-bold text-[var(--color-text-main)] hover:bg-[var(--color-primary)]/5 transition-colors gap-4"
      >
        <span className="flex items-center gap-2.5">
          <HelpCircle className="text-[var(--color-primary)] shrink-0" size={20} />
          {question}
        </span>
        <ChevronRight size={18} className={`text-[var(--color-primary)] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-5 pt-0 border-t border-dashed text-sm text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-bg)]/20">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Parallax Mouse Coordinates
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await api.get<ApiResponse<Product[]>>('/products');
        console.log('DEBUG [LandingPage]: API Response data:', data.data);
        if (data.data && data.data.length > 0) {
          console.log('DEBUG [LandingPage]: First Product:', data.data[0]);
          console.log('DEBUG [LandingPage]: Formatted Image URL:', formatImageUrl(data.data[0].image_url));
        }
        setProducts(data.data);
      } catch (err) {
        console.error('DEBUG [LandingPage]: Fetch error:', err);
      }
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x: x * 20, y: y * 20 });
  };

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative overflow-hidden py-20 lg:py-32 flex items-center min-h-[85vh]"
        style={{ background: 'radial-gradient(circle at 10% 20%, #0B5A4A 0%, #063D33 90%)' }}
      >
        {/* Animated Background Blob */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, 15, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              x: [0, -30, 0],
              y: [0, 15, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 -right-20 w-[500px] h-[500px] rounded-full bg-[var(--color-primary-dark)]/40 blur-3xl"
          />
        </div>

        {/* Floating Ketupat Decorations */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Ketupat 1 (Left) */}
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [12, 16, 12] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-6 top-1/4 opacity-10 sm:opacity-20 hidden md:block"
          >
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="25" width="50" height="50" rx="8" transform="rotate(45 50 50)" fill="#F2D46B" stroke="#D4AF37" strokeWidth="3" />
              <path d="M50 15V85M15 50H85M32.5 32.5L67.5 67.5M32.5 67.5L67.5 32.5" stroke="#063D33" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Ketupat 2 (Right) */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [-8, -12, -8] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute right-12 bottom-1/4 opacity-15 sm:opacity-25 hidden md:block"
          >
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="25" width="50" height="50" rx="8" transform="rotate(45 50 50)" fill="#D4AF37" stroke="#F2D46B" strokeWidth="3" />
              <path d="M50 15V85M15 50H85M32.5 32.5L67.5 67.5M32.5 67.5L67.5 32.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            </svg>
          </motion.div>
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 z-20 w-full">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            
            {/* Left Col: Main Text */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ x: coords.x * 0.4, y: coords.y * 0.4 }}
              className="md:col-span-7 text-center md:text-left space-y-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-[var(--color-secondary-light)] tracking-wide uppercase">
                ✨ Ketupat Premium Autentik
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
                KETUPAT CINTA
              </h1>
              <p className="text-base sm:text-lg text-white/80 max-w-lg leading-relaxed font-light">
                Pesan Ketupat Pre Order dengan Mudah, Aman, dan Fleksibel. Dibuat segar di Bandung &amp; Cimahi untuk hidangan spesial Anda.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
                <Link href="/products" className="btn-primary !px-8 !py-4 w-full sm:w-auto shadow-2xl">
                  <ShoppingBag size={18} />
                  Belanja Sekarang
                  <ArrowRight size={18} />
                </Link>
                <Link href="/register" className="btn-secondary !border-white/30 hover:!border-white !text-white hover:bg-white/10 !px-8 !py-4 w-full sm:w-auto">
                  Daftar Reseller
                </Link>
              </div>
            </motion.div>

            {/* Right Col: Graphic Image Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ x: -coords.x * 0.6, y: -coords.y * 0.6 }}
              className="md:col-span-5 flex justify-center relative"
            >
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-white/5 backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] opacity-25 z-10" />
                {/* Decorative floating badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 right-4 z-20 bg-[var(--color-secondary)] text-gray-950 font-black rounded-2xl px-4 py-2.5 shadow-xl text-center text-xs"
                >
                  <p className="uppercase tracking-wider">PRE ORDER</p>
                  <p className="text-[10px] font-bold opacity-80">Ready Setiap Minggu</p>
                </motion.div>
                <img 
                  src="/logo2.png" 
                  alt="Ketupat Cinta Banner" 
                  className="w-full h-full object-contain p-6 scale-90 relative z-0" 
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══ Statistik Section ═══ */}
      <section className="relative -mt-8 z-30 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-[var(--color-border)]">
          {[
            { to: 2, label: 'Total Produk', suffix: '' },
            { to: 500, label: 'Total Customer', suffix: '+' },
            { to: 120, label: 'Total Reseller', suffix: '+' },
            { to: 6000, label: 'Total Pesanan', suffix: '+' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 border-r last:border-r-0 border-dashed border-gray-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)]">
                <CountUp to={stat.to} suffix={stat.suffix} />
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Cerita Ketupat Cinta ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">Kisah Kami</span>
            <h2 className="section-title">Cerita <span className="gradient-text">Ketupat Cinta</span></h2>
            <p className="text-[var(--color-text-muted)] font-light text-sm">Dibalik cita rasa pulen autentik ketupat cinta.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { emoji: '📜', title: 'Resep Autentik', desc: 'Resep warisan keluarga turun temurun yang terus dijaga konsistensi rasa pulen dan kelembutannya.' },
              { emoji: '💚', title: 'Dibuat Dengan Cinta', desc: 'Setiap butir beras dibungkus dan dimasak higienis dengan ketulusan hati untuk menjamin rasa terbaik.' },
              { emoji: '✨', title: 'Kualitas Premium', desc: 'Menggunakan besek bambu pilihan, tali rami terbaik dan beras  pulen berkualitas standar.' }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card text-center hover:scale-[1.02]"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-2xl animate-float">
                  {card.emoji}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-text-main)]">{card.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-light">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Produk Unggulan ═══ */}
      <section className="py-20 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">Menu Terbaik</span>
            <h2 className="section-title">Produk <span className="gradient-text">Unggulan</span></h2>
            <p className="text-[var(--color-text-muted)] font-light text-sm">Ketupat premium terlaris yang siap dihidangkan.</p>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product, i) => {
                const isEven = i % 2 === 0;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Link href="/products" className="card-product group block relative">
                      {/* Image container with hover zoom */}
                      <div className="flex h-48 items-center justify-center rounded-xl mb-4 overflow-hidden bg-gray-50 relative">
                        <img
                          src={formatImageUrl(product.image_url)}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="badge bg-[var(--color-primary)] text-white text-[10px] shadow">
                            Pre Order
                          </span>
                          {isEven && (
                            <span className="badge bg-[var(--color-danger)] text-white text-[10px] shadow animate-pulse-slow">
                              Kuota Hampir Habis
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>
                      <p className="mt-1.5 text-sm text-[var(--color-text-muted)] line-clamp-2 font-light leading-relaxed">{product.description}</p>
                      
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[var(--color-primary)]">{formatRupiah(product.price)}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">/ pcs</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 card">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-[var(--color-text-muted)] font-medium">Belum ada produk unggulan yang tersedia saat ini.</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/products" className="btn-primary !px-8 !py-4 shadow-xl">
                Lihat Semua Produk
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Cara Kerja Timeline ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">Alur Belanja</span>
            <h2 className="section-title">Cara <span className="gradient-text">Pemesanan</span></h2>
            <p className="text-[var(--color-text-muted)] font-light text-sm">Langkah mudah memesan ketupat cinta online.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {[
              { step: '01', title: 'Pilih Produk', desc: 'Cari produk ketupat premium yang Anda inginkan dan pilih jadwal PO.' },
              { step: '02', title: 'Checkout & Alamat', desc: 'Masukkan detail alamat pengiriman di area Bandung & Cimahi.' },
              { step: '03', title: 'Pembayaran', desc: 'Selesaikan transaksi dengan transfer manual, QRIS, dan pembayaran yang lain.' },
              { step: '04', title: 'Pengiriman Kurir', desc: 'Pesanan diantar langsung kurir kami tepat di hari PO terjadwal.' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center p-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white transition-all duration-300 group-hover:scale-110 shadow-lg" style={{ background: 'linear-gradient(135deg, #0B5A4A, #063D33)' }}>
                  {item.step}
                </div>
                <h3 className="mb-2 font-bold text-[var(--color-text-main)] text-base group-hover:text-[var(--color-primary)] transition-colors">{item.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed font-light">{item.desc}</p>
                {i < 3 && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 hidden lg:block z-20 pointer-events-none opacity-40">
                    <ArrowRight size={20} className="text-[var(--color-primary)] animate-pulse-slow" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimoni Slider ═══ */}
      <section className="py-20 bg-white/40 backdrop-blur-sm relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">Review</span>
            <h2 className="section-title">Apa Kata <span className="gradient-text">Mereka</span>?</h2>
            <p className="text-[var(--color-text-muted)] font-light text-sm">Testimoni nyata pelanggan ketupat cinta.</p>
          </div>

          <div className="relative mx-auto max-w-2xl px-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentTestimonial}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3 }}
                className="card !p-8 sm:!p-10 text-center relative border border-[var(--color-border)] bg-white shadow-xl rounded-3xl"
              >
                <div className="absolute top-6 left-6 text-gray-100 hidden sm:block pointer-events-none">
                  <Quote size={56} className="fill-gray-50 stroke-[3px]" />
                </div>
                
                {/* Initial Avatar */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0B5A4A, #063D33)' }}>
                  {testimonials[currentTestimonial].initials}
                </div>
                
                {/* Stars */}
                <div className="mb-4 flex items-center justify-center gap-1">
                  {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
                  ))}
                </div>
                
                {/* Quotation text */}
                <p className="mb-6 text-base italic text-[var(--color-text-main)] font-light leading-relaxed">
                  &ldquo;{testimonials[currentTestimonial].text}&rdquo;
                </p>
                
                <h4 className="font-bold text-[var(--color-text-main)]">{testimonials[currentTestimonial].name}</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{testimonials[currentTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button 
              onClick={prevTestimonial} 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border border-[var(--color-border)] cursor-pointer text-gray-500 hover:text-[var(--color-primary)]"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextTestimonial} 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border border-[var(--color-border)] cursor-pointer text-gray-500 hover:text-[var(--color-primary)]"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === currentTestimonial ? 'w-8 bg-[var(--color-primary)]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ Section ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="mb-12 text-center max-w-lg mx-auto space-y-2">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">Pertanyaan</span>
            <h2 className="section-title">FAQ <span className="gradient-text">Ketupat Cinta</span></h2>
            <p className="text-[var(--color-text-muted)] font-light text-sm">Pertanyaan yang sering ditanyakan oleh pelanggan.</p>
          </div>

          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <FAQItem 
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div 
            className="relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white md:px-16 shadow-2xl border border-white/10" 
            style={{ background: 'radial-gradient(circle at 50% 50%, #0B5A4A 0%, #063D33 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
            
            <div className="relative z-10 max-w-lg mx-auto space-y-6">
              <h2 className="text-3xl font-extrabold md:text-4xl text-white">Siap Pesan Ketupat Cinta?</h2>
              <p className="text-white/80 leading-relaxed font-light text-sm sm:text-base">
                Pilih tanggal PO terbaik untuk kebutuhan katering arisan, hidangan mingguan, atau syukuran Anda hari ini.
              </p>
              <div className="pt-2">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-light)] px-8 py-4 font-bold text-gray-950 shadow-2xl transition-all hover:scale-105 active:scale-95 duration-300">
                  Mulai Pesan Sekarang
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

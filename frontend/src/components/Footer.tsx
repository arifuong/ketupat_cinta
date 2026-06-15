import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Mail, MapPin, Music, ChevronRight, Globe, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden" style={{ backgroundColor: '#063D33' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 10% 10%, white 1px, transparent 1px), radial-gradient(circle at 90% 90%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 relative z-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Column 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 text-xl">
                <span>🌿</span>
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                Ketupat <span className="text-[var(--color-secondary)]">Cinta</span>
              </span>
            </div>
            <p className="leading-relaxed text-sm text-white/75 font-light">
              Ketupat pre-order premium dengan resep rumahan autentik turun temurun. Dibuat dengan cinta untuk menghadirkan kebahagiaan di setiap momen keluarga Anda.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Globe size={14} />
              <span>Melayani Bandung &amp; Cimahi</span>
            </div>
          </div>

          {/* Column 2: Navigasi */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              Navigasi
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/products', label: 'Produk PO' },
                { href: '/login', label: 'Masuk Akun' },
                { href: '/register', label: 'Daftar Baru' },
                { href: '/orders', label: 'Pesanan Saya' },
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 hover:text-[var(--color-secondary)] hover:translate-x-1 flex items-center gap-1 transition-all duration-300 group"
                  >
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-secondary)]" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Kontak */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              Hubungi Kami
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/6285846653147?text=Halo%20saya%20ingin%20memesan%20Ketupat%20Cinta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-[var(--color-secondary-light)] hover:scale-[1.02] active:scale-95 transition-all duration-300 origin-left"
                >
                  <MessageCircle size={18} className="text-[var(--color-secondary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white leading-tight">WhatsApp CS</p>
                    <p className="text-xs text-white/50 mt-0.5">0858-4665-3147</p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="mailto:ketupatcinta@gmail.com"
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-[var(--color-secondary-light)] hover:scale-[1.02] active:scale-95 transition-all duration-300 origin-left"
                >
                  <Mail size={18} className="text-[var(--color-secondary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white leading-tight">Email</p>
                    <p className="text-xs text-white/50 mt-0.5">ketupatcinta@gmail.com</p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/AXCM4fYdu7JBMZnq5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-[var(--color-secondary-light)] hover:scale-[1.02] active:scale-95 transition-all duration-300 origin-left"
                >
                  <MapPin size={18} className="text-[var(--color-secondary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white leading-tight">Alamat Dapur</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-normal">Cimahi, Jawa Barat</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Sosial Media */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              Sosial Media
            </h4>
            <p className="text-xs text-white/65 mb-4 leading-relaxed font-light">
              Ikuti keseruan kami dan dapatkan info promo serta jadwal pre-order terbaru melalui sosial media.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://wa.me/6285846653147?text=Halo%20saya%20ingin%20memesan%20Ketupat%20Cinta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-secondary)] hover:scale-110 active:scale-90 transition-all duration-300"
                title="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>

              <a
                href="https://tiktok.com/@ketupatcinta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-[var(--color-secondary)] hover:text-black hover:border-transparent hover:scale-110 active:scale-90 transition-all duration-300"
                title="TikTok"
              >
                <Music size={18} />
              </a>
              
              <a
                href="https://maps.app.goo.gl/AXCM4fYdu7JBMZnq5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-secondary)] hover:scale-110 active:scale-90 transition-all duration-300"
                title="Google Maps"
              >
                <MapPin size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-4 font-light">
          <p>© {new Date().getFullYear()} Ketupat Cinta. Semua Hak Dilindungi.</p>
          <p>
            Built by <span className="text-white/60 font-semibold hover:text-[var(--color-secondary)] transition-colors">Mohamad Arifin Hasbi</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

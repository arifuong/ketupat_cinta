import Link from 'next/link';
import { MessageCircle, Mail, MapPin, Music } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ backgroundColor: '#1F6F5F' }}>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧡</span>
              <span className="text-xl font-bold text-white">Ketupat Cinta</span>
            </div>
            <p className="leading-relaxed text-sm text-white/70">
              Ketupat premium buatan rumahan untuk keluarga Indonesia. Berawal dari dapur rumah, kini melayani ratusan pelanggan di Bandung &amp; Cimahi.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Menu
            </h4>
            <div className="flex flex-col gap-2">
              <Link href="/products" className="text-sm text-white/70 hover:text-white transition-colors">
                Produk
              </Link>
              <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
                Masuk
              </Link>
              <Link href="/register" className="text-sm text-white/70 hover:text-white transition-colors">
                Daftar
              </Link>
              <Link href="/orders" className="text-sm text-white/70 hover:text-white transition-colors">
                Pesanan
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Sosial Media
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://wa.me/6285846653147?text=Halo%20saya%20ingin%20memesan%20Ketupat%20Cinta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <a
                href="https://tiktok.com/@ketupatcinta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <Music size={16} />
                TikTok
              </a>
              <a
                href="mailto:ketupatcinta@gmail.com"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <Mail size={16} />
                Email
              </a>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://maps.app.goo.gl/AXCM4fYdu7JBMZnq5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <MapPin size={16} />
                Bandung &amp; Cimahi
              </a>
              <a
                href="mailto:ketupatcinta@gmail.com"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <Mail size={16} />
                ketupatcinta@gmail.com
              </a>
            </div>
          </div>
          </div>

          {/* Contact */}


        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Ketupat Cinta. Semua hak dilindungi. Dibuat dengan 🧡 di Bandung.
        </div>
      </div>
    </footer>
  );
}
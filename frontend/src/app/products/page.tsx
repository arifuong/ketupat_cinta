'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Calendar, Package, X, ZoomIn, Info, Check } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { formatImageUrl } from '@/lib/imageUtils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import StatusBadge from '@/components/StatusBadge';
import { ProductSkeleton } from '@/components/SkeletonLoader';
import type { Product, ApiResponse } from '@/types/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Lightbox Modal States
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);

  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Product[]>>('/products');
      console.log('DEBUG [Products]: API Response data:', data.data);
      if (data.data && data.data.length > 0) {
        console.log('DEBUG [Products]: First Product:', data.data[0]);
        console.log('DEBUG [Products]: Formatted Image URL:', formatImageUrl(data.data[0].image_url));
      }
      setProducts(data.data);
    } catch (err) { 
      console.error('DEBUG [Products]: Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleAddToCart() {
    if (!selectedSchedule || !selectedProduct) return;
    if (user?.role === 'admin') {
      toast.error('Admin tidak dapat berbelanja.');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(selectedProduct.id, selectedSchedule, qty);
      setShowModal(true);
      setSelectedProduct(null);
      setSelectedSchedule(null);
      setQty(1);
      setLightboxProduct(null); // Close lightbox if adding from inside it
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal menambahkan');
    } finally {
      setAddingToCart(false);
    }
  }

  // Open Lightbox
  const openLightbox = (product: Product) => {
    setLightboxProduct(product);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="section-title">Produk Kami</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">Pilih produk dan jadwal PO yang tersedia</p>
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Produk Kami</h1>
          <p className="mt-2 text-[var(--color-text-muted)] font-light">Pilih produk ketupat berkualitas tinggi dan tentukan jadwal PO Anda.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const hasAvailableStock = product.po_schedules?.some((schedule) => schedule.is_available) ?? false;
          
          return (
            <div key={product.id} className="card-product flex flex-col justify-between group">
              <div>
                {/* Product Image Click to Open Lightbox */}
                <div 
                  onClick={() => openLightbox(product)}
                  className="flex h-48 items-center justify-center rounded-xl mb-4 overflow-hidden bg-gray-50 relative cursor-zoom-in group-hover:shadow-lg transition-all"
                >
                  <img 
                    src={formatImageUrl(product.image_url)} 
                    alt={product.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-gray-900 rounded-xl px-3.5 py-2 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <ZoomIn size={14} className="text-[var(--color-primary)]" /> Lihat Detail
                    </span>
                  </div>
                  {!hasAvailableStock && (
                    <span className="absolute top-3 left-3 badge bg-red-100 text-red-700 shadow-sm border border-red-200">Stok Habis</span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 
                    onClick={() => openLightbox(product)} 
                    className="text-lg font-bold text-[var(--color-text-main)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                  >
                    {product.name}
                  </h3>
                </div>

                <p className="mt-1.5 text-xs text-[var(--color-text-muted)] line-clamp-2 font-light leading-relaxed">{product.description}</p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[var(--color-primary)]">{formatRupiah(product.price)}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">/ pcs</span>
                </div>

                <div className="mt-2.5 text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-medium bg-[var(--color-primary)]/5 px-2.5 py-1 rounded-lg w-fit">
                  <Info size={12} className="text-[var(--color-primary)]" />
                  {user?.role === 'reseller' ? (
                    <span className="text-[var(--color-primary)] font-bold">Minimal Pembelian 10 pcs</span>
                  ) : (
                    `Min. order: ${product.min_order} pcs`
                  )}
                  {user?.role === 'reseller' && product.price_reseller && (
                    <span className="ml-1 text-[var(--color-secondary)] font-bold">• Harga Reseller Aktif</span>
                  )}
                </div>

                {/* PO Schedules */}
                {product.po_schedules && product.po_schedules.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      <Calendar size={12} className="text-[var(--color-primary)]" />
                      Jadwal PO Tersedia
                    </div>
                    {product.po_schedules.slice(0, 3).map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => {
                          if (user?.role === 'admin') { toast.error('Admin tidak dapat berbelanja.'); return; }
                          if (!isAuthenticated) { toast('Silakan masuk terlebih dahulu', { icon: '🔑' }); window.location.href = '/login'; return; }
                          setSelectedProduct(product);
                          setSelectedSchedule(schedule.id);
                          setQty(user?.role === 'reseller' ? 10 : product.min_order);
                        }}
                        disabled={!schedule.is_available}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-all ${
                          selectedProduct?.id === product.id && selectedSchedule === schedule.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                            : schedule.is_available
                            ? 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-gray-50'
                            : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{schedule.schedule_date_formatted}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Kuota: {schedule.remaining_stock}</span>
                          <StatusBadge status={schedule.status} label={schedule.status_label} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to Cart Controls */}
              {selectedProduct?.id === product.id && selectedSchedule && (
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-dashed animate-scale-in">
                  <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden bg-white shrink-0">
                    <button 
                      onClick={() => setQty(Math.max(user?.role === 'reseller' ? 10 : product.min_order, qty - 1))} 
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                    >
                      −
                    </button>
                    <input 
                      type="number" 
                      value={qty} 
                      onChange={(e) => setQty(Math.max(user?.role === 'reseller' ? 10 : product.min_order, parseInt(e.target.value) || (user?.role === 'reseller' ? 10 : product.min_order)))} 
                      className="w-12 border-x text-center text-xs py-2 outline-none font-bold text-gray-900" 
                    />
                    <button 
                      onClick={() => setQty(qty + 1)} 
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCart} 
                    disabled={addingToCart} 
                    className="btn-primary flex-1 !py-2.5 text-xs shadow-md"
                  >
                    <ShoppingCart size={14} />
                    {addingToCart ? 'Memproses...' : 'Beli'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 card">
          <Package size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-[var(--color-text-muted)]">Belum ada produk tersedia.</p>
        </div>
      )}

      {/* Lightbox / Product Detail Modal */}
      <AnimatePresence>
        {lightboxProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxProduct(null)}
              className="fixed inset-0 z-[100] bg-black backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[110] w-full max-w-4xl max-h-[90vh] md:h-auto overflow-y-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:grid md:grid-cols-2 gap-8"
            >
              {/* Close Button */}
              <button 
                onClick={() => setLightboxProduct(null)} 
                className="absolute right-4 top-4 btn-ghost !p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-20 text-gray-500"
              >
                <X size={18} />
              </button>

              {/* Left Column: Product Image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-[var(--color-border)]">
                <img
                  src={formatImageUrl(lightboxProduct.image_url)}
                  alt={lightboxProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Right Column: Product Detail & Cart controls */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
                    Kategori Ketupat
                  </span>
                  <h2 className="text-2xl font-extrabold text-[var(--color-text-main)] mt-3 mb-1">
                    {lightboxProduct.name}
                  </h2>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-[var(--color-primary)]">
                      {formatRupiah(lightboxProduct.price)}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] font-medium">/ pcs</span>
                  </div>

                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-light mb-6">
                    {lightboxProduct.description || 'Tidak ada deskripsi detail produk.'}
                  </p>

                  <div className="border-t border-dashed pt-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                      <Calendar size={14} className="text-[var(--color-primary)]" />
                      Pilih Tanggal Pre-Order (PO)
                    </div>
                    
                    {lightboxProduct.po_schedules && lightboxProduct.po_schedules.length > 0 ? (
                      <div className="space-y-2">
                        {lightboxProduct.po_schedules.map((schedule) => (
                          <button
                            key={schedule.id}
                            disabled={!schedule.is_available}
                            onClick={() => {
                              if (user?.role === 'admin') { toast.error('Admin tidak dapat berbelanja.'); return; }
                              if (!isAuthenticated) { toast('Silakan masuk terlebih dahulu', { icon: '🔑' }); window.location.href = '/login'; return; }
                              setSelectedProduct(lightboxProduct);
                              setSelectedSchedule(schedule.id);
                              setQty(user?.role === 'reseller' ? 10 : lightboxProduct.min_order);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-xs transition-all ${
                              selectedProduct?.id === lightboxProduct.id && selectedSchedule === schedule.id
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                                : schedule.is_available
                                ? 'border-[var(--color-border)] hover:border-gray-400 bg-white'
                                : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <span className="font-semibold text-gray-900">{schedule.schedule_date_formatted}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-medium">Kuota Sisa: {schedule.remaining_stock}</span>
                              <StatusBadge status={schedule.status} label={schedule.status_label} />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-text-muted)] italic">Belum ada jadwal PO tersedia.</p>
                    )}
                  </div>
                </div>

                {/* Add to cart panel */}
                {selectedProduct?.id === lightboxProduct.id && selectedSchedule && (
                  <div className="bg-[var(--color-bg)]/50 rounded-2xl p-4 border border-[var(--color-border)] animate-scale-in">
                    <div className="flex items-center justify-between mb-3 text-xs text-[var(--color-text-muted)] font-medium">
                      <span>Kuantitas Pembelian:</span>
                      <span>Min. {user?.role === 'reseller' ? 10 : lightboxProduct.min_order} pcs</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden bg-white shrink-0">
                        <button 
                          onClick={() => setQty(Math.max(user?.role === 'reseller' ? 10 : lightboxProduct.min_order, qty - 1))} 
                          className="px-3.5 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          value={qty} 
                          onChange={(e) => setQty(Math.max(user?.role === 'reseller' ? 10 : lightboxProduct.min_order, parseInt(e.target.value) || (user?.role === 'reseller' ? 10 : lightboxProduct.min_order)))} 
                          className="w-14 border-x text-center text-xs py-2 outline-none font-bold text-gray-900" 
                        />
                        <button 
                          onClick={() => setQty(qty + 1)} 
                          className="px-3.5 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={handleAddToCart} 
                        disabled={addingToCart} 
                        className="btn-primary flex-1 !py-3 shadow-lg text-sm"
                      >
                        <ShoppingCart size={16} />
                        {addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-[120] bg-black backdrop-blur-sm"
            />
            {/* Success Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] card w-full max-w-sm text-center bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-[var(--color-border)]"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-md">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Berhasil Ditambahkan!</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-light leading-relaxed mb-6">
                Produk telah dimasukkan ke keranjang belanja Anda. Silakan lanjut berbelanja atau langsung lakukan checkout.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary w-full text-xs">Lanjut Belanja</button>
                <Link href="/cart" className="btn-primary w-full text-xs">Lihat Keranjang Belanja</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

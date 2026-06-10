'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, Calendar, Package } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { formatImageUrl } from '@/lib/imageUtils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Product, ApiResponse } from '@/types/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');

  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Product[]>>('/products');
      setProducts(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleAddToCart() {
    if (!selectedSchedule || !selectedProduct) return;
    if (user?.role === 'admin') {
      setMessage('Admin tidak dapat berbelanja.');
      return;
    }
    setAddingToCart(true);
    setMessage('');
    try {
      await addItem(selectedProduct.id, selectedSchedule, qty);
      setMessage('✅ Ditambahkan ke keranjang!');
      setSelectedProduct(null);
      setSelectedSchedule(null);
      setQty(1);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage('Gagal menambahkan: ' + (axiosErr.response?.data?.message || 'Gagal menambahkan'));
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="section-title">Produk Kami</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">Pilih produk dan jadwal PO yang tersedia</p>
      </div>

      {message && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const hasAvailableStock = product.po_schedules?.some((schedule) => schedule.is_available) ?? false;

          return (
          <div key={product.id} className="card-product">
            {/* Product Image */}
            <div className="flex h-48 items-center justify-center rounded-xl mb-4 overflow-hidden bg-gray-100">
              <img src={formatImageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <h3 className="text-lg font-bold">{product.name}</h3>
            {!hasAvailableStock && (
              <span className="badge mt-2 bg-red-100 text-red-700">Stok Habis</span>
            )}
            <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{product.description}</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold gradient-text">{formatRupiah(product.price)}</span>
              <span className="text-xs text-[var(--color-text-muted)]">/ pcs</span>
            </div>

            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              Min. order: {product.min_order} pcs
              {user?.role === 'reseller' && product.price_reseller && (
                <span className="ml-2 text-[var(--color-secondary)] font-medium">• Harga Reseller</span>
              )}
            </div>

            {/* PO Schedules */}
            {product.po_schedules && product.po_schedules.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <Calendar size={12} />
                  Jadwal PO
                </div>
                {product.po_schedules.slice(0, 3).map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => {
                      if (user?.role === 'admin') { setMessage('Admin tidak dapat berbelanja.'); return; }
                      if (!isAuthenticated) { window.location.href = '/login'; return; }
                      setSelectedProduct(product);
                      setSelectedSchedule(schedule.id);
                      setQty(product.min_order);
                    }}
                    disabled={!schedule.is_available}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all ${
                      selectedProduct?.id === product.id && selectedSchedule === schedule.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : schedule.is_available
                        ? 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-medium">{schedule.schedule_date_formatted}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-muted)]">Sisa: {schedule.remaining_stock || 0}</span>
                      <StatusBadge status={schedule.status} label={schedule.status_label} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Add to Cart */}
            {selectedProduct?.id === product.id && selectedSchedule && (
              <div className="mt-4 flex items-center gap-2 animate-scale-in">
                <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <button onClick={() => setQty(Math.max(product.min_order, qty - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">−</button>
                  <input type="number" value={qty} onChange={(e) => setQty(Math.max(product.min_order, parseInt(e.target.value) || product.min_order))} className="w-16 border-x text-center text-sm py-2 outline-none" />
                  <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100 transition-colors">+</button>
                </div>
                <button onClick={handleAddToCart} disabled={addingToCart} className="btn-primary flex-1 !py-2.5 text-sm">
                  <ShoppingCart size={16} />
                  {addingToCart ? 'Menambahkan...' : 'Keranjang'}
                </button>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-[var(--color-text-muted)]">Belum ada produk tersedia.</p>
        </div>
      )}
    </div>
  );
}

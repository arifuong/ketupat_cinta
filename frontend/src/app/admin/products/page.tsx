'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Edit3, Package, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Product, PoSchedule, ApiResponse } from '@/types/api';
import toast from 'react-hot-toast';

type ProductForm = {
  name: string;
  description?: string;
  image?: FileList;
  price_normal: string;
  price_reseller: string;
  min_order_customer: string;
  min_order_reseller: string;
  stock_po_default: string;
};

type ScheduleForm = {
  product_id: string;
  schedule_date: string;
  allocated_stock: string;
  remaining_stock?: string;
  status?: 'open' | 'closed' | 'full';
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'schedule'; id: number; has_transactions?: boolean } | null>(null);

  const productForm = useForm<ProductForm>();
  const scheduleForm = useForm<ScheduleForm>();

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Product[]>>(`/admin/products?t=${Date.now()}`);
      setProducts(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(err: unknown) {
    const axiosErr = err as ApiError;
    const validationErrors = axiosErr.response?.data?.errors;
    if (validationErrors) return Object.values(validationErrors).flat().join('. ');
    return axiosErr.response?.data?.message || 'Gagal';
  }

  function buildProductFormData(values: ProductForm) {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('price_normal', values.price_normal);
    formData.append('price_reseller', values.price_reseller);
    formData.append('min_order_customer', values.min_order_customer);
    formData.append('min_order_reseller', values.min_order_reseller);
    formData.append('stock_po_default', values.stock_po_default);
    if (values.image?.[0]) formData.append('image', values.image[0]);
    return formData;
  }

  async function onProductSubmit(values: ProductForm) {
    try {
      const formData = buildProductFormData(values);
      if (editingProduct) {
        formData.append('_method', 'PUT');
        await api.post(`/admin/products/${editingProduct.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Produk berhasil diperbarui');
      } else {
        await api.post('/admin/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage('Produk berhasil dibuat');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      productForm.reset();
      fetchProducts();
    } catch (err: unknown) {
      setMessage(getErrorMessage(err));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function onScheduleSubmit(values: ScheduleForm) {
    try {
      const productId = Number(values.product_id);
      const prevProduct = products.find(p => p.id === productId);
      const wasInactive = prevProduct?.status === 'inactive';

      if (editingScheduleId) {
        await api.put(`/admin/po-schedules/${editingScheduleId}`, values);
        setMessage('Jadwal PO berhasil diperbarui');
      } else {
        await api.post('/admin/po-schedules', values);
        setMessage('Jadwal PO berhasil dibuat');
      }
      setShowScheduleForm(false);
      setEditingScheduleId(null);
      scheduleForm.reset();
      
      const { data } = await api.get<ApiResponse<Product[]>>(`/admin/products?t=${Date.now()}`);
      setProducts(data.data);

      const updatedProduct = data.data.find(p => p.id === productId);
      if (wasInactive && updatedProduct?.status === 'active') {
        toast.success('Produk berhasil diaktifkan kembali.');
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  function startCreateProduct() {
    setEditingProduct(null);
    productForm.reset();
    setShowProductForm(true);
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || '',
      price_normal: String(product.price_normal),
      price_reseller: String(product.price_reseller || ''),
      min_order_customer: String(product.min_order_customer),
      min_order_reseller: String(product.min_order_reseller || ''),
      stock_po_default: String(product.stock_po_default || 0),
    });
    setShowProductForm(true);
  }

  function startCreateSchedule() {
    setEditingScheduleId(null);
    scheduleForm.reset();
    setShowScheduleForm(true);
  }

  function startEditSchedule(schedule: PoSchedule) {
    setEditingScheduleId(schedule.id);
    scheduleForm.reset({
      product_id: String(schedule.product_id),
      schedule_date: schedule.schedule_date,
      allocated_stock: String(schedule.allocated_stock),
      remaining_stock: String(schedule.remaining_stock),
      status: schedule.status,
    });
    setShowScheduleForm(true);
  }

  function triggerDeleteProduct(product: Product) {
    setDeleteTarget({ type: 'product', id: product.id, has_transactions: product.has_transactions });
  }

  function triggerDeleteSchedule(id: number) {
    setDeleteTarget({ type: 'schedule', id });
  }

  async function handleRestoreProduct(id: number) {
    const t = toast.loading('Mengaktifkan kembali...');
    try {
      const { data } = await api.post<{ success: boolean; message: string }>(`/admin/products/${id}/restore`);
      toast.success(data.message || 'Produk berhasil diaktifkan kembali', { id: t });
      fetchProducts();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: t });
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    const t = toast.loading('Menghapus...');
    try {
      if (type === 'product') {
        const { data } = await api.delete<{ success: boolean; message: string }>(`/admin/products/${id}`);
        toast.success(data.message || 'Produk berhasil dihapus', { id: t });
      } else {
        await api.delete(`/admin/po-schedules/${id}`);
        toast.success('Jadwal PO berhasil dihapus', { id: t });
      }
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err), { id: t });
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Produk & Jadwal PO</h1>
        <div className="flex gap-2">
          <button onClick={startCreateProduct} className="btn-primary text-sm !py-2"><Plus size={16} />Produk</button>
          <button onClick={startCreateSchedule} className="btn-secondary text-sm !py-2"><Calendar size={16} />Jadwal PO</button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium animate-scale-in">
          {message}
        </div>
      )}

      {showProductForm && (
        <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="card mb-6 animate-scale-in">
          <h3 className="mb-4 flex items-center gap-2 font-bold"><Package size={18} />{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Nama Produk *</label><input {...productForm.register('name', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Deskripsi</label><input {...productForm.register('description')} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Harga Normal *</label><input type="number" {...productForm.register('price_normal', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Harga Reseller *</label><input type="number" {...productForm.register('price_reseller', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">MOQ Customer *</label><input type="number" {...productForm.register('min_order_customer', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">MOQ Reseller *</label><input type="number" {...productForm.register('min_order_reseller', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Default Stock PO *</label><input type="number" {...productForm.register('stock_po_default', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Gambar Produk</label><input type="file" accept="image/*" {...productForm.register('image')} className="input-field" /></div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary text-sm">Simpan</button>
            <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); productForm.reset(); }} className="btn-ghost text-sm">Batal</button>
          </div>
        </form>
      )}

      {showScheduleForm && (
        <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="card mb-6 animate-scale-in">
          <h3 className="mb-4 flex items-center gap-2 font-bold"><Calendar size={18} />{editingScheduleId ? 'Edit Jadwal PO' : 'Tambah Jadwal PO'}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Produk *</label>
              <select {...scheduleForm.register('product_id', { required: true })} className="input-field">
                <option value="">Pilih Produk</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium">Tanggal PO *</label><input type="date" {...scheduleForm.register('schedule_date', { required: true })} className="input-field" /></div>
            <div><label className="mb-1 block text-sm font-medium">Alokasi Stok *</label><input type="number" {...scheduleForm.register('allocated_stock', { required: true })} className="input-field" /></div>
            {editingScheduleId && (
              <>
                <div><label className="mb-1 block text-sm font-medium">Sisa Stok</label><input type="number" {...scheduleForm.register('remaining_stock')} className="input-field" /></div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select {...scheduleForm.register('status')} className="input-field">
                    <option value="open">Buka</option>
                    <option value="closed">Ditutup</option>
                    <option value="full">Kuota PO Penuh</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary text-sm">Simpan</button>
            <button type="button" onClick={() => { setShowScheduleForm(false); setEditingScheduleId(null); scheduleForm.reset(); }} className="btn-ghost text-sm">Batal</button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold">Daftar Produk</h2>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-10 text-center text-[var(--color-text-muted)]">Belum ada produk tersedia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-5 py-3">Harga</th>
                  <th className="px-5 py-3">MOQ</th>
                  <th className="px-5 py-3">Jadwal PO</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const hasSchedules = product.po_schedules && product.po_schedules.length > 0;
                  const isInactive = product.status === 'inactive';

                  let statusBadge = null;
                  if (isInactive) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        ⚫ Produk Nonaktif
                      </span>
                    );
                  } else {
                    const allFull = hasSchedules && product.po_schedules!.every(s => s.status === 'full' || s.remaining_stock === 0);
                    const stockOut = !hasSchedules || product.po_schedules!.every(s => s.remaining_stock === 0);

                    if (allFull) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          🔴 Kuota PO Penuh
                        </span>
                      );
                    } else if (stockOut) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          🔴 Produk Habis
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          🟢 Aktif
                        </span>
                      );
                    }
                  }

                  return (
                    <tr key={product.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{product.name}</span>
                          {statusBadge}
                        </div>
                        <p className="max-w-sm text-xs text-[var(--color-text-muted)]">{product.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p>{formatRupiah(product.price_normal)}</p>
                        <p className="text-xs text-[var(--color-secondary)]">{formatRupiah(product.price_reseller || '0')}</p>
                      </td>
                      <td className="px-5 py-4">{product.min_order_customer}/{product.min_order_reseller}</td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {product.po_schedules?.length ? product.po_schedules.map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                              <div>
                                <p className="font-medium">{schedule.schedule_date_formatted}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">{schedule.remaining_stock}/{schedule.allocated_stock}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={schedule.status} label={schedule.status_label} />
                                <button onClick={() => startEditSchedule(schedule)} className="btn-ghost !p-1.5"><Edit3 size={14} /></button>
                                <button onClick={() => triggerDeleteSchedule(schedule.id)} className="btn-ghost !p-1.5 text-red-500"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          )) : <span className="text-xs text-[var(--color-text-muted)]">Belum ada jadwal</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-2">
                          {product.status === 'inactive' && (
                            <button
                              onClick={() => handleRestoreProduct(product.id)}
                              className="btn-primary text-xs !px-3 !py-2 !bg-[var(--color-success)] hover:!bg-[var(--color-success)]/90"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                          <button onClick={() => startEditProduct(product)} className="btn-secondary text-xs !px-3 !py-2"><Edit3 size={14} />Edit</button>
                          <button onClick={() => triggerDeleteProduct(product)} className="btn-ghost text-xs !px-3 !py-2 text-red-500"><Trash2 size={14} />Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 bg-white rounded-2xl shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold mb-2 text-gray-950">
              {deleteTarget.type === 'product' ? 'Hapus Produk' : 'Hapus Jadwal PO'}
            </h3>
            <div className="text-sm text-[var(--color-text-muted)] mb-6 space-y-2">
              {deleteTarget.type === 'product' ? (
                deleteTarget.has_transactions ? (
                  <>
                    <p>Apakah Anda yakin ingin menghapus produk ini?</p>
                    <p className="font-semibold text-amber-600">
                      Produk memiliki riwayat transaksi. Produk tidak akan dihapus permanen tetapi akan dinonaktifkan agar histori transaksi tetap aman.
                    </p>
                  </>
                ) : (
                  <p>Apakah Anda yakin ingin menghapus produk ini? Produk akan dihapus permanen.</p>
                )
              ) : (
                <p>Apakah Anda yakin ingin menghapus jadwal PO ini? Tindakan ini tidak dapat dibatalkan.</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-sm !py-2 !px-4"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="btn-primary text-sm !py-2 !px-4 !bg-[var(--color-error)]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

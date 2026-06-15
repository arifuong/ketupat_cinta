'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { MapPin, Truck, CreditCard, FileText, CheckCircle2, X } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, normalizeWhatsApp } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { UserAddress, ApiResponse, CheckoutForm, AddressForm } from '@/types/api';

const shippingMethods = [
  { value: 'gosend_customer', label: 'GoSend (Customer Driver)', desc: 'Driver GoSend yang Anda pesan sendiri' },
  { value: 'gosend_toko', label: 'GoSend (Toko Driver)', desc: 'Driver GoSend dipesan oleh toko' },
  { value: 'kurir_internal', label: 'Kurir Internal', desc: 'Kurir toko langsung ke alamat Anda' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { items, getTotal, fetchItems } = useCartStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Address Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [modalError, setModalError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CheckoutForm>();
  
  const addressForm = useForm<AddressForm>({
    defaultValues: {
      province: 'Jawa Barat',
    }
  });

  const isTrustedReseller = user?.role === 'reseller' && user?.is_trusted;
  const isReseller = user?.role === 'reseller';

  const paymentMethods = useMemo(() => {
    const methods: { value: string; label: string; desc: string }[] = [];

    if (isReseller) {
      methods.push({ value: 'transfer_manual', label: 'Transfer Manual', desc: 'Upload bukti transfer bank' });
    }

    methods.push({ value: 'midtrans', label: 'Pembayaran Online', desc: 'Via Midtrans (QRIS, VA, dll)' });

    if (isTrustedReseller) {
      methods.push({ value: 'tempo', label: 'Bayar Tempo (Reseller)', desc: 'Bayar setelah pesanan selesai. Khusus reseller terpercaya.' });
    }

    return methods;
  }, [isReseller, isTrustedReseller]);

  const selectedAddressId = watch('address_id');
  const activeAddress = useMemo(() => {
    if (addresses.length === 0) return null;
    const found = addresses.find(a => Number(a.id) === Number(selectedAddressId));
    if (found) return found;
    const def = addresses.find(a => a.is_default);
    return def || addresses[0];
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role === 'admin') { router.push('/admin'); return; }
    loadData();
  }, [isHydrated, isAuthenticated, user?.role]);

  useEffect(() => {
    if (activeAddress && Number(selectedAddressId) !== Number(activeAddress.id)) {
      setValue('address_id', activeAddress.id);
    }
  }, [activeAddress, selectedAddressId, setValue]);

  async function loadData() {
    try {
      await fetchItems();
      const { data } = await api.get<ApiResponse<UserAddress[]>>('/user/addresses');
      setAddresses(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function onSubmit(formData: CheckoutForm) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/orders', formData);
      router.push(`/orders/${data.data.id}?success=true`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const validationErrors = axiosErr.response?.data?.errors;
      if (validationErrors) {
        setError(Object.values(validationErrors).flat().join('. '));
      } else {
        setError(axiosErr.response?.data?.message || 'Checkout gagal.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onAddressSubmit(formData: AddressForm) {
    setModalError('');
    try {
      const cleanedData = {
        ...formData,
        recipient_phone: formData.recipient_phone?.replace(/[^0-9]/g, ''),
      };
      let savedAddress: UserAddress;

      if (modalMode === 'edit' && editingAddressId) {
        const { data } = await api.put<ApiResponse<UserAddress>>(`/user/addresses/${editingAddressId}`, cleanedData);
        savedAddress = data.data;
      } else {
        const { data } = await api.post<ApiResponse<UserAddress>>('/user/addresses', cleanedData);
        savedAddress = data.data;
      }

      // Refresh addresses
      const { data: addrRes } = await api.get<ApiResponse<UserAddress[]>>('/user/addresses');
      setAddresses(addrRes.data);

      // Set as active address
      setValue('address_id', savedAddress.id);

      // Close modal and reset
      setIsAddressModalOpen(false);
      setModalMode('list');
      setEditingAddressId(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setModalError(axiosErr.response?.data?.message || 'Gagal menyimpan alamat.');
    }
  }

  function handleCancelAddressForm() {
    setModalError('');
    if (addresses.length === 0) {
      setIsAddressModalOpen(false);
    } else {
      setModalMode('list');
    }
    setEditingAddressId(null);
  }

  if (!isHydrated || loading) return <LoadingSpinner size="lg" />;

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <MapPin size={20} className="text-[var(--color-primary)]" />
                  Alamat Pengiriman
                </h3>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('list');
                      setIsAddressModalOpen(true);
                    }}
                    className="btn-secondary text-xs !py-1.5 !px-3 font-semibold"
                  >
                    Ubah Alamat
                  </button>
                )}
              </div>

              {!activeAddress ? (
                <div className="text-center py-8 border border-dashed border-[var(--color-border)] rounded-2xl">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">Belum ada alamat pengiriman.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('add');
                      setIsAddressModalOpen(true);
                      addressForm.reset({
                        label: '',
                        detail: '',
                        city: undefined,
                        district: '',
                        map_link: '',
                        is_default: false,
                        recipient_name: user?.name || '',
                        recipient_phone: user?.wa_number || '',
                        province: 'Jawa Barat',
                        postal_code: '',
                        notes: '',
                      });
                    }}
                    className="btn-primary text-xs !py-2.5 !px-4"
                  >
                    Tambah Alamat Baru
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-[var(--color-border)] space-y-2 text-sm text-gray-800">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 font-bold text-base">
                      {activeAddress.recipient_name || user?.name || '-'}
                    </strong>
                    {activeAddress.label && (
                      <span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)] !text-[10px] font-bold">
                        {activeAddress.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 font-medium">
                    📱 {activeAddress.recipient_phone || user?.wa_number || '-'}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700 font-medium">
                    {activeAddress.detail}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">
                    {activeAddress.district ? `${activeAddress.district}, ` : ''}
                    {activeAddress.city === 'bandung' ? 'Bandung' : 'Cimahi'},{' '}
                    {activeAddress.province || 'Jawa Barat'}
                    {activeAddress.postal_code ? `, ${activeAddress.postal_code}` : ''}
                  </p>
                  {activeAddress.notes && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mt-2 border border-amber-100/50 font-medium">
                      📌 <strong>Catatan:</strong> {activeAddress.notes}
                    </p>
                  )}
                </div>
              )}
              <input type="hidden" {...register('address_id', { required: 'Alamat pengiriman wajib diisi' })} value={activeAddress?.id || ''} />
              {errors.address_id && <p className="mt-2 text-xs text-red-500">{errors.address_id.message}</p>}
            </div>

            {/* Shipping */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Truck size={20} className="text-[var(--color-secondary)]" />
                Metode Pengiriman
              </h3>
              <div className="space-y-2">
                {shippingMethods.map((method) => (
                  <label key={method.value} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${watch('shipping_method') === method.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}>
                    <input type="radio" value={method.value} {...register('shipping_method', { required: 'Pilih metode pengiriman' })} className="mt-1 accent-[var(--color-primary)]" />
                    <div>
                      <span className="text-sm font-semibold">{method.label}</span>
                      <p className="text-xs text-[var(--color-text-muted)]">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.shipping_method && <p className="mt-2 text-xs text-red-500">{errors.shipping_method.message}</p>}
            </div>

            {/* Payment */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <CreditCard size={20} className="text-[var(--color-accent)]" />
                Metode Pembayaran
              </h3>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.value}>
                    <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                      watch('payment_type') === method.value
                        ? method.value === 'tempo'
                          ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                          : 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                    }`}>
                      <input type="radio" value={method.value} {...register('payment_type', { required: 'Pilih pembayaran' })} className={`mt-1 ${method.value === 'tempo' ? 'accent-[var(--color-secondary)]' : 'accent-[var(--color-primary)]'}`} />
                      <div>
                        <span className={`text-sm font-semibold ${method.value === 'tempo' ? 'text-[var(--color-secondary)]' : ''}`}>
                          {method.value === 'tempo' ? '💎 ' : ''}{method.label}
                        </span>
                        <p className="text-xs text-[var(--color-text-muted)]">{method.desc}</p>
                      </div>
                    </label>
                    
                    {method.value === 'tempo' && watch('payment_type') === 'tempo' && (
                      <div className="mt-2 ml-7 p-4 bg-white border border-[var(--color-secondary)] rounded-xl animate-scale-in">
                        <label className="block text-xs font-bold text-[var(--color-secondary)] mb-2 uppercase tracking-wider">Pilih Jumlah Cicilan</label>
                        <select 
                          {...register('installment_count', { required: watch('payment_type') === 'tempo' })}
                          className="w-full rounded-lg border border-[var(--color-secondary)]/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-secondary)]"
                        >
                          <option value="1">1x (Bayar Langsung)</option>
                          <option value="3">3x Cicilan</option>
                          <option value="5">5x Cicilan</option>
                          <option value="7">7x Cicilan (Maksimal)</option>
                        </select>
                        <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">Cicilan akan ditagih secara bertahap setelah pesanan dikonfirmasi.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.payment_type && <p className="mt-2 text-xs text-red-500">{errors.payment_type.message}</p>}
            </div>

            {/* Notes */}
            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <FileText size={20} className="text-[var(--color-text-muted)]" />
                Catatan
              </h3>
              <textarea {...register('notes')} rows={3} placeholder="Catatan untuk pesanan (opsional)" className="input-field resize-none" />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h3 className="text-lg font-bold mb-4">Ringkasan Pesanan</h3>
              <div className="space-y-3 border-b pb-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">{item.product?.name} × {item.qty}</span>
                    <span className="font-medium">{formatRupiah(parseFloat(item.unit_price || item.product?.price || '0') * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Subtotal</span>
                <span className="font-medium">{formatRupiah(getTotal())}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-[var(--color-text-muted)]">Ongkir</span>
                <span className="text-xs text-[var(--color-text-muted)]">Dihitung saat proses</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-bold">Estimasi Total</span>
                <span className="text-xl font-bold gradient-text">{formatRupiah(getTotal())}</span>
              </div>

              <button type="submit" disabled={submitting || !activeAddress} className="btn-primary w-full mt-6 !py-3.5 disabled:opacity-50">
                {submitting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <CheckCircle2 size={18} />
                    Buat Pesanan
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Address Selection/Management Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl relative animate-scale-in">
            {/* Close button */}
            <button 
              type="button"
              onClick={() => {
                setIsAddressModalOpen(false);
                setModalMode('list');
                setEditingAddressId(null);
              }}
              className="absolute right-4 top-4 btn-ghost !p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500"
            >
              <X size={18} />
            </button>

            {modalMode === 'list' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-950">Pilih Alamat Pengiriman</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Pilih alamat aktif untuk pengiriman pesanan Anda</p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {addresses.map((addr) => {
                    const isActive = Number(selectedAddressId) === Number(addr.id);
                    return (
                      <div 
                        key={addr.id} 
                        className={`flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                          isActive 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                        }`}
                        onClick={() => {
                          setValue('address_id', addr.id);
                          setIsAddressModalOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <input 
                            type="radio" 
                            name="modal_address_id"
                            checked={isActive}
                            readOnly
                            className="mt-1 accent-[var(--color-primary)]" 
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-sm text-gray-900 font-bold">
                                {addr.recipient_name || user?.name || '-'}
                              </strong>
                              {addr.label && (
                                <span className="badge bg-gray-100 text-gray-700 !text-[10px] font-bold">
                                  {addr.label}
                                </span>
                              )}
                              {addr.is_default && (
                                <span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)] !text-[10px] font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">📱 {addr.recipient_phone || user?.wa_number}</p>
                            <p className="text-xs text-gray-700 mt-1 leading-relaxed">{addr.detail}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)]">
                              {addr.district ? `${addr.district}, ` : ''}
                              {addr.city === 'bandung' ? 'Bandung' : 'Cimahi'}
                              {addr.province ? `, ${addr.province}` : ''}
                              {addr.postal_code ? ` ${addr.postal_code}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddressId(addr.id);
                            setModalMode('edit');
                            addressForm.reset({
                              label: addr.label,
                              detail: addr.detail,
                              city: addr.city,
                              district: addr.district || '',
                              map_link: addr.map_link || '',
                              is_default: addr.is_default,
                              recipient_name: addr.recipient_name || user?.name || '',
                              recipient_phone: addr.recipient_phone || user?.wa_number || '',
                              province: addr.province || 'Jawa Barat',
                              postal_code: addr.postal_code || '',
                              notes: addr.notes || '',
                            });
                          }}
                          className="btn-ghost !p-2 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl"
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('add');
                      addressForm.reset({
                        label: '',
                        detail: '',
                        city: undefined,
                        district: '',
                        map_link: '',
                        is_default: false,
                        recipient_name: user?.name || '',
                        recipient_phone: user?.wa_number || '',
                        province: 'Jawa Barat',
                        postal_code: '',
                        notes: '',
                      });
                    }}
                    className="btn-primary text-xs !py-3 w-full"
                  >
                    + Tambah Alamat Baru
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-950">{modalMode === 'edit' ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Lengkapi informasi pengiriman di bawah ini</p>
                </div>

                {modalError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">{modalError}</div>
                )}

                <div className="grid gap-4 md:grid-cols-2 max-h-[50vh] overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Nama Penerima *</label>
                    <input {...addressForm.register('recipient_name', { required: 'Nama penerima wajib diisi' })} placeholder="Nama Lengkap Penerima" className="input-field !py-2.5" />
                    {addressForm.formState.errors.recipient_name && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.recipient_name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Nomor WhatsApp *</label>
                    <input 
                      {...addressForm.register('recipient_phone', { 
                        required: 'Nomor WhatsApp wajib diisi',
                        onChange: (e) => {
                          e.target.value = normalizeWhatsApp(e.target.value);
                        },
                        validate: (value) => {
                          if (!value.startsWith('08')) {
                            return 'Nomor WhatsApp harus diawali dengan 08.';
                          }
                          if (value.length < 10 || value.length > 15) {
                            return 'Nomor WhatsApp harus terdiri dari 10 sampai 15 digit.';
                          }
                          return true;
                        }
                      })} 
                      placeholder="Contoh: 081234567890" 
                      className="input-field !py-2.5" 
                    />
                    {addressForm.formState.errors.recipient_phone && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.recipient_phone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Label Alamat (Rumah/Kantor)</label>
                    <input {...addressForm.register('label')} placeholder="Rumah, Kantor, dll" className="input-field !py-2.5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Kota/Kabupaten *</label>
                    <select {...addressForm.register('city', { required: 'Pilih kota' })} className="input-field !py-2.5">
                      <option value="">Pilih Kota/Kabupaten</option>
                      <option value="bandung">Bandung</option>
                      <option value="cimahi">Cimahi</option>
                    </select>
                    {addressForm.formState.errors.city && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Kecamatan *</label>
                    <input {...addressForm.register('district', { required: 'Kecamatan wajib diisi' })} placeholder="Kecamatan..." className="input-field !py-2.5" />
                    {addressForm.formState.errors.district && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.district.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Provinsi *</label>
                    <input {...addressForm.register('province', { required: 'Provinsi wajib diisi' })} placeholder="Provinsi..." className="input-field !py-2.5" />
                    {addressForm.formState.errors.province && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.province.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Kode Pos</label>
                    <input {...addressForm.register('postal_code')} placeholder="Kode Pos..." className="input-field !py-2.5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Link Google Maps *</label>
                    <input 
                      {...addressForm.register('map_link', { 
                        required: 'Link Google Maps wajib diisi',
                        validate: (value) => {
                          const pattern = /(google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
                          if (!value) return 'Link Google Maps wajib diisi';
                          try {
                            new URL(value);
                          } catch {
                            return 'Format URL tidak valid';
                          }
                          return pattern.test(value) || 'Link Google Maps harus berupa URL Google Maps yang valid.';
                        }
                      })} 
                      placeholder="https://maps.google.com/..." 
                      className="input-field !py-2.5" 
                    />
                    {addressForm.formState.errors.map_link && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.map_link.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Detail Alamat *</label>
                    <textarea {...addressForm.register('detail', { required: 'Alamat wajib diisi' })} rows={2} className="input-field resize-none !py-2.5" placeholder="Nama jalan, nomor rumah, RT/RW..." />
                    {addressForm.formState.errors.detail && <p className="text-[10px] text-red-500 mt-1">{addressForm.formState.errors.detail.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-900 block mb-1 uppercase tracking-wider">Catatan Alamat (Opsional)</label>
                    <input {...addressForm.register('notes')} placeholder="Patokan, warna pagar, dekat masjid, dll" className="input-field !py-2.5" />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2 py-1">
                    <input type="checkbox" {...addressForm.register('is_default')} className="accent-[var(--color-primary)]" id="modal_is_default" />
                    <label htmlFor="modal_is_default" className="text-sm text-gray-700">Jadikan alamat utama</label>
                  </div>
                </div>

                <div className="flex gap-3 border-t pt-4">
                  <button
                    type="submit"
                    className="btn-primary text-xs !py-3 flex-1"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAddressForm}
                    className="btn-secondary text-xs !py-3"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

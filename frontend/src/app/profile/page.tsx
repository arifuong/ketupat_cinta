'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { User, MapPin, Plus, Trash2, Star, Camera, Shield, Clock, CheckCircle, Lock, Phone, Edit3 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { UserAddress, ApiResponse, AddressForm, ResellerApplication } from '@/types/api';

interface ProfileFormData {
  name: string;
  wa_number: string;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface ResellerFormData {
  business_name: string;
  business_description: string;
  motivation: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, setUser } = useAuthStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [showResellerForm, setShowResellerForm] = useState(false);
  const [resellerApp, setResellerApp] = useState<ResellerApplication | null>(null);
  const [uploading, setUploading] = useState(false);

  const addressForm = useForm<AddressForm>();
  const profileForm = useForm<ProfileFormData>();
  const passwordForm = useForm<PasswordFormData>();
  const resellerForm = useForm<ResellerFormData>();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isHydrated, isAuthenticated]);

  async function fetchData() {
    try {
      const [addrRes] = await Promise.all([
        api.get<ApiResponse<UserAddress[]>>('/user/addresses'),
      ]);
      setAddresses(addrRes.data.data);

      if (user?.role === 'customer') {
        try {
          const { data } = await api.get<ApiResponse<ResellerApplication>>('/reseller-application/my');
          setResellerApp(data.data);
        } catch {}
      }
    } catch { } finally {
      setLoading(false);
    }
  }

  async function onProfileSubmit(formData: ProfileFormData) {
    try {
      const { data } = await api.put<ApiResponse<typeof user>>('/user/profile', formData);
      if (data.data) setUser(data.data);
      setMessage('✅ Profil diperbarui');
      setShowProfileEdit(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage('❌ ' + (axiosErr.response?.data?.message || 'Gagal memperbarui profil'));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function onPasswordSubmit(formData: PasswordFormData) {
    try {
      await api.put('/user/password', formData);
      setMessage('✅ Password diperbarui');
      setShowPasswordEdit(false);
      passwordForm.reset();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage('❌ ' + (axiosErr.response?.data?.message || 'Gagal memperbarui password'));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post<ApiResponse<{ avatar_url: string }>>('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser({ ...user!, avatar_url: data.data.avatar_url });
      setMessage('✅ Avatar diperbarui');
    } catch {
      setMessage('❌ Gagal upload avatar');
    } finally {
      setUploading(false);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function onResellerSubmit(formData: ResellerFormData) {
    try {
      const { data } = await api.post<ApiResponse<ResellerApplication>>('/reseller-application', formData);
      setResellerApp(data.data);
      setShowResellerForm(false);
      resellerForm.reset();
      setMessage('✅ Pengajuan reseller berhasil dikirim');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage('❌ ' + (axiosErr.response?.data?.message || 'Gagal mengirim pengajuan'));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function onAddressSubmit(formData: AddressForm) {
    try {
      if (editingId) {
        await api.put(`/user/addresses/${editingId}`, formData);
        setMessage('✅ Alamat diperbarui');
      } else {
        await api.post('/user/addresses', formData);
        setMessage('✅ Alamat ditambahkan');
      }
      addressForm.reset();
      setShowAddressForm(false);
      setEditingId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage('❌ ' + (axiosErr.response?.data?.message || 'Gagal menyimpan'));
    }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleDeleteAddress(id: number) {
    if (!confirm('Hapus alamat ini?')) return;
    try {
      await api.delete(`/user/addresses/${id}`);
      fetchData();
      setMessage('✅ Alamat dihapus');
    } catch { }
    setTimeout(() => setMessage(''), 3000);
  }

  function startEditAddress(addr: UserAddress) {
    setEditingId(addr.id);
    setShowAddressForm(true);
    addressForm.reset({ label: addr.label, detail: addr.detail, city: addr.city, district: addr.district || '', map_link: addr.map_link || '', is_default: addr.is_default });
  }

  if (!isHydrated || loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {message && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* ═══ Profile Card ═══ */}
      <div className="card mb-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #2FA084, #1F6F5F)' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md border border-[var(--color-border)] hover:shadow-lg transition-shadow">
              <Camera size={14} className="text-[var(--color-text-muted)]" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold">{user?.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1 justify-center sm:justify-start mt-1">
              <Phone size={14} /> {user?.wa_number}
            </p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{user?.role_label}</span>
              {user?.is_trusted && <span className="badge bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">💎 Terpercaya</span>}
              {user?.role === 'reseller' && (
                <span className="badge bg-green-100 text-green-700">
                  <Shield size={12} /> Reseller Aktif
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-4 justify-center sm:justify-start">
              <button onClick={() => { setShowProfileEdit(!showProfileEdit); profileForm.reset({ name: user?.name, wa_number: user?.wa_number }); }} className="btn-secondary text-xs !py-1.5 !px-3">
                <Edit3 size={14} /> Edit Profil
              </button>
              <button onClick={() => setShowPasswordEdit(!showPasswordEdit)} className="btn-ghost text-xs !py-1.5 !px-3">
                <Lock size={14} /> Ubah Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Edit Profile Form ═══ */}
      {showProfileEdit && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="card mb-6 animate-scale-in">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Edit3 size={18} /> Edit Profil</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama *</label>
              <input {...profileForm.register('name', { required: 'Nama wajib diisi' })} className="input-field" />
              {profileForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor WhatsApp *</label>
              <input {...profileForm.register('wa_number', { required: 'WA wajib diisi', pattern: { value: /^\d+$/, message: 'Nomor WhatsApp hanya boleh berisi angka' }, minLength: { value: 10, message: 'Minimal 10 digit' }, maxLength: { value: 13, message: 'Maksimal 13 digit' } })} className="input-field" />
              {profileForm.formState.errors.wa_number && <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.wa_number.message}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary text-sm">Simpan</button>
            <button type="button" onClick={() => setShowProfileEdit(false)} className="btn-ghost text-sm">Batal</button>
          </div>
        </form>
      )}

      {/* ═══ Change Password Form ═══ */}
      {showPasswordEdit && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="card mb-6 animate-scale-in">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Lock size={18} /> Ubah Password</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Password Lama *</label>
              <input type="password" {...passwordForm.register('current_password', { required: 'Wajib diisi' })} className="input-field" />
              {passwordForm.formState.errors.current_password && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.current_password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password Baru *</label>
              <input type="password" {...passwordForm.register('password', { required: 'Wajib diisi', minLength: { value: 6, message: 'Minimal 6 karakter' } })} className="input-field" />
              {passwordForm.formState.errors.password && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Konfirmasi Password Baru *</label>
              <input type="password" {...passwordForm.register('password_confirmation', { required: 'Wajib diisi', validate: (v) => v === passwordForm.watch('password') || 'Password tidak cocok' })} className="input-field" />
              {passwordForm.formState.errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.password_confirmation.message}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary text-sm">Simpan</button>
            <button type="button" onClick={() => { setShowPasswordEdit(false); passwordForm.reset(); }} className="btn-ghost text-sm">Batal</button>
          </div>
        </form>
      )}

      {/* ═══ Reseller Application ═══ */}
      {user?.role === 'customer' && (
        <div className="card mb-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-[var(--color-primary)]" /> Program Reseller</h3>

          {resellerApp?.status === 'pending' ? (
            <div className="flex items-center gap-3 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
              <Clock size={20} className="text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Menunggu Persetujuan</p>
                <p className="text-xs text-yellow-600">Pengajuan reseller Anda sedang ditinjau oleh admin.</p>
              </div>
            </div>
          ) : resellerApp?.status === 'rejected' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-red-800">Pengajuan Ditolak</p>
                  {resellerApp.admin_notes && <p className="text-xs text-red-600 mt-1">Catatan: {resellerApp.admin_notes}</p>}
                </div>
              </div>
              <button onClick={() => setShowResellerForm(true)} className="btn-primary text-sm">
                Ajukan Ulang
              </button>
            </div>
          ) : resellerApp?.status === 'approved' ? (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Disetujui!</p>
                <p className="text-xs text-green-600">Pengajuan Anda telah disetujui. Refresh halaman untuk melihat perubahan role.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Tertarik menjadi reseller Ketupat Cinta? Dapatkan harga spesial dan keuntungan lebih!
              </p>
              {!showResellerForm ? (
                <button onClick={() => setShowResellerForm(true)} className="btn-primary text-sm">
                  <Shield size={16} /> Ajukan Menjadi Reseller
                </button>
              ) : (
                <form onSubmit={resellerForm.handleSubmit(onResellerSubmit)} className="space-y-4 animate-scale-in">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nama Bisnis *</label>
                    <input {...resellerForm.register('business_name', { required: 'Nama bisnis wajib diisi' })} placeholder="Nama usaha Anda" className="input-field" />
                    {resellerForm.formState.errors.business_name && <p className="text-xs text-red-500 mt-1">{resellerForm.formState.errors.business_name.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Deskripsi Bisnis</label>
                    <textarea {...resellerForm.register('business_description')} rows={2} placeholder="Ceritakan tentang bisnis Anda..." className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Motivasi</label>
                    <textarea {...resellerForm.register('motivation')} rows={2} placeholder="Kenapa Anda ingin menjadi reseller?" className="input-field resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Kirim Pengajuan</button>
                    <button type="button" onClick={() => { setShowResellerForm(false); resellerForm.reset(); }} className="btn-ghost text-sm">Batal</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ Addresses ═══ */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><MapPin size={20} className="text-[var(--color-primary)]" />Alamat Saya</h2>
        <button onClick={() => { setShowAddressForm(!showAddressForm); setEditingId(null); addressForm.reset({}); }} className="btn-primary text-sm !py-2 !px-4">
          <Plus size={16} />Tambah
        </button>
      </div>

      {/* Add/Edit Address Form */}
      {showAddressForm && (
        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="card mb-4 animate-scale-in">
          <h3 className="font-bold mb-4">{editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Label</label>
              <input {...addressForm.register('label')} placeholder="Rumah, Kantor..." className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Kota *</label>
              <select {...addressForm.register('city', { required: 'Pilih kota' })} className="input-field">
                <option value="">Pilih Kota</option>
                <option value="bandung">Bandung</option>
                <option value="cimahi">Cimahi</option>
              </select>
              {addressForm.formState.errors.city && <p className="text-xs text-red-500 mt-1">{addressForm.formState.errors.city.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Detail Alamat *</label>
              <textarea {...addressForm.register('detail', { required: 'Alamat wajib diisi' })} rows={2} className="input-field resize-none" placeholder="Jl. Contoh No. 123, RT/RW..." />
              {addressForm.formState.errors.detail && <p className="text-xs text-red-500 mt-1">{addressForm.formState.errors.detail.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Kecamatan</label>
              <input {...addressForm.register('district')} placeholder="Kecamatan..." className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link Maps</label>
              <input {...addressForm.register('map_link')} placeholder="https://maps.google.com/..." className="input-field" />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" {...addressForm.register('is_default')} className="accent-[var(--color-primary)]" id="is_default" />
              <label htmlFor="is_default" className="text-sm">Jadikan alamat utama</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary text-sm">Simpan</button>
            <button type="button" onClick={() => { setShowAddressForm(false); setEditingId(null); }} className="btn-ghost text-sm">Batal</button>
          </div>
        </form>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="card !p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{addr.label || 'Alamat'}</span>
                {addr.is_default && <span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)] !text-[10px]"><Star size={10} className="fill-current" />Default</span>}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{addr.detail}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{addr.district ? `${addr.district}, ` : ''}{addr.city === 'bandung' ? 'Bandung' : 'Cimahi'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEditAddress(addr)} className="btn-ghost !p-2 text-xs">Edit</button>
              <button onClick={() => handleDeleteAddress(addr.id)} className="btn-ghost !p-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && !showAddressForm && (
          <p className="text-center py-8 text-[var(--color-text-muted)]">Belum ada alamat. Tambahkan alamat untuk mulai pesan.</p>
        )}
      </div>
    </div>
  );
}

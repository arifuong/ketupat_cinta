import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupiah(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-orange-100 text-orange-800',
    waiting_verification: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    menunggu_pembayaran: 'bg-orange-100 text-orange-800',
    menunggu_verifikasi: 'bg-yellow-100 text-yellow-800',
    pembayaran_berhasil: 'bg-green-100 text-green-800',
    pembayaran_ditolak: 'bg-red-100 text-red-800',
    belum_ditagih: 'bg-gray-100 text-gray-800',
    terlambat: 'bg-red-100 text-red-800',
    sebagian_dibayar: 'bg-blue-100 text-blue-800',
    lunas: 'bg-green-100 text-green-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    full: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function normalizeWhatsApp(value: string): string {
  if (!value) return '';
  // Strip non-digits except +
  let clean = value.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+62')) {
    clean = '0' + clean.substring(3);
  } else if (clean.startsWith('62')) {
    clean = '0' + clean.substring(2);
  } else {
    clean = clean.replace(/\+/g, '');
  }
  return clean;
}

export function formatWhatsAppLink(phone: string): string {
  if (!phone) return '#';
  const clean = phone.replace(/\D/g, '');
  let formatted = clean;
  if (clean.startsWith('08')) {
    formatted = '62' + clean.substring(1);
  }
  return `https://wa.me/${formatted}`;
}

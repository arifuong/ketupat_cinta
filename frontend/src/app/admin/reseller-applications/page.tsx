'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import type { PaginatedResponse, ResellerApplication } from '@/types/api';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function AdminResellerApplicationsPage() {
  const [applications, setApplications] = useState<ResellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<ResellerApplication>>('/admin/reseller-applications');
      setApplications(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  async function review(id: number, status: 'approved' | 'rejected') {
    try {
      await api.patch(`/admin/reseller-applications/${id}/review`, { status });
      setMessage(status === 'approved' ? 'Pengajuan disetujui' : 'Pengajuan ditolak');
      fetchApplications();
    } catch (err: unknown) {
      const axiosErr = err as ApiError;
      setMessage(axiosErr.response?.data?.message || 'Gagal memproses pengajuan');
    }
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="section-title">Pengajuan Reseller</h1>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium">
          {message}
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        {applications.length === 0 ? (
          <p className="px-5 py-10 text-center text-[var(--color-text-muted)]">Belum ada pengajuan reseller.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Bisnis</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{app.user?.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{app.user?.wa_number}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{app.business_name}</p>
                      {app.business_description && <p className="mt-1 max-w-md text-xs text-[var(--color-text-muted)]">{app.business_description}</p>}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={app.status} label={app.status} /></td>
                    <td className="px-5 py-4">
                      {app.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => review(app.id, 'approved')} className="btn-secondary text-xs !px-3 !py-2"><CheckCircle size={14} />Approve</button>
                          <button onClick={() => review(app.id, 'rejected')} className="btn-ghost text-xs !px-3 !py-2 text-red-500"><XCircle size={14} />Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

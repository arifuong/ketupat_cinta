'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { User, PaginatedResponse } from '@/types/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get<PaginatedResponse<User>>(`/admin/users?${params}`);
      setUsers(data.data);
      setLastPage(data.meta.last_page);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: number, role: string, isTrusted?: boolean) {
    const t = toast.loading('Memproses...');
    try {
      await api.patch(`/admin/users/${userId}/role`, { role, is_trusted: isTrusted || false });
      toast.success('User berhasil diperbarui', { id: t });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal', { id: t });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="section-title mb-6">Manajemen User</h1>

      <div className="flex gap-2 mb-6">
        {['', 'customer', 'reseller'].map((role) => (
          <button key={role} onClick={() => { setRoleFilter(role); setPage(1); }} className={`badge cursor-pointer ${roleFilter === role ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {role === '' ? 'Semua' : role === 'customer' ? 'Customer' : 'Reseller'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="pb-3 pr-4">Nama</th>
                <th className="pb-3 pr-4">WA</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-warm))' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        {u.is_trusted && <span className="text-xs text-[var(--color-secondary)]">💎 Terpercaya</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-text-muted)]">{u.wa_number || '-'}</td>
                  <td className="py-3 pr-4"><span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{u.role_label}</span></td>
                  <td className="py-3 pr-4"><StatusBadge status={u.status} label={u.status === 'active' ? 'Aktif' : 'Nonaktif'} /></td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {u.role !== 'admin' && (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="input-field !py-1 !px-2 !text-xs !w-auto"
                          >
                            <option value="customer">Customer</option>
                            <option value="reseller">Reseller</option>
                          </select>
                          {u.role === 'reseller' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'reseller', !u.is_trusted)}
                              className={`btn-ghost !py-1 !px-2 text-xs ${u.is_trusted ? 'text-[var(--color-secondary)]' : 'text-gray-400'}`}
                              title={u.is_trusted ? 'Remove trust' : 'Set trusted'}
                            >
                              <Shield size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-ghost disabled:opacity-30">←</button>
              <span className="flex items-center px-4 text-sm">{page} / {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="btn-ghost disabled:opacity-30">→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

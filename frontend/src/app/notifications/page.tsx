'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Notification, PaginatedResponse } from '@/types/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    try {
      const { data } = await api.get<PaginatedResponse<Notification> & { meta: { unread_count: number } }>('/notifications');
      setNotifications(data.data);
      setUnreadCount(data.meta.unread_count);
    } catch { } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifications();
    window.dispatchEvent(new Event('notifications_updated'));
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    fetchNotifications();
    window.dispatchEvent(new Event('notifications_updated'));
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Notifikasi</h1>
          {unreadCount > 0 && <p className="text-sm text-[var(--color-text-muted)]">{unreadCount} belum dibaca</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm flex items-center gap-1">
            <CheckCheck size={16} /> Tandai semua dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={56} className="mx-auto mb-4 text-gray-300" />
          <p className="text-[var(--color-text-muted)]">Tidak ada notifikasi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif.id} className={`card !p-4 flex items-start gap-3 transition-all ${!notif.is_read ? 'border-l-4 border-l-[var(--color-primary)] bg-[var(--color-primary)]/3' : ''}`}>
              <div className="flex-1">
                <p className="text-sm font-semibold">{notif.title}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{notif.message}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{notif.time_ago}</p>
              </div>
              {!notif.is_read && (
                <button onClick={() => markRead(notif.id)} className="btn-ghost !p-1.5 text-[var(--color-primary)]" title="Tandai dibaca">
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

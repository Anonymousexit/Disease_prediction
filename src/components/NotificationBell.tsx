import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, type Notification } from '../api';

interface NotificationBellProps {
  patientId: number;
}

export default function NotificationBell({ patientId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications on mount and every 30s
  const fetchNotifications = () => {
    if (!patientId) return;
    api.getNotifications(patientId)
      .then(setNotifications)
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [patientId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedNotification(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead(patientId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    setSelectedNotification(notif);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => { setOpen(prev => !prev); setSelectedNotification(null); }}
        className="relative flex items-center justify-center size-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 group"
      >
        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
          notifications
        </span>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-900"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-[380px] max-h-[480px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">notifications_active</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary font-semibold hover:underline transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List or Detail View */}
            <div className="overflow-y-auto max-h-[380px] scrollbar-thin">
              <AnimatePresence mode="wait">
                {selectedNotification ? (
                  /* ── Detail View ── */
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="p-5"
                  >
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="flex items-center gap-1 text-xs text-primary font-semibold mb-4 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Back to all
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        {selectedNotification.doctor_name?.[0] || 'D'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {selectedNotification.doctor_name || 'Doctor'}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                          Clinical Assessment
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-sm">medical_information</span>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Regarding</span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedNotification.disease}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-slate-500 text-sm">chat_bubble</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedNotification.message}
                      </p>
                    </div>

                    <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {new Date(selectedNotification.created_at).toLocaleString()}
                    </p>
                  </motion.div>
                ) : notifications.length === 0 ? (
                  /* ── Empty State ── */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 px-6"
                  >
                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-3xl">
                        notifications_off
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No notifications yet</p>
                    <p className="text-slate-400 text-xs mt-1">You'll see doctor replies here</p>
                  </motion.div>
                ) : (
                  /* ── Notification List ── */
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-all duration-200 hover:bg-primary/5 border-b border-slate-50 dark:border-slate-800/50 ${
                            !notif.is_read
                              ? 'bg-primary/[0.03]'
                              : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`size-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            !notif.is_read
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {notif.doctor_name?.[0] || 'D'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className={`text-sm truncate ${
                                !notif.is_read
                                  ? 'font-bold text-slate-900 dark:text-white'
                                  : 'font-medium text-slate-600 dark:text-slate-400'
                              }`}>
                                Dr. {notif.doctor_name || 'Unknown'}
                              </p>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                            </div>
                            <p className="text-xs text-primary font-semibold mb-0.5">{notif.disease}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>

                          {/* Unread Dot */}
                          {!notif.is_read && (
                            <div className="size-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

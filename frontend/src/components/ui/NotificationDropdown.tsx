import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  link?: string;
  createdAt: string;
}

export const NotificationDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isFetchingRef = useRef(false);

  const fetchNotifications = async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setIsOpen(false);
      if (link) {
        navigate(link);
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-2 w-72 sm:w-80 max-h-[85vh] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-end">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors">
                <Check size={14} /> {t('notifications.mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-20" />
                <p className="text-sm">{t('notifications.no_notifications')}</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id, notification.link)}
                    className={`text-start p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors relative ${!notification.isRead ? 'bg-primary/5' : ''}`}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                    <div className="pe-4">
                      <p className={`text-sm font-bold ${!notification.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">{formatTime(notification.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

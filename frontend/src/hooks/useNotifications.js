import { useState, useEffect, useCallback } from 'react';
import http from '../api/http.js';
import { useSocket } from '../context/SocketContext.jsx';

export function useNotifications() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    http.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ notification }) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    await http.patch(`/notifications/${id}/read`);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await http.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }, []);

  const markReadByContext = useCallback(async (type, targetId) => {
    await http.patch('/notifications/read-by-context', { type, targetId });
    setNotifications(prev =>
      prev.map(n => {
        if (n.is_read) return n;
        if (type === 'channel' && n.channel_id === targetId) return { ...n, is_read: 1 };
        if (type === 'dm' && n.sender_id === targetId) return { ...n, is_read: 1 };
        return n;
      })
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead, markReadByContext };
}

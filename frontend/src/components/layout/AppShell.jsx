import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import http from '../../api/http.js';
import Sidebar from './Sidebar.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import NotificationItem from '../notifications/NotificationItem.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import ChatArea from '../chat/ChatArea.jsx';

export default function AppShell() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, markReadByContext } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([http.get('/channels'), http.get('/users')]).then(([ch, us]) => {
      setChannels(ch.data);
      setUsers(us.data);
      // Auto-navigate to #general on first load
      if (ch.data.length > 0 && window.location.pathname === '/') {
        navigate(`/channel/${ch.data[0].id}`);
      }
    });
  }, []);

  const handleChannelCreated = useCallback((channel) => {
    setChannels(prev => [...prev, channel]);
  }, []);

  // Compute unread counts per target for sidebar badges
  const unreadByTarget = notifications.reduce((acc, n) => {
    if (n.is_read) return acc;
    const key = n.message_type === 'channel' ? `ch-${n.channel_id}` : `dm-${n.sender_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-[#1a1d21]">
      <Sidebar
        channels={channels}
        users={users}
        onChannelCreated={handleChannelCreated}
        unreadByTarget={unreadByTarget}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-700/50 bg-[#1e2124]">
          <div className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setShowNotifications(v => !v)}
            />
            {showNotifications && (
              <div className="absolute right-0 top-full mt-1 w-96 bg-[#222529] border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[480px] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                  <h3 className="text-white font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                ) : (
                  <div className="divide-y divide-gray-700/50">
                    {notifications.map(n => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={(id) => { markRead(id); setShowNotifications(false); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat area fills remaining space */}
        <div className="flex-1 min-h-0">
          <Outlet context={{ channels, users, markReadByContext }} />
        </div>
      </div>
    </div>
  );
}

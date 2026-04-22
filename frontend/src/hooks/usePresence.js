import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export function usePresence() {
  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleAuthenticated = ({ onlineUserIds }) => {
      setOnlineUsers(new Set(onlineUserIds));
    };

    const handlePresence = ({ userId, status }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('authenticated', handleAuthenticated);
    socket.on('user_presence', handlePresence);

    return () => {
      socket.off('authenticated', handleAuthenticated);
      socket.off('user_presence', handlePresence);
    };
  }, [socket]);

  return onlineUsers;
}

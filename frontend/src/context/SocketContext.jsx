import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(prev => { prev?.disconnect(); return null; });
      setConnected(false);
      return;
    }

    const s = io('http://localhost:3001', { autoConnect: false });

    s.on('connect', () => {
      s.emit('authenticate', { token: localStorage.getItem('token') });
    });

    s.on('authenticated', ({ success }) => {
      if (success) setConnected(true);
    });

    s.on('disconnect', () => setConnected(false));

    s.connect();
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

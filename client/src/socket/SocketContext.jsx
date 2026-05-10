import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
const ConnectionStatusContext = createContext('disconnected');

export const useSocket = () => useContext(SocketContext);
export const useConnectionStatus = () => useContext(ConnectionStatusContext);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    if (socketRef.current?.connected && userIdRef.current === user.id) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnectionStatus('connecting');
    const socketUrl = import.meta.env.VITE_SOCKET_URL ?? '';
    const token = user?.token || null;
    
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      userIdRef.current = user.id;
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', () => {
      setConnectionStatus('connected');
      newSocket.emit('join', user.id);
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionStatus('offline');
    });

    newSocket.on('auth-error', (error) => {
      console.error('[SOCKET] Auth error:', error);
      setConnectionStatus('auth-error');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [user?.id]);

  return (
    <ConnectionStatusContext.Provider value={connectionStatus}>
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    </ConnectionStatusContext.Provider>
  );
};
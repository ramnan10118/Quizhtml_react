import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import SocketClient from '@/lib/socket-client';
import { ServerToClientEvents, ClientToServerEvents, ConnectionStatus } from '@/types/quiz';

export function useSocket(serverUrl?: string) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectionMessage: 'Connecting...'
  });

  useEffect(() => {
    const socketClient = SocketClient.getInstance();
    const socketInstance = socketClient.connect(serverUrl);

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnectionStatus({
        isConnected: true,
        connectionMessage: '✅ Connected'
      });
    });

    socketInstance.on('disconnect', () => {
      setConnectionStatus({
        isConnected: false,
        connectionMessage: '❌ Disconnected'
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus({
        isConnected: false,
        connectionMessage: '❌ Connection Error'
      });
    });

    return () => {
      socketClient.disconnect();
    };
  }, [serverUrl]);

  return { socket, connectionStatus };
}
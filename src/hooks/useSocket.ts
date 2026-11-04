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

    // The socket is a shared singleton: when this page mounts after a client-side
    // navigation it is usually already connected, so reflect that immediately
    // instead of waiting for a 'connect' event that already fired.
    const onConnect = () => setConnectionStatus({ isConnected: true, connectionMessage: '✅ Connected' });
    const onDisconnect = () => setConnectionStatus({ isConnected: false, connectionMessage: '❌ Disconnected' });
    const onError = (error: Error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus({ isConnected: false, connectionMessage: '❌ Connection Error' });
    };

    if (socketInstance.connected) onConnect();
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    return () => {
      // Keep the singleton connected; only drop this component's listeners.
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
    };
  }, [serverUrl]);

  return { socket, connectionStatus };
}
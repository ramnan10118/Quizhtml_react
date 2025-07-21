import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/quiz';

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private static instance: SocketClient;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(url?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      const serverUrl = url || (
        typeof window !== 'undefined' 
          ? window.location.origin
          : 'http://localhost:3000'
      );

      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.io server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
      });
    }

    return this.socket;
  }

  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketClient;
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/quiz';

export interface SocketClientConfig {
  autoRecovery?: boolean;
  sessionRecoveryCallback?: (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => void;
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private static instance: SocketClient;
  private config: SocketClientConfig = {};
  private isReconnecting = false;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(url?: string, config?: SocketClientConfig): Socket<ServerToClientEvents, ClientToServerEvents> {

    if (typeof window === 'undefined') {

      throw new Error('SocketClient is browser-only and must not be used during server rendering');

    }
    // Always create a fresh socket if previous one is disconnected or null
    if (!this.socket || !this.socket.connected) {
      if (this.socket) {
        console.log('🔄 Cleaning up existing disconnected socket');
        this.socket.removeAllListeners();
        this.socket = null;
      }
      this.config = { autoRecovery: true, ...config };
      
      const serverUrl = url || (
        typeof window !== 'undefined' 
          ? window.location.origin
          : 'http://localhost:3000'
      );

      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        forceNew: false,
        upgrade: true,
        rememberUpgrade: false,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.io server');
        
        // Trigger session recovery if enabled and we're reconnecting
        if (this.config.autoRecovery && this.isReconnecting) {
          console.log('Reconnected - triggering session recovery callback');
          this.config.sessionRecoveryCallback?.(this.socket!);
        }
        
        this.isReconnecting = false;
      });

      // Enhanced disconnect handler moved below

      // Note: These events are not in the typed interface but exist in Socket.IO
      // Reconnect lifecycle events live on the underlying Manager, which is typed
      this.socket.io.on('reconnect', (attemptNumber: number) => {
        console.log('Reconnected to server after', attemptNumber, 'attempts');
        this.isReconnecting = true;
      });

      this.socket.io.on('reconnect_attempt', (attemptNumber: number) => {
        console.log('Attempting to reconnect... attempt', attemptNumber);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        
        // If websocket fails, force polling transport
        if (error.message?.includes('websocket') || (error as Error & { type?: string }).type === 'TransportError') {
          console.log('🔄 Websocket failed, falling back to polling only');
          if (this.socket) this.socket.io.opts.transports = ['polling'];
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.io server:', reason);
        
        // If websocket upgrade failed, stick to polling
        if (reason === 'transport error' || reason === 'transport close') {
          console.log('🔄 Transport error detected, using polling for reconnection');
          if (this.socket) this.socket.io.opts.transports = ['polling'];
        }
        
        // Mark as reconnecting for potential session recovery
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          this.isReconnecting = false;
        } else {
          this.isReconnecting = true;
        }
      });

      // Handle session recovery events
      this.socket.on('session-recovered', (data) => {
        console.log('Session recovery successful:', data.sessionId);
      });

      this.socket.on('session-not-found', (data) => {
        console.warn('Session not found or expired:', data.sessionId);
      });
    }

    return this.socket;
  }

  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public updateConfig(config: Partial<SocketClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public forceReconnect(url?: string, config?: SocketClientConfig): Socket<ServerToClientEvents, ClientToServerEvents> {
    // Force disconnect and clear socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Create fresh connection
    return this.connect(url, config);
  }
}

export default SocketClient;
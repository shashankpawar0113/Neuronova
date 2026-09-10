import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/urls';

class CaregiverSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  public connect(userId: string, role: string = 'caregiver'): Socket {
    if (this.socket && this.currentUserId === userId && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.currentUserId = userId;

    this.socket = io(BACKEND_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      auth: {
        userId,
        role,
      },
    });

    this.socket.on('connect', () => {
      console.log(`[CaregiverSocket] Connected to server as ${userId} (${role})`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[CaregiverSocket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[CaregiverSocket] Disconnected:', reason);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const caregiverSocketService = new CaregiverSocketService();

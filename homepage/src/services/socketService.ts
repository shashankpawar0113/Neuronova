import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/urls';

let socket: Socket | null = null;

export function getSocket(userId: string = 'default-patient', role: string = 'patient', name: string = 'Friend'): Socket {
  if (!socket) {
    const url = BACKEND_URL || 'http://localhost:5001';
    socket = io(url, {
      query: { userId, role, name },
      auth: { userId, role, name },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to backend real-time hub (id: ${socket?.id})`);
      socket?.emit('user:register', { userId, role, name });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getPatientLinkedCaregivers, createNotification } from '../userDataService.js';

export interface PresenceInfo {
  userId: string;
  role: 'patient' | 'caregiver' | 'health_worker' | string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  lastSeen: string;
}

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, { socketId: string; role: string; status: 'ONLINE' | 'OFFLINE' | 'BUSY' }>();

export function initSocketServer(httpServer: HttpServer, allowedOrigins: string[]): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    const handshakeUserId = (socket.handshake.query.userId as string) || (socket.handshake.auth.userId as string);
    const handshakeRole = (socket.handshake.query.role as string) || (socket.handshake.auth.role as string) || 'patient';
    const userName = (socket.handshake.query.name as string) || 'User';

    if (handshakeUserId) {
      registerUserConnection(socket, handshakeUserId, handshakeRole, userName);
    }

    // Explicit registration event
    socket.on('user:register', (data: { userId: string; role?: string; name?: string }) => {
      if (data?.userId) {
        registerUserConnection(socket, data.userId, data.role || 'patient', data.name || 'User');
      }
    });

    // WebRTC Signaling: Call invitation
    socket.on('call:invite', (data: { callId: string; callerId: string; callerName: string; receiverId: string; hasVideo?: boolean }) => {
      console.log(`[Socket] Call invitation from ${data.callerId} (${data.callerName}) to ${data.receiverId}`);
      const incomingPayload = {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        receiverId: data.receiverId,
        hasVideo: Boolean(data.hasVideo),
        timestamp: new Date().toISOString(),
      };

      // Deliver incoming call to direct recipient room AND role:caregiver broadcast room
      io.to(`user:${data.receiverId}`).emit('call:incoming', incomingPayload);
      io.to('role:caregiver').emit('call:incoming', incomingPayload);

      // Create persistent notification and push real-time notification alert
      const linked = getPatientLinkedCaregivers(data.callerId);
      const recipientCgIds: string[] = linked.length > 0
        ? linked.map((cg: any) => cg.caregiverId || cg.caregiver_id).filter(Boolean)
        : ['user_caregiver', 'default-caregiver'];
      if (data.receiverId && !recipientCgIds.includes(data.receiverId)) {
        recipientCgIds.push(data.receiverId);
      }
      if (!recipientCgIds.includes('user_caregiver')) {
        recipientCgIds.push('user_caregiver');
      }

      recipientCgIds.forEach((cgId: string) => {
        try {
          createNotification({
            recipientId: cgId,
            type: 'CALL',
            title: `Incoming Call from ${data.callerName || 'Patient'}`,
            message: `${data.callerName || 'Patient'} is requesting an instant audio call.`,
            relatedEntityId: data.callId,
          });
          io.to(`user:${cgId}`).emit('caregiver:notification:new', {
            id: `notif_call_${data.callId}`,
            type: 'CALL',
            title: `Incoming Call from ${data.callerName || 'Patient'}`,
            message: `${data.callerName || 'Patient'} is calling you now!`,
            relatedEntityId: data.callId,
            callerId: data.callerId,
            callerName: data.callerName,
            timestamp: new Date().toISOString(),
          });
        } catch (notifErr) {
          console.warn('[Socket] Could not record call notification:', notifErr);
        }
      });
    });

    // WebRTC Signaling: Accept call
    socket.on('call:accept', (data: { callId: string; peerId: string; receiverId: string }) => {
      console.log(`[Socket] Call ${data.callId} accepted by ${data.receiverId}`);
      io.to(`user:${data.peerId}`).emit('call:accepted', data);
      socket.to('role:caregiver').emit('call:handled', { callId: data.callId, handledBy: data.receiverId, status: 'accepted' });
    });

    // WebRTC Signaling: Reject call
    socket.on('call:reject', (data: { callId: string; peerId: string; reason?: string }) => {
      console.log(`[Socket] Call ${data.callId} rejected`);
      io.to(`user:${data.peerId}`).emit('call:rejected', data);
      socket.to('role:caregiver').emit('call:handled', { callId: data.callId, status: 'rejected' });
    });

    // WebRTC Signaling: End call
    socket.on('call:end', (data: { callId: string; peerId: string }) => {
      console.log(`[Socket] Call ${data.callId} ended`);
      io.to(`user:${data.peerId}`).emit('call:ended', data);
      io.to('role:caregiver').emit('call:ended', data);
    });

    // WebRTC Signaling: Peer signal (offer, answer, ICE candidates)
    socket.on('call:signal', (data: { peerId: string; signal: any; callId?: string }) => {
      const senderId = socket.data.userId || data.peerId;
      io.to(`user:${data.peerId}`).emit('call:signal', {
        senderId,
        peerId: socket.data.userId,
        signal: data.signal,
        callId: data.callId,
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const uid = socket.data.userId;
      if (uid && onlineUsers.get(uid)?.socketId === socket.id) {
        onlineUsers.delete(uid);
        broadcastPresence(uid, 'OFFLINE');
        console.log(`[Socket] User disconnected: ${uid}`);
      }
    });
  });

  console.log('[Socket] Real-time event & signaling engine initialized');
  return io;
}

function registerUserConnection(socket: Socket, userId: string, role: string, name: string) {
  socket.data.userId = userId;
  socket.data.role = role;
  socket.data.name = name;

  // Join private room
  socket.join(`user:${userId}`);
  socket.join(`role:${role}`);

  onlineUsers.set(userId, { socketId: socket.id, role, status: 'ONLINE' });
  console.log(`[Socket] User connected & joined room user:${userId} (${role})`);

  broadcastPresence(userId, 'ONLINE');

  // Immediately notify client of successful registration and current presence
  socket.emit('user:registered', {
    userId,
    status: 'ONLINE',
    serverTime: new Date().toISOString(),
  });
}

export function broadcastPresence(userId: string, status: 'ONLINE' | 'OFFLINE' | 'BUSY') {
  if (!ioInstance) return;
  const presencePayload: PresenceInfo = {
    userId,
    role: onlineUsers.get(userId)?.role || 'patient',
    status,
    lastSeen: new Date().toISOString(),
  };

  // Broadcast to anyone interested in this user's presence
  ioInstance.emit('user:presence', presencePayload);
}

export function getSocketIO(): Server | null {
  return ioInstance;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function emitToUser(userId: string, event: string, payload: any): boolean {
  if (!ioInstance) return false;
  ioInstance.to(`user:${userId}`).emit(event, payload);
  return true;
}

export function notifyCaregiversOfPatient(patientId: string, event: string, payload: any): void {
  if (!ioInstance) return;
  try {
    const linked = getPatientLinkedCaregivers(patientId);
    const targetIds = linked.map((cg) => cg.caregiverId || cg.caregiver_id).filter(Boolean);
    if (!targetIds.includes('user_caregiver')) {
      targetIds.push('user_caregiver');
    }
    targetIds.forEach((cgId) => {
      ioInstance!.to(`user:${cgId}`).emit(event, payload);
    });
    // Broadcast to role:caregiver so all caregiver tabs receive updates
    ioInstance.to('role:caregiver').emit(event, payload);
  } catch (err) {
    console.error('[Socket] Failed to notify caregivers of patient:', err);
  }
}

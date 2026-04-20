import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

let socket;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  // Socket.IO now requires JWT authentication
  socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
    auth: { token },
    withCredentials: true
  });

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('⚡ Connected:', socket.id);
    // Room joining is now automatic on server-side based on JWT
    // No need to emit 'join-room' anymore
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
    if (err.message.includes('auth')) {
      toast.error('Authentication failed. Please log in again.');
    }
  });

  socket.on('dms-sync', handleDMSUpdate);
  socket.on('dms-update', handleDMSUpdate);

  socket.on('disconnect', () => {
    if (import.meta.env.DEV) console.log('🔌 Disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const handleDMSUpdate = (data) => {
  if (import.meta.env.DEV) console.log('💡 DMS:', data);
  const { status, remainingMinutes, message } = data;

  switch (status) {
    case 'warning':
      toast(message || `⚠️ Warning: ${remainingMinutes}min remaining`, { 
        duration: 8000,
        style: { border: '1px solid #facc15' }
      });
      break;
    case 'triggered':
      toast('🚨 DEAD MAN SWITCH TRIGGERED!', { 
        duration: 0,
        style: { border: '1px solid #ef4444' }
      });
      break;
    case 'active':
      toast('✅ Active & Secure', { 
        style: { border: '1px solid #22c55e' }
      });
      break;
    default:
      if (import.meta.env.DEV) console.warn('Unknown status:', status);
  }
};

export default socket;


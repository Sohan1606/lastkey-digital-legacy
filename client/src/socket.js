import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

let socket;

export const initSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001');

  socket.on('connect', () => {
    console.log('⚡ Connected:', socket.id);
    socket.emit('join-room', userId);
  });

  socket.on('dms-sync', handleDMSUpdate);
  socket.on('dms-update', handleDMSUpdate);

  socket.on('disconnect', () => console.log('🔌 Disconnected'));

  return socket;
};

const handleDMSUpdate = (data) => {
  console.log('💡 DMS:', data);
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
      console.warn('Unknown status:', status);
  }
};

export default socket;


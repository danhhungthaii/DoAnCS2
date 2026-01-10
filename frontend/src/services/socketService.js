import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket Service - Quản lý kết nối Socket.IO
 */
class SocketService {
  constructor() {
    this.socket = null;
  }

  // Kết nối socket
  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    return this.socket;
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join event room
  joinEvent(eventId) {
    if (this.socket) {
      this.socket.emit('join-event', eventId);
      console.log(`Joined event room: ${eventId}`);
    }
  }

  // Leave event room
  leaveEvent(eventId) {
    if (this.socket) {
      this.socket.emit('leave-event', eventId);
      console.log(`Left event room: ${eventId}`);
    }
  }

  // Lắng nghe check-in mới
  onNewCheckIn(callback) {
    if (this.socket) {
      this.socket.on('new-check-in', callback);
    }
  }

  // Lắng nghe QR code update
  onQRUpdated(callback) {
    if (this.socket) {
      this.socket.on('qr-updated', callback);
    }
  }

  // Remove listener
  off(eventName) {
    if (this.socket) {
      this.socket.off(eventName);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();

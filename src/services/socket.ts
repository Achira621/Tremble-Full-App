import { io, Socket } from 'socket.io-client';
import { TokenManager, API_BASE_URL } from './api';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    connect(): void {
        if (this.socket?.connected) return;

        const token = TokenManager.getToken();
        if (!token) {
            console.error('No token available for socket connection');
            return;
        }

        this.socket = io(API_BASE_URL || undefined, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        this.socket.on('userOnline', (data) => {
            this.emit('userOnline', data);
        });

        this.socket.on('userOffline', (data) => {
            this.emit('userOffline', data);
        });

        this.socket.on('newMessage', (data) => {
            this.emit('newMessage', data);
        });

        this.socket.on('messageNotification', (data) => {
            this.emit('messageNotification', data);
        });

        this.socket.on('userTyping', (data) => {
            this.emit('userTyping', data);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConversation(conversationId: string): void {
        this.socket?.emit('joinConversation', conversationId);
    }

    leaveConversation(conversationId: string): void {
        this.socket?.emit('leaveConversation', conversationId);
    }

    sendMessage(conversationId: string, receiverId: string, content: string): void {
        this.socket?.emit('sendMessage', { conversationId, receiverId, content });
    }

    sendTyping(conversationId: string, isTyping: boolean): void {
        this.socket?.emit('typing', { conversationId, isTyping });
    }

    on(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: (data: any) => void): void {
        this.listeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any): void {
        this.listeners.get(event)?.forEach((callback) => callback(data));
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export const socketService = new SocketService();
export default socketService;

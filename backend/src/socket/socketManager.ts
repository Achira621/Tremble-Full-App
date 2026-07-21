import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { insforge } from '../config/database';

interface ConnectedUser {
    userId: string;
    socketId: string;
    username: string;
}

class SocketManager {
    private io: Server | null = null;
    private connectedUsers: Map<string, ConnectedUser> = new Map();

    initialize(httpServer: HTTPServer): void {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; username: string };
                socket.userId = decoded.id;
                socket.username = decoded.username;
                next();
            } catch (error) {
                next(new Error('Invalid token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        console.log('Socket.io initialized');
    }

    private handleConnection(socket: Socket): void {
        const userId = socket.userId;
        console.log(`User connected: ${socket.username} (${userId})`);

        this.connectedUsers.set(userId, {
            userId,
            socketId: socket.id,
            username: socket.username,
        });

        this.io?.emit('userOnline', { userId, username: socket.username });

        socket.on('joinConversation', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${socket.username} joined conversation ${conversationId}`);
        });

        socket.on('leaveConversation', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        socket.on('sendMessage', async (data: {
            conversationId: string;
            receiverId: string;
            content: string;
        }) => {
            this.handleMessage(data, socket);
        });

        socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
            socket.to(`conversation:${data.conversationId}`).emit('userTyping', {
                userId: socket.userId,
                username: socket.username,
                isTyping: data.isTyping,
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.username}`);
            this.connectedUsers.delete(userId);
            this.io?.emit('userOffline', { userId });
        });
    }

    private async handleMessage(data: {
        conversationId: string;
        receiverId: string;
        content: string;
    }, socket: Socket): Promise<void> {
        const { conversationId, receiverId, content } = data;

        const { data: insertedMessages, error: insertError } = await insforge.database
            .from('messages')
            .insert([{
                match_id: conversationId,
                sender_id: socket.userId,
                receiver_id: receiverId,
                content
            }])
            .select();

        if (insertError) {
            console.error('Socket message save error:', insertError);
            return;
        }

        const msg = insertedMessages[0];

        // Fetch sender and receiver profiles to populate
        const { data: sender } = await insforge.database.from('users').select('username, profile_photo').eq('id', socket.userId).single();
        const { data: receiver } = await insforge.database.from('users').select('username, profile_photo').eq('id', receiverId).single();

        const populatedMessage = {
            _id: msg.id,
            id: msg.id,
            conversation: msg.match_id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            read: msg.is_read,
            createdAt: msg.created_at,
            sender: {
                _id: msg.sender_id,
                id: msg.sender_id,
                username: sender?.username || socket.username,
                avatar: sender?.profile_photo || ''
            },
            receiver: {
                _id: msg.receiver_id,
                id: msg.receiver_id,
                username: receiver?.username || '',
                avatar: receiver?.profile_photo || ''
            }
        };

        this.io?.to(`conversation:${conversationId}`).emit('newMessage', populatedMessage);

        const receiverSocket = this.connectedUsers.get(receiverId);
        if (receiverSocket) {
            this.io?.to(receiverSocket.socketId).emit('messageNotification', {
                message: populatedMessage,
                sender: socket.username,
            });
        }
    }

    getIO(): Server | null {
        return this.io;
    }

    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    getConnectedUsers(): ConnectedUser[] {
        return Array.from(this.connectedUsers.values());
    }
}

export const socketManager = new SocketManager();

declare module 'socket.io' {
    interface Socket {
        userId: string;
        username: string;
    }
}

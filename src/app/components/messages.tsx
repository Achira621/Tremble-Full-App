import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Heart, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import api, { UserProfile, Message } from '../../services/api';
import socketService from '../../services/socket';

interface Match {
  id: string;
  user: UserProfile;
  matchedAt: string;
  lastMessage?: Message;
  unread: number;
  online?: boolean;
}

interface MessagesProps {
  currentUserId: string;
}

export function Messages({ currentUserId }: MessagesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMatches();
    socketService.connect();
    
    socketService.on('newMessage', handleNewMessage);
    socketService.on('userTyping', handleUserTyping);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleUserTyping);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      loadMessages(selectedMatch);
      socketService.joinConversation(selectedMatch);
    }
  }, [selectedMatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedMatch]);

  const loadMatches = async () => {
    try {
      const response = await api.matches.getMatches();
      if (response.success && response.data) {
        const formattedMatches: Match[] = response.data.map((m: any) => ({
          id: m.matchId,
          user: m.user,
          matchedAt: m.matchedAt,
          unread: 0,
        }));
        setMatches(formattedMatches);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (matchId: string) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      const userId = typeof match.user === 'string' ? match.user : match.user.id;
      const response = await api.messages.getMessages(userId);
      if (response.success && response.data) {
        setMessages(prev => ({
          ...prev,
          [matchId]: response.data as Message[]
        }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleNewMessage = (message: any) => {
    if (!selectedMatch) return;
    setMessages(prev => ({
      ...prev,
      [selectedMatch]: [...(prev[selectedMatch] || []), message]
    }));
  };

  const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.userId]: data.isTyping
    }));
  };

  const handleUserOnline = (data: { userId: string }) => {
    setMatches(prev => prev.map(m => 
      m.user.id === data.userId ? { ...m, online: true } : m
    ));
  };

  const handleUserOffline = (data: { userId: string }) => {
    setMatches(prev => prev.map(m => 
      m.user.id === data.userId ? { ...m, online: false } : m
    ));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedMatch) return;

    const match = matches.find(m => m.id === selectedMatch);
    if (!match) return;

    const receiverId = typeof match.user === 'string' ? match.user : match.user.id;
    
    setSending(true);
    try {
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        receiverId,
        content: messageText,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setMessages(prev => ({
        ...prev,
        [selectedMatch]: [...(prev[selectedMatch] || []), optimisticMessage]
      }));

      socketService.sendMessage(selectedMatch, receiverId, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (selectedMatch) {
      socketService.sendTyping(selectedMatch, isTyping);
    }
  };

  const currentMatch = matches.find(m => m.id === selectedMatch);
  const currentMessages = selectedMatch ? messages[selectedMatch] || [] : [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white">
      <div className={`${selectedMatch ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Messages
          </h1>
        </div>

        {matches.filter(m => m.unread > 0).length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">New Matches</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {matches.filter(m => m.unread > 0).map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                      <img
                        src={(match.user as any).avatar || (match.user as any).photos?.[0]?.url || `https://i.pravatar.cc/150?u=${match.user.id}`}
                        alt={(match.user as any).username || (match.user as any).name}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    {match.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 max-w-[64px] truncate">{(match.user as any).username || (match.user as any).name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No matches yet</p>
              <p className="text-sm mt-2">Start swiping to find your match!</p>
            </div>
          ) : (
            matches.map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedMatch === match.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={(match.user as any).avatar || (match.user as any).photos?.[0]?.url || `https://i.pravatar.cc/150?u=${match.user.id}`}
                    alt={(match.user as any).username || (match.user as any).name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {match.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{(match.user as any).username || (match.user as any).name}</h3>
                    <span className="text-xs text-gray-500">
                      {match.lastMessage ? new Date(match.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${match.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {match.lastMessage?.content || 'Start a conversation!'}
                  </p>
                </div>
                {match.unread > 0 && (
                  <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {selectedMatch && currentMatch ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
            <button
              onClick={() => setSelectedMatch(null)}
              className="md:hidden w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <img
              src={(currentMatch.user as any).avatar || (currentMatch.user as any).photos?.[0]?.url || `https://i.pravatar.cc/150?u=${currentMatch.user.id}`}
              alt={(currentMatch.user as any).username || (currentMatch.user as any).name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{(currentMatch.user as any).username || (currentMatch.user as any).name}</h2>
              <p className="text-sm text-gray-500">{currentMatch.online ? 'Active now' : 'Offline'}</p>
            </div>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Heart size={20} className="text-pink-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
            {currentMessages.map((message) => (
              <motion.div
                key={message.id || message._id || Date.now()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    message.senderId === currentUserId
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className={`text-xs mt-1 block ${message.senderId === currentUserId ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
            {typingUsers[currentMatch.user.id as string] && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                  <span className="text-sm text-gray-500">typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-full bg-gray-100 focus:bg-gray-200 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
          <div className="space-y-4">
            <div className="text-6xl">💬</div>
            <h2 className="text-2xl font-bold text-gray-800">Your Messages</h2>
            <p className="text-gray-600 max-w-sm">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}

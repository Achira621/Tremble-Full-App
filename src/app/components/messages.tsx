import { useState } from 'react';
import { Send, ArrowLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Match {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Connection {
  id: string;
  name: string;
  photo: string;
  bio: string;
  interests: string[];
  messages: Message[];
}

interface MessagesProps {
  currentUserId: string;
}

// Mock matches
const mockMatches: Match[] = [
  {
    id: '1',
    name: 'Alex',
    photo: 'https://i.pravatar.cc/150?img=1',
    lastMessage: 'Hey! How are you doing? 😊',
    timestamp: '2m ago',
    unread: true,
    online: true
  },
  {
    id: '2',
    name: 'Jordan',
    photo: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'Would love to grab coffee sometime!',
    timestamp: '1h ago',
    unread: false,
    online: false
  },
  {
    id: '3',
    name: 'Sam',
    photo: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'That sounds amazing! ✨',
    timestamp: '3h ago',
    unread: true,
    online: true
  },
  {
    id: '4',
    name: 'Taylor',
    photo: 'https://i.pravatar.cc/150?img=4',
    lastMessage: 'I love that place too!',
    timestamp: '1d ago',
    unread: false,
    online: false
  }
];

// Mock connections with full message history
const mockConnections: Connection[] = [
  {
    id: '1',
    name: 'Alex',
    photo: 'https://i.pravatar.cc/150?img=1',
    bio: 'Coffee enthusiast ☕ | Adventure seeker 🏔️',
    interests: ['Travel', 'Photography', 'Coffee'],
    messages: [
      { id: '1', senderId: '1', text: 'Hey! I saw you like photography too! 📸', timestamp: '10:30 AM' },
      { id: '2', senderId: 'current', text: 'Yes! I love landscape photography', timestamp: '10:32 AM' },
      { id: '3', senderId: '1', text: 'That\'s awesome! What\'s your favorite spot?', timestamp: '10:33 AM' },
      { id: '4', senderId: 'current', text: 'Definitely the mountains. You?', timestamp: '10:35 AM' },
      { id: '5', senderId: '1', text: 'Hey! How are you doing? 😊', timestamp: 'Just now' }
    ]
  },
  {
    id: '2',
    name: 'Jordan',
    photo: 'https://i.pravatar.cc/150?img=2',
    bio: 'Artist 🎨 | Music lover 🎵',
    interests: ['Art', 'Music', 'Fashion'],
    messages: [
      { id: '1', senderId: '2', text: 'Love your art! Where do you get inspiration?', timestamp: 'Yesterday' },
      { id: '2', senderId: 'current', text: 'Thanks! Mostly from nature and emotions', timestamp: 'Yesterday' },
      { id: '3', senderId: '2', text: 'Would love to grab coffee sometime!', timestamp: '1h ago' }
    ]
  }
];

export function Messages({ currentUserId }: MessagesProps) {
  const [matches] = useState<Match[]>(mockMatches);
  const [connections] = useState<Connection[]>(mockConnections);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(
    connections.reduce((acc, conn) => ({ ...acc, [conn.id]: conn.messages }), {})
  );

  const currentConnection = connections.find(c => c.id === selectedMatch);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedMatch) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      text: messageText,
      timestamp: 'Just now'
    };

    setMessages(prev => ({
      ...prev,
      [selectedMatch]: [...(prev[selectedMatch] || []), newMessage]
    }));

    setMessageText('');
  };

  return (
    <div className="h-full flex bg-white">
      {/* Matches List */}
      <div className={`${selectedMatch ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Messages
          </h1>
        </div>

        {/* New Matches */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">New Matches</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {matches.filter(m => m.unread).map((match) => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match.id)}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                    <img
                      src={match.photo}
                      alt={match.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  </div>
                  {match.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-xs text-gray-600 max-w-[64px] truncate">{match.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => setSelectedMatch(match.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedMatch === match.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={match.photo}
                  alt={match.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {match.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{match.name}</h3>
                  <span className="text-xs text-gray-500">{match.timestamp}</span>
                </div>
                <p className={`text-sm truncate ${match.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {match.lastMessage}
                </p>
              </div>
              {match.unread && (
                <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
            <button
              onClick={() => setSelectedMatch(null)}
              className="md:hidden w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <img
              src={currentConnection?.photo}
              alt={currentConnection?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{currentConnection?.name}</h2>
              <p className="text-sm text-gray-500">Active now</p>
            </div>
            <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <Heart size={20} className="text-pink-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
            {/* Match Notification */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
              <div className="flex items-center gap-2">
                <img
                  src={currentConnection?.photo}
                  alt={currentConnection?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <Heart size={24} className="text-pink-500 fill-pink-500" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  You
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">You matched with {currentConnection?.name}!</h3>
                <p className="text-sm text-gray-600 mt-1">{currentConnection?.bio}</p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {currentConnection?.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Messages */}
            {messages[selectedMatch]?.map((message) => (
              <motion.div
                key={message.id}
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
                  <p className="text-sm">{message.text}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.senderId === currentUserId ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-full bg-gray-100 focus:bg-gray-200 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
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

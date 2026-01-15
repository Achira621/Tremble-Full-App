import { useState } from 'react';
import { Heart, X, Star, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Profile {
  id: string;
  name: string;
  age: string;
  bio: string;
  interests: string[];
  photos: string[];
}

interface DiscoveryProps {
  onLike: (profile: Profile) => void;
  onPass: (profile: Profile) => void;
  onSuperLike: (profile: Profile) => void;
}

// Mock profiles for discovery
const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Alex',
    age: '26',
    bio: 'Coffee enthusiast ☕ | Adventure seeker 🏔️ | Always up for trying new restaurants',
    interests: ['Travel', 'Photography', 'Coffee', 'Hiking'],
    photos: [
      'https://picsum.photos/400/600?random=10',
      'https://picsum.photos/400/600?random=11',
      'https://picsum.photos/400/600?random=12'
    ]
  },
  {
    id: '2',
    name: 'Jordan',
    age: '24',
    bio: 'Artist 🎨 | Music lover 🎵 | Weekend warrior',
    interests: ['Art', 'Music', 'Fashion', 'Dancing'],
    photos: [
      'https://picsum.photos/400/600?random=20',
      'https://picsum.photos/400/600?random=21',
      'https://picsum.photos/400/600?random=22'
    ]
  },
  {
    id: '3',
    name: 'Sam',
    age: '28',
    bio: 'Fitness junkie 💪 | Cooking experiments in progress 👨‍🍳',
    interests: ['Fitness', 'Cooking', 'Travel', 'Nature'],
    photos: [
      'https://picsum.photos/400/600?random=30',
      'https://picsum.photos/400/600?random=31',
      'https://picsum.photos/400/600?random=32'
    ]
  },
  {
    id: '4',
    name: 'Taylor',
    age: '25',
    bio: 'Book nerd 📚 | Plant parent 🌱 | Dog lover 🐕',
    interests: ['Reading', 'Nature', 'Photography', 'Coffee'],
    photos: [
      'https://picsum.photos/400/600?random=40',
      'https://picsum.photos/400/600?random=41',
      'https://picsum.photos/400/600?random=42'
    ]
  },
  {
    id: '5',
    name: 'Casey',
    age: '27',
    bio: 'Tech geek 💻 | Gamer 🎮 | Amateur photographer 📷',
    interests: ['Gaming', 'Photography', 'Technology', 'Music'],
    photos: [
      'https://picsum.photos/400/600?random=50',
      'https://picsum.photos/400/600?random=51',
      'https://picsum.photos/400/600?random=52'
    ]
  }
];

export function Discovery({ onLike, onPass, onSuperLike }: DiscoveryProps) {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    if (!currentProfile) return;

    setDirection(action === 'pass' ? 'left' : 'right');

    setTimeout(() => {
      if (action === 'like') {
        onLike(currentProfile);
      } else if (action === 'pass') {
        onPass(currentProfile);
      } else if (action === 'superlike') {
        onSuperLike(currentProfile);
      }

      setCurrentIndex(prev => prev + 1);
      setCurrentPhotoIndex(0);
      setShowInfo(false);
      setDirection(null);
    }, 300);
  };

  if (!currentProfile) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800">That's everyone!</h2>
          <p className="text-gray-600">Check back later for more profiles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="w-full max-w-sm">
        {/* Card Stack */}
        <div className="relative h-[600px] mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                x: direction === 'left' ? -400 : direction === 'right' ? 400 : 0,
                rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Photo */}
              <div className="relative h-full">
                <img
                  src={currentProfile.photos[currentPhotoIndex]}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />

                {/* Photo Indicators */}
                <div className="absolute top-4 left-4 right-4 flex gap-2">
                  {currentProfile.photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                      onClick={() => setCurrentPhotoIndex(i)}
                    />
                  ))}
                </div>

                {/* Info Button */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
                >
                  <Info size={20} className="text-gray-700" />
                </button>

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Profile Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-1">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {!showInfo && (
                    <p className="text-sm text-white/90 line-clamp-2">{currentProfile.bio}</p>
                  )}

                  {/* Extended Info */}
                  <AnimatePresence>
                    {showInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3"
                      >
                        <p className="text-sm text-white/90">{currentProfile.bio}</p>
                        <div>
                          <p className="text-xs font-medium text-white/70 mb-2">INTERESTS</p>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.interests.map((interest) => (
                              <span
                                key={interest}
                                className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Like/Pass Overlays */}
                {direction === 'right' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-green-500 text-8xl font-bold rotate-[-20deg] border-8 border-green-500 px-12 py-4 rounded-2xl">
                      LIKE
                    </div>
                  </div>
                )}
                {direction === 'left' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-500 text-8xl font-bold rotate-[20deg] border-8 border-red-500 px-12 py-4 rounded-2xl">
                      NOPE
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next Card Preview */}
          {profiles[currentIndex + 1] && (
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl -z-10 scale-95" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <X size={32} className="text-red-500" />
          </button>
          <button
            onClick={() => handleSwipe('superlike')}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Star size={24} className="text-blue-500" fill="currentColor" />
          </button>
          <button
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Heart size={32} className="text-pink-500" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

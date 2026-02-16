import { useState, useEffect } from 'react';
import { Heart, X, Star, Info, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api, { UserProfile } from '../../services/api';

interface DiscoveryProps {
  onLike: (profile: UserProfile) => void;
  onPass: (profile: UserProfile) => void;
  onSuperLike: (profile: UserProfile) => void;
}

export function Discovery({ onLike, onPass, onSuperLike }: DiscoveryProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDiscoveryFeed();
  }, []);

  const loadDiscoveryFeed = async () => {
    try {
      setLoading(true);
      const response = await api.discovery.getFeed();
      if (response.success && response.data) {
        setProfiles(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load discovery feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || actionLoading) return;

    setDirection(action === 'pass' ? 'left' : 'right');
    setActionLoading(true);

    try {
      if (action === 'like') {
        const response = await api.matches.like(currentProfile.id);
        if (response.success) {
          onLike(currentProfile);
        }
      } else if (action === 'pass') {
        await api.matches.pass(currentProfile.id);
        onPass(currentProfile);
      } else if (action === 'superlike') {
        await api.matches.like(currentProfile.id);
        onSuperLike(currentProfile);
      }

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setCurrentPhotoIndex(0);
        setDirection(null);
        setActionLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error processing swipe:', error);
      setActionLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <Loader className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No more profiles</h2>
        <p className="text-gray-600 mb-6">Check back later for more people!</p>
        <button
          onClick={loadDiscoveryFeed}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  const profilePhotos = (currentProfile as any).photos || [];
  const currentPhoto = profilePhotos[currentPhotoIndex]?.url || `https://i.pravatar.cc/400/600?u=${currentProfile.id}`;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={currentProfile.id}
            initial={{ x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 'left' ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
              <motion.img
                src={currentPhoto}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(_e, { offset, velocity }) => {
                  if (offset.x > 100) {
                    handleSwipe('like');
                  } else if (offset.x < -100) {
                    handleSwipe('pass');
                  }
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-end gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{currentProfile.name}</h2>
                  <span className="text-xl font-medium mb-1">{currentProfile.age}</span>
                </div>

                {currentProfile.bio && (
                  <p className="text-white/80 text-sm line-clamp-2 mb-3">{currentProfile.bio}</p>
                )}

                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.slice(0, 4).map((interest, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
                >
                  <div className="text-white text-center">
                    <h3 className="text-xl font-bold mb-4">More about {currentProfile.name}</h3>
                    <p className="text-white/80">{currentProfile.bio || 'No bio available'}</p>
                    {currentProfile.interests && (
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {currentProfile.interests.map((interest, i) => (
                          <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                {profilePhotos.length > 1 && profilePhotos.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex(i);
                    }}
                    className={`w-2 h-2 rounded-full ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleSwipe('pass')}
            disabled={actionLoading}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <X size={28} className="text-red-500" />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Info size={24} className="text-blue-500" />
          </button>

          <button
            onClick={() => handleSwipe('superlike')}
            disabled={actionLoading}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Star size={28} className="text-yellow-500" fill="currentColor" />
          </button>

          <button
            onClick={() => handleSwipe('like')}
            disabled={actionLoading}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart size={28} className="text-white" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

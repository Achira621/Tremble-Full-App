import { useState } from 'react';
import { Home, Compass, MessageCircle, User } from 'lucide-react';
import { Onboarding, UserProfile } from '@/app/components/onboarding';
import { Discovery } from '@/app/components/discovery';
import { Feed } from '@/app/components/feed';
import { Messages } from '@/app/components/messages';

type View = 'feed' | 'discover' | 'messages' | 'profile';

interface Profile {
  id: string;
  name: string;
  age: string;
  bio: string;
  interests: string[];
  photos: string[];
}

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('feed');
  const [likes, setLikes] = useState<Profile[]>([]);
  const [passes, setPasses] = useState<Profile[]>([]);
  const [superLikes, setSuperLikes] = useState<Profile[]>([]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setHasCompletedOnboarding(true);
  };

  const handleLike = (profile: Profile) => {
    setLikes([...likes, profile]);
    // In a real app, check for mutual match and create connection
  };

  const handlePass = (profile: Profile) => {
    setPasses([...passes, profile]);
  };

  const handleSuperLike = (profile: Profile) => {
    setSuperLikes([...superLikes, profile]);
    // In a real app, notify the other user
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding || !userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'feed' && (
          <Feed
            currentUserName={userProfile.name}
            currentUserPhoto={userProfile.photos[0] || 'https://i.pravatar.cc/150?img=0'}
          />
        )}
        {currentView === 'discover' && (
          <Discovery
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
          />
        )}
        {currentView === 'messages' && (
          <Messages currentUserId="current" />
        )}
        {currentView === 'profile' && (
          <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
              {/* Profile Header */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={userProfile.photos[0] || 'https://i.pravatar.cc/150?img=0'}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
                      {userProfile.name}, {userProfile.age}
                    </h1>
                    <p className="text-gray-600">{userProfile.bio}</p>
                  </div>
                </div>

                {/* Interests */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Interests
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photos Grid */}
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Photos
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {userProfile.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="aspect-square rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {likes.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Likes</div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {superLikes.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Super Likes</div>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    4
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Matches</div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                <button className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-left transition-colors">
                  Edit Profile
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-left transition-colors">
                  Privacy Settings
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-left transition-colors">
                  Notifications
                </button>
                <button className="w-full py-3 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-left transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-4">
          <button
            onClick={() => setCurrentView('feed')}
            className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
              currentView === 'feed' ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <Home size={24} fill={currentView === 'feed' ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">Feed</span>
          </button>
          <button
            onClick={() => setCurrentView('discover')}
            className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
              currentView === 'discover' ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <Compass size={24} fill={currentView === 'discover' ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">Discover</span>
          </button>
          <button
            onClick={() => setCurrentView('messages')}
            className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors relative ${
              currentView === 'messages' ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <MessageCircle size={24} fill={currentView === 'messages' ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">Messages</span>
            {/* Notification badge */}
            <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
              currentView === 'profile' ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <User size={24} fill={currentView === 'profile' ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

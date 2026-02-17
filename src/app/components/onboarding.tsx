import { useState, useRef } from 'react';
import { Camera, ArrowRight, X, Loader } from 'lucide-react';
import api from '../../services/api';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  age: number;
  bio: string;
  interests: string[];
  photos: string[];
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [isSignIn, setIsSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<Omit<UserProfile, 'photos'>>({
    name: '',
    age: 0,
    bio: '',
    interests: [],
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const suggestedInterests = [
    'Photography', 'Travel', 'Music', 'Fitness', 'Cooking', 'Art',
    'Reading', 'Gaming', 'Nature', 'Coffee', 'Fashion', 'Dancing'
  ];

  const handleInterestToggle = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handlePhotoSelect = async (index: number, file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'tremble_unsigned');
      formData.append('folder', 'tremble_uploads');

      // Upload directly to Cloudinary (bypasses backend)
      const response = await fetch('https://api.cloudinary.com/v1_1/dodxjkgsx/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        const newPhotos = [...photos];
        newPhotos[index] = data.secure_url;
        setPhotos(newPhotos.filter(p => p)); // Remove empty slots
      } else {
        console.error('Cloudinary response:', data);
        alert('Photo upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    if (photos.length < 2) {
      alert('Please upload at least 2 photos');
      return;
    }

    try {
      setRegistering(true);

      // Register user with backend
      const response = await api.auth.register({
        email,
        username: profile.name.toLowerCase().replace(/\s+/g, ''),
        password,
        name: profile.name,
        age: profile.age,
      });

      if (response.success && response.data) {
        // Use data directly from register response - NO extra API calls!
        const userData = {
          id: response.data.user.id,
          name: response.data.user.fullName || response.data.user.name || profile.name,
          age: profile.age,
          bio: profile.bio || '',
          bioText: profile.bio || '',
          interests: profile.interests || [],
          photos: photos,
          vibeBadges: [] as string[],
        };
        onComplete(userData);
      } else {
        alert(response.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'
                }`}
            />
          ))}
        </div>

        {/* Step 1: Account Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {isSignIn ? 'Welcome back!' : 'Create your account'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isSignIn ? 'Sign in to continue' : 'Join Tremble today'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder={isSignIn ? 'Enter your password' : 'Create a password'}
              />
            </div>
            <button
              onClick={async () => {
                if (isSignIn) {
                  // Handle login - use data directly from response, NO extra API calls!
                  try {
                    setRegistering(true);
                    const response = await api.auth.login(email, password);
                    if (response.success && response.data) {
                      // Use data directly from login response - no extra API call needed!
                      const userData = {
                        id: response.data.user.id,
                        name: response.data.user.fullName || response.data.user.name || 'User',
                        age: 25, // Default age - will be fetched later if needed
                        bio: '',
                        bioText: '',
                        interests: [] as string[],
                        photos: response.data.user.photos || [],
                        vibeBadges: [] as string[],
                      };
                      onComplete(userData);
                    } else {
                      alert(response.error || 'Login failed');
                    }
                  } catch (error) {
                    alert('Login failed. Please try again.');
                  } finally {
                    setRegistering(false);
                  }
                } else {
                  setStep(2);
                }
              }}
              disabled={!email || !password || (password.length < 6 && !isSignIn) || registering}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registering ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {isSignIn ? 'Signing in...' : 'Continue'}
                </>
              ) : (
                <>
                  {isSignIn ? 'Sign In' : 'Continue'}
                  {!isSignIn && <ArrowRight size={20} />}
                </>
              )}
            </button>
            <div className="text-center">
              <button
                onClick={() => setIsSignIn(!isSignIn)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Tell us about you
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Your age"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                placeholder="Tell us something interesting about yourself..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!profile.name || !profile.age || profile.age < 18}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Your interests
            </h2>
            <p className="text-gray-600">Select at least 3 interests</p>
            <div className="flex flex-wrap gap-2">
              {suggestedInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${profile.interests.includes(interest)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={profile.interests.length < 3}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Add your photos
            </h2>
            <p className="text-gray-600">Upload at least 2 photos</p>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all relative ${photos[i]
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
                  onClick={() => {
                    if (!photos[i] && !uploading) {
                      fileInputRefs.current[i]?.click();
                    }
                  }}
                >
                  {photos[i] ? (
                    <>
                      <img
                        src={photos[i]}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newPhotos = [...photos];
                          newPhotos.splice(i, 1);
                          setPhotos(newPhotos);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {uploading ? (
                        <Loader className="text-purple-500 animate-spin" size={24} />
                      ) : (
                        <Camera className="text-gray-400" size={24} />
                      )}
                    </div>
                  )}
                  <input
                    ref={(el) => (fileInputRefs.current[i] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoSelect(i, file);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                disabled={uploading || registering}
                className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={photos.length < 2 || uploading || registering}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {registering ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Creating Account...
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

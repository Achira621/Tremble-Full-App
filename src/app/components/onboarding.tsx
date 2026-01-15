import { useState } from 'react';
import { Camera, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  age: string;
  bio: string;
  interests: string[];
  photos: string[];
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: '',
    bio: '',
    interests: [],
    photos: []
  });

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

  const handlePhotoUpload = (photoUrl: string) => {
    setProfile(prev => ({
      ...prev,
      photos: [...prev.photos, photoUrl]
    }));
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
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
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
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
            <button
              onClick={() => setStep(2)}
              disabled={!profile.name || !profile.age || !profile.bio}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              What are you into?
            </h2>
            <p className="text-gray-600">Select at least 3 interests</p>
            <div className="flex flex-wrap gap-2">
              {suggestedInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    profile.interests.includes(interest)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
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
                disabled={profile.interests.length < 3}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Add your photos
            </h2>
            <p className="text-gray-600">Add at least 2 photos to get started</p>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl border-2 border-dashed transition-all ${
                    profile.photos[i]
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!profile.photos[i]) {
                      // Simulate photo upload with placeholder
                      handlePhotoUpload(`https://picsum.photos/400/400?random=${i}`);
                    }
                  }}
                >
                  {profile.photos[i] ? (
                    <img
                      src={profile.photos[i]}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>
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
                onClick={handleComplete}
                disabled={profile.photos.length < 2}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

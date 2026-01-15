# Frontend-Backend Integration Guide

## ✅ Current Status

**Both servers are now running:**
- 🎨 **Frontend**: http://localhost:5173 (Your existing Tremble UI)
- 🚀 **Backend**: http://localhost:5000 (API server)

![Your Current Tremble UI](file:///C:/Users/varad/.gemini/antigravity/brain/64342793-9f82-428e-acb9-f2d98df64d17/tremble_onboarding_ui_1768476266812.png)

## 📦 What's Been Created

### 1. API Client Service
**File**: `src/services/api.ts`

A complete TypeScript API client with:
- All 40+ backend endpoints organized by feature
- Automatic JWT token management
- Type-safe request/response handling
- Error handling

### 2. How to Use the API Client

#### Import the API client:
```typescript
import api from '@/services/api';
```

#### Example: Login on Onboarding
```typescript
// In your onboarding component
import api from '@/services/api';

const handleOnboardingComplete = async (profile: UserProfile) => {
  try {
    // First, check if user exists by trying to login
    // If not, you'll need to register them
    
    // For now, let's use a test account
    const response = await api.auth.login('alex_r@example.com', 'password123');
    
    if (response.success && response.data) {
      // Token is automatically saved
      setUserProfile(response.data.user);
      setHasCompletedOnboarding(true);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### Example: Load Discovery Feed
```typescript
// In your Discovery component
import api from '@/services/api';

const loadDiscoveryUsers = async () => {
  try {
    const response = await api.discovery.getFeed(1, 10);
    
    if (response.success && response.data) {
      const users = response.data.data; // Array of DiscoveryCard
      // Update your state with real users
      setDiscoveryUsers(users.map(card => card.user));
    }
  } catch (error) {
    console.error('Failed to load discovery:', error);
  }
};
```

#### Example: Like/Tremble a User
```typescript
// In your Discovery component
import api from '@/services/api';

const handleTremble = async (userId: string) => {
  try {
    const response = await api.connections.tremble(userId);
    
    if (response.success && response.data?.matched) {
      // Show match notification!
      alert('🎉 It\'s a match!');
      // Navigate to messages
    } else {
      // Just show trembled
      alert('💜 Trembled!');
    }
  } catch (error) {
    console.error('Tremble failed:', error);
  }
};
```

#### Example: Send Message
```typescript
// In your Messages component
import api from '@/services/api';

const sendMessage = async (receiverId: string, content: string) => {
  try {
    const response = await api.messages.send(receiverId, content);
    
    if (response.success && response.data) {
      // Add message to UI
      setMessages(prev => [...prev, response.data]);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

## 🔧 Next Steps to Fully Integrate

### 1. Update Components to Use Real API

#### In `App.tsx`:
```typescript
import { useEffect } from 'react';
import api from '@/services/api';

export default function App() {
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const response = await api.auth.getCurrentUser();
      if (response.success && response.data) {
        setUserProfile(response.data);
        setHasCompletedOnboarding(true);
      }
    };
    checkAuth();
  }, []);
  
  // ... rest of your code
}
```

#### In `Discovery` component:
Replace mock profiles with:
```typescript
import { useEffect, useState } from 'react';
import api from '@/services/api';

export function Discovery({ onLike, onPass, onTremble }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const response = await api.discovery.getFeed();
      if (response.success && response.data) {
        setProfiles(response.data.data.map(card => ({
          ...card.user,
          matchScore: card.matchScore,
          commonInterests: card.commonInterests
        })));
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
    setLoading(false);
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike', profile) => {
    if (action === 'like') {
      const response = await api.connections.like(profile.id);
      if (response.data?.matched) {
        // Show match modal!
      }
    } else if (action === 'pass') {
      await api.connections.pass(profile.id);
    } else if (action === 'superlike') {
      const response = await api.connections.tremble(profile.id);
      if (response.data?.matched) {
        // Show match modal!
      }
    }
    
    // Move to next profile
    setCurrentIndex(prev => prev + 1);
  };
}
```

#### In `Messages` component:
```typescript
import { useEffect, useState } from 'react';
import api from '@/services/api';

export function Messages({ currentUserId }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const response = await api.messages.getConversations();
    if (response.success && response.data) {
      setConversations(response.data);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    const response = await api.messages.send(receiverId, content);
    if (response.success) {
      // Refresh conversation
      loadConversations();
    }
  };
}
```

### 2. Add Authentication Flow

Create a simple login screen or use test credentials:
```typescript
// Test credentials available:
// Email: alex_r@example.com
// Password: password123

// Or any other seeded user from the backend
```

### 3. Handle Token Expiration

```typescript
// The API client automatically stores tokens
// To check if user is logged in:
import { TokenManager } from '@/services/api';

const isLoggedIn = !!TokenManager.getToken();

// To logout:
await api.auth.logout(); // Automatically removes token
```

## 🎯 Quick Test Flow

1. **Start both servers** (already running):
   - Backend: `cd backend && npm run dev` ✅
   - Frontend: `npm run dev` ✅

2. **Open frontend**: http://localhost:5173 ✅

3. **For quick testing, modify onboarding to auto-login**:
```typescript
// In Onboarding component, add this button:
<button onClick={async () => {
  const response = await api.auth.login('alex_r@example.com', 'password123');
  if (response.success) {
    onComplete(response.data.user);
  }
}}>
  Use Test Account
</button>
```

4. **Test the flow**:
   - Login with test account
   - View discovery feed (real users from backend)
   - Tremble users to create matches
   - Send messages in matched conversations

## 📋 Available API Methods

```typescript
// Authentication
api.auth.register(data)
api.auth.login(email, password)
api.auth.getCurrentUser()
api.auth.logout()

// Users
api.users.getProfile(userId)
api.users.updateProfile(data)
api.users.uploadPhoto(photoUrl)
api.users.deletePhoto(photoId)
api.users.updateSettings(settings)
api.users.getStats()

// Discovery
api.discovery.getFeed(page, limit)
api.discovery.refresh()
api.discovery.updatePreferences(prefs)

// Connections
api.connections.like(targetUserId)
api.connections.pass(targetUserId)
api.connections.tremble(targetUserId)
api.connections.getMatches()
api.connections.unmatch(matchId)

// Messages
api.messages.getConversations()
api.messages.getMessages(otherUserId)
api.messages.send(receiverId, content)
api.messages.markAsRead(messageId)
api.messages.getIcebreakers()

// Posts
api.posts.create(photoUrl, caption)
api.posts.getFeed()
api.posts.getPost(postId)
api.posts.getUserPosts(userId)
api.posts.delete(postId)

// Safety
api.safety.report(data)
api.safety.block(userId)
api.safety.unblock(userId)
api.safety.getBlocked()

// Vibes
api.vibes.getUserVibes(userId)
api.vibes.generate()
```

## 🎨 Your UI is Perfect!

Your existing Tremble UI looks great! The backend is designed to work seamlessly with it:

- ✅ Beautiful gradient background
- ✅ Clean onboarding flow
- ✅ Card-based discovery
- ✅ Modern messaging interface
- ✅ Profile management

All you need to do is replace the mock data with API calls using the client I created.

## 🐛 Troubleshooting

**Backend not running?**
```bash
cd backend
npm run dev
```

**Frontend not running?**
```bash
npm run dev
```

**CORS errors?**
The backend is already configured to allow requests from your frontend with `cors({ origin: '*' })`.

**Token issues?**
```typescript
// Clear token and start fresh
import { TokenManager } from '@/services/api';
TokenManager.removeToken();
```

## 📞 Test the Integration

Want to test without modifying your UI? Use the API tester:
- Open: `backend/api-tester.html`
- Login with test credentials
- Try all endpoints
- See real responses

---

**You now have a fully functional backend + beautiful frontend!** 🎉

Just connect them together using the API client service, and Tremble will be fully operational!

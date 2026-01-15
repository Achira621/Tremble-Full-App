# 🎮 Dopamine-Driven Engagement Features

## Overview

Complete gamification and engagement system designed to make Tremble **highly addictive** and encourage users to open the app whenever they're free.

## 🔥 Features Implemented

### 1. Daily Streaks 🔥
**Endpoint:** `GET /api/engagement/streak`

- Track consecutive daily logins
- Shows current streak and longest streak
- Automatic streak updates when users log in
- Breaks if user misses a day

**Rewards:**
- Day 3: Free Profile Boost
- Day 7: 3 Super Likes
- Day 14: See Who Liked You
- Day 30: Premium Day Pass

**Claim Endpoint:** `POST /api/engagement/streak/claim`

**Why It's Addictive:** Fear of breaking the streak (FOMO) keeps users coming back daily.

---

### 2. Achievements & Badges 🏆
**Endpoint:** `GET /api/engagement/achievements`

**Auto-Unlocking Achievements:**
- **First Match** 💕 - Get your first match
- **Social Butterfly** 🦋 - 10 matches
- **Week Warrior** 🔥 - 7-day login streak
- **Popular** ⭐ - Receive 50 likes
- **Conversation Starter** 💬 - Send first message
- **Photo Pro** 📸 - Upload 6 photos
- **Heartbreaker** 💔 - Get 100 likes  
- **Explorer** 🗺️ - View 100 profiles

**Why It's Addictive:** Unlocking achievements triggers dopamine reward system. Users chase next achievement.

---

### 3. Notifications 🔔
**Endpoint:** `GET /api/engagement/notifications`

**Notification Types:**
- 🎉 **New Match** - "You have a new match!"
- 💬 **New Message** - "Someone sent you a message"
- 💜 **Someone Trembled You** - "Someone super liked you!"
- 👀 **Profile View** - "Someone viewed your profile"
- 🔥 **Streak Reminder** - "Don't break your 7-day streak!"
- 🏆 **Achievement Unlocked** - "You unlocked Social Butterfly!"
- 🎁 **Daily Reward** - "Claim your daily reward!"
- 🎭 **Mystery Reveal** - "A secret has been revealed!"

**Mark as Read:** `PUT /api/engagement/notifications/:notificationId/read`

**Why It's Addictive:** Push notifications create urgency and bring users back to app.

---

### 4. Secret Admirers 🎭
**Endpoints:**
- `GET /api/engagement/secret-admirers` - See count of hidden admirers
- `POST /api/engagement/secret-admirers/reveal` - Reveal one admirer

**How It Works:**
1. When someone likes/trembles you, it's added as a "secret admirer"
2. You see: "You have 3 secret admirers!" (count only)
3. Pay coins/premium to reveal who they are
4. Get exciting notification: "🎭 Alex trembled you!"

**Why It's Addictive:**
- Mystery and curiosity drive engagement
- Users want to know who likes them
- Creates urgency to reveal

---

### 5. Mystery Boxes 🎁
**Endpoints:**
- `GET /api/engagement/mystery-boxes` - Get available boxes
- `POST /api/engagement/mystery-boxes/:boxId/open` - Open a box

**Contents:**
- New Match notification
- Secret Admirer reveal
- Profile Boost (1 hour visibility)
- Achievement unlock

**Distribution:**
- Given after specific actions (7-day streak, 10 swipes, etc.)
- Limited time before expiry
- Random rewards increase dopamine

**Why It's Addictive:** Unpredictable rewards (variable ratio reinforcement) = maximum dopamine.

---

### 6. Daily Rewards 🎁
**Endpoint:** `GET /api/engagement/daily-rewards`

**Login Rewards:**
- Day 1: 1 Boost
- Day 2: 3 Super Likes
- Day 3: Undo Skip
- Day 4: See Who Liked (24h)
- Day 5: Mystery Box
- Day 6: 5 Super Likes
- Day 7: Premium Day Pass

**Why It's Addictive:** Daily login rewards create habit formation.

---

### 7. Activity Highlights 📊
**Endpoint:** `GET /api/engagement/highlights`

**Types:**
- 🔥 **Trending** - "You're trending! 10 people viewed you today"
- ⭐ **Hot Profile** - "Your profile is hot today!"
- 🆕 **New in Area** - "3 new users near you"
- 👥 **Mutual Friend** - "You have a mutual match with Alex"

**Why It's Addictive:** Social validation and FOMO drive engagement.

---

### 8. Engagement Stats 📈
**Endpoint:** `GET /api/engagement/stats`

**Metrics:**
- Daily/Weekly logins
- Total matches
- Total messages
- Profile views
- Likes received
- Trembles received
- Current streak
- **Engagement Score (0-100)** - Gamified overall activity

**Why It's Addictive:** Progress tracking and quantification create achievement motivation.

---

## 🎯 Automatic Triggers

### On Match:
1. ✅ Create notification for both users
2. ✅ Check and unlock "First Match" achievement
3. ✅ Create mystery box if 10th match
4. ✅ Increase engagement score

### On Message:
1. ✅ Create notification for receiver
2. ✅ Check "Conversation Starter" achievement
3. ✅ Update unread count

### On Like/Tremble:
1. ✅ Add to secret admirers (hidden)
2. ✅ Create notification: "Someone likes you!"
3. ✅ Track for "Popular" achievement

### On Login:
1. ✅ Update daily streak
2. ✅ Check streak achievements
3. ✅ Show available daily rewards
4. ✅ Create streak reminder notification if close to breaking

---

## 📱 Frontend Integration Examples

### Show Streak on Home Screen
```typescript
import api from '@/services/api';

const [streak, setStreak] = useState(null);

useEffect(() => {
  const loadStreak = async () => {
    const response = await api.engagement.getStreak();
    if (response.success) {
      setStreak(response.data);
    }
  };
  loadStreak();
}, []);

// Display:
// 🔥 7 Day Streak!
// Next reward at Day 14
```

### Notifications Badge
```typescript
const [notifications, setNotifications] = useState([]);

const loadNotifications = async () => {
  const response = await api.engagement.getNotifications();
  if (response.success) {
    const unread = response.data.filter(n => !n.isRead);
    setNotifications(unread);
  }
};

// Show badge: (5) on bell icon
```

### Secret Admirers Tease
```typescript
const [admirers, setAdmirers] = useState({ count: 0, unrevealed: 0 });

const loadAdmirers = async () => {
  const response = await api.engagement.getSecretAdmirers();
  if (response.success) {
    setAdmirers(response.data);
  }
};

// Display:
// "You have 3 secret admirers! 🎭"
// [Reveal One - 50 coins]
```

### Achievement Popup
```typescript
// Listen for achievement unlock notification
if (notification.type === 'achievement_unlocked') {
  showPopup({
    title: '🏆 Achievement Unlocked!',
    message: notification.message,
    animation: 'confetti'
  });
}
```

---

## 🎮 Gamification Strategy

### Psychological Hooks:

1. **Variable Rewards** (Mystery Boxes) - Strongest dopamine trigger
2. **Fear of Missing Out** (Limited time offers, streak breaks)
3. **Social Proof** (Trending, profile views, admirers)
4. **Progress & Achievement** (Streaks, achievements, scores)
5. **Curiosity Gap** (Secret admirers, hidden notifications)
6. **Scarcity** (Daily limits, exclusive rewards)
7. **Status & Competition** (Engagement score, badges)

### Retention Mechanics:

- **Daily Streaks** → Daily habit formation
- **Achievements** → Long-term goals
- **Notifications** → Immediate pull-back
- **Mystery** → Curiosity-driven returns
- **Rewards** → Positive reinforcement

---

## 🚀 API Client Integration

Add to `src/services/api.ts`:

```typescript
engagement: {
  getStreak: async (): Promise<ApiResponse<DailyStreak>> => {
    return this.request('/api/engagement/streak');
  },

  claimStreakReward: async (day: number) => {
    return this.request('/api/engagement/streak/claim', {
      method: 'POST',
      body: JSON.stringify({ day }),
    });
  },

  getAchievements: async () => {
    return this.request('/api/engagement/achievements');
  },

  getNotifications: async () => {
    return this.request('/api/engagement/notifications');
  },

  markNotificationRead: async (notificationId: string) => {
    return this.request(`/api/engagement/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  getSecretAdmirers: async () => {
    return this.request('/api/engagement/secret-admirers');
  },

  revealSecretAdmirer: async () => {
    return this.request('/api/engagement/secret-admirers/reveal', {
      method: 'POST',
    });
  },

  getMysteryBoxes: async () => {
    return this.request('/api/engagement/mystery-boxes');
  },

  openMysteryBox: async (boxId: string) => {
    return this.request(`/api/engagement/mystery-boxes/${boxId}/open`, {
      method: 'POST',
    });
  },

  getStats: async () => {
    return this.request('/api/engagement/stats');
  },
}
```

---

## 🎨 UI/UX Recommendations

1. **Streak Counter** - Always visible on home screen with fire emoji
2. **Notification Badge** - Red dot on every new notification
3. **Achievement Popup** - Full-screen celebration when unlocked
4. **Mystery Box Animation** - 3D box opening animation
5. **Secret Admirer Card** - Blurred profiles with reveal button
6. **Progress Bars** - Visual progress to next achievement
7. **Daily Reward Calendar** - 7-day grid showing rewards
8. **Engagement Score Ring** - Circular progress (like Apple Watch)

---

## 📊 Analytics to Track

- Daily Active Users (DAU)
- Streak retention rate
- Achievement unlock rate
- Secret admirer reveal conversion
- Mystery box open rate
- Notification click-through rate
- Average session time
- Return rate after notification

---

## 🔮 Future Enhancements

- **Leaderboards** - Top users by engagement score
- **Challenges** - Weekly/monthly challenges
- **Referral Rewards** - Invite friends for bonuses
- **Seasonal Events** - Special limited-time achievements
- **Profile Boosts** - Paid visibility increases
- **Coins System** - In-app currency for reveals/boosts
- **Lucky Spin** - Daily spin-the-wheel game
- **Collectibles** - Special badges to collect

---

**Result: Users will check Tremble multiple times per day driven by:**
- ✅ Notifications (immediate pulls)
- ✅ Streaks (daily habit)
- ✅ Secret admirers (curiosity)
- ✅ Mystery boxes (unpredictability)
- ✅ Achievements (long-term goals)
- ✅ Daily rewards (login incentive)

**Maximum dopamine, maximum retention!** 🎮🔥

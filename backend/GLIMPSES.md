# 🎬 Glimpses - TikTok-Style Photo Discovery

## What is Glimpses?

**Glimpses** is Tremble's answer to TikTok Reels / Instagram Reels - but **photo-based** instead of video-based. It's designed to be even MORE addictive for a dating/discovery app.

## Why It's More Addictive Than Reels

1. **Faster Consumption** - Photos load instantly (vs video buffering)
2. **Lower Barrier** - Easier to create (just a photo, no video editing)
3. **Dating Context** - Every scroll is a potential match
4. **Instant Interaction** - Tremble, like, comment in one tap
5. **Algorithm Magic** - Shows people you're likely interested in

## 🎯 How It Works

### User Experience

1. **Vertical Infinite Scroll** - Swipe up for next photo
2. **Auto-Advance** - Photos change every 3-5 seconds (optional)
3. **Full-Screen Immersive** - No distractions
4. **Quick Actions** - Like, Tremble, Comment without leaving feed
5. **Background Music** - Users can add music tracks to glimpses

### Content

- **Photos Only** - Not videos (keeps Tremble unique)
- **Micro-Captions** - Max 150 characters
- **Mood Tags** - Vibing, Exploring, Party, Romantic, etc.
- **Music Tracks** - Add background music
- **Location Tags** - City/neighborhood
- **24-48 Hour Expiry** - Optional (like Stories)

## 📊 Algorithm (What Makes Feed Addictive)

The algorithm scores each glimpse based on:

### 1. Match Score (40% weight)
- Common interests with the user
- Higher = You'll probably like them

### 2. Engagement/Virality (30% weight)
- Likes × 2 + Comments + Views × 0.1
- Popular glimpses get boosted

### 3. Freshness (30% weight)
- Newer = higher priority
- Prevents stale content

### 4. Viewing History  
- Already viewed = -1000 penalty (never show again)
- Ensures always-new content

## 🎮 Interactions

### 1. View (Auto-tracked)
- Counted when glimpse displays for >1 second
- Used for analytics and algorithm

### 2. Like ❤️
- Toggle on/off
- Sends notification to creator
- Tracked for "Popular" achievements

### 3. Tremble 💜  
- Super like + instant connection attempt
- Creates notification
- If both tremble = instant match!

### 4. Comment 💬
- Up to 200 characters
- Sends notification
- Increases engagement score

### 5. Share (Future)
- Share glimpse with friends

## 📈 API Endpoints

```
POST   /api/glimpses              - Create glimpse
GET    /api/glimpses/feed          - Get infinite scroll feed
GET    /api/glimpses/my            - Get my glimpses
POST   /api/glimpses/:id/view      - Record view
POST   /api/glimpses/:id/like      - Like/unlike
POST   /api/glimpses/:id/tremble   - Tremble (super like)
POST   /api/glimpses/:id/comment   - Add comment
GET    /api/glimpses/:id/stats     - Get analytics (creator only)
DELETE /api/glimpses/:id           - Delete glimpse
```

## 🎨 UI/UX Design

### Feed Screen

```
┌─────────────────────┐
│                     │
│   Full-Screen       │  
│   Photo             │  <- Swipe up for next
│                     │
│   @username, 22     │  <- User info overlay
│   "vibing 🎵"       │  <- Caption + mood
│                     │
│  ❤️  💜  💬  📊     │  <- Action buttons
│  45  12  8   90%    │  <- Stats (creator only)
└─────────────────────┘
```

### Elements

- **Top**: Skip/Close button
- **Center**: Full-bleed photo
- **Bottom**: User info + actions
- **Swipe Up**: Next glimpse
- **Swipe Down**: Previous (optional)
- **Tap**: Pause auto-advance
- **Double Tap**: Like
- **Hold**: View profile

## 🔥 Addictive Mechanics

### 1. Infinite Scroll
- No end, always more content
- Variable ratio reinforcement

### 2. Auto-Advance
- 3-5 second timer
- Creates urgency ("see next!")
- Can be paused by tapping

### 3. Instant Gratification
- Like/tremble with single tap
- Immediate visual feedback
- Dopamine hit every 3 seconds

### 4. FOMO (Fear of Missing Out)
- Glimpses expire in 24-48h
- "See it now or miss forever"
- Limited-time content

### 5. Discovery
- Every scroll = potential match
- "What if next one is perfect?"
- Curiosity-driven

### 6. Social Validation
- See view counts, likes
- "Am I attractive?" feedback loop
- Competitive element

## 💡 Use Cases

### For Users (Viewers)

1. **Quick Browse** - See 20+ profiles in 2 minutes
2. **Discover New People** - Algorithm shows compatible matches
3. **Low Investment** - Just swipe, no thinking required
4. **Entertainment** - Engaging even without intent to match
5. **Background Activity** - Can scroll while waiting/bored

### For Creators (Posters)

1. **Show Personality** - Quick snapshot of life
2. **Increase Visibility** - Algorithm boost for engaging content
3. **Get Feedback** - See likes, views, engagement
4. **Stay Active** - Post glimpses to stay in discovery feed
5. **Express Mood** - Share current vibe/activity

## 📊 Creator Analytics

When viewing your own glimpse:

```json
{
  "totalViews": 250,
  "uniqueViews": 180,
  "likes": 45,
  "comments": 8,
  "trembles": 12,
  "averageWatchTime": 3.2,
  "engagementRate": 18.5
}
```

**engagement Rate** = (Likes + Comments + Trembles) / Total Views × 100

## 🎵 Music Integration (Future)

- Browse music library
- Add track to glimpse
- Viewers hear music while viewing
- Discover new music through glimpses
- "Use this track" button

## 🏷️ Mood Types

1. **Vibing** 🎵 - Just chilling, listening to music
2. **Exploring** 🗺️ - Out and about
3. **Chilling** 😌 - Relaxing at home
4. **Party** 🎉 - Out with friends
5. **Romantic** 💕 - Date night vibes
6. **Adventurous** 🏔️ - Hiking, traveling
7. **Creative** 🎨 - Art, creativity
8. **Peaceful** 🧘 - Meditation, nature
9. **Energetic** ⚡ - Gym, sports
10. **Mysterious** 🎭 - Intriguing, secretive

## 🔄 Auto-Advance Logic

```typescript
// Frontend implementation
const AUTO_ADVANCE_DURATION = 4000; // 4 seconds

let timer = setInterval(() => {
  if (!isPaused) {
    nextGlimpse();
  }
}, AUTO_ADVANCE_DURATION);

// Pause on tap
onTap(() => {
  isPaused = !isPaused;
});

// Reset timer on manual swipe
onSwipe(() => {
  clearInterval(timer);
  timer = startNewTimer();
});
```

## 📱 Frontend Implementation

```typescript
import api from '@/services/api';

const [glimpses, setGlimpses] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);

// Load feed
useEffect(() => {
  const loadFeed = async () => {
    const response = await api.glimpses.getFeed();
    if (response.success) {
      setGlimpses(response.data);
    }
  };
  loadFeed();
}, []);

// Record view
useEffect(() => {
  if (glimpses[currentIndex]) {
    api.glimpses.recordView(glimpses[currentIndex].glimpse.id, {
      watchTime: 3.5
    });
  }
}, [currentIndex]);

// Like action
const handleLike = async () => {
  const glimpse = glimpses[currentIndex];
  await api.glimpses.like(glimpse.glimpse.id);
  // Update UI
};

// Next glimpse
const nextGlimpse = () => {
  setCurrentIndex(prev => prev + 1);
  
  // Load more when near end
  if (currentIndex >= glimpses.length - 3) {
    loadMoreGlimpses();
  }
};
```

## 🎯 Comparison: Glimpses vs Reels

| Feature | TikTok Reels | Tremble Glimpses |
|---------|-------------|------------------|
| **Format** | Video | Photo |
| **Duration** | 15-60s | 3-5s auto-advance |
| **Load Time** | Buffers | Instant |
| **Creation** | Requires editing | Just a photo |
| **Context** | Entertainment | Dating/Discovery |
| **Interaction** | Like, Comment, Share | Like, Tremble, Match |
| **Algorithm** | Engagement-based | Match + Engagement |
| **Goal** | Watch time | Connections |

## 🚀 Why Glimpses Will Be Addictive

1. **Faster** - Photos load instantly (no buffering)
2. **Easier** - No video creation/editing skills needed
3. **More Personal** - Direct path to matching
4. **Lower Commitment** - 3 seconds vs 60 seconds
5. **Higher ROI** - Every glimpse = potential date
6. **Discovery Focus** - Designed for meeting people
7. **FOMO** - Expiring content creates urgency
8. **Infinite** - Never runs out of content

## 📊 Expected Metrics

- **Session Length**: 10-20 minutes average
- **Glimpses Per Session**: 100-200
- **Return Rate**: 5-8 times per day
- **Creation Rate**: 1-3 glimpses per day
- **Conversion**: 5-10% tremble rate

## 🎬 Next Steps

1. ✅ Backend API complete
2. 📱 Build frontend vertical scroll UI
3. 🎨 Design swipe animations
4. 🎵 Integrate music library
5. 📊 Add analytics dashboard for creators
6. 🔔 Push notifications for glimpse interactions
7. 🎁 Gamify: "Trending Glimpse" badge
8. ⭐ "Glimpse of the Day" feature

---

**Result: The most addictive feature of Tremble.**  
Users will open the app "just to scroll glimpses for a minute" and stay for 20 minutes. 🎬🔥

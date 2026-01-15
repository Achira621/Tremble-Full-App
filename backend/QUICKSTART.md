# Tremble Backend - Quick Start Guide

## ✅ Backend Successfully Created!

The Tremble backend is now fully functional with all core features implemented.

## 🚀 Server Status

**Running on:** `http://localhost:5000`

**Mock Data:** 10 users with profiles, posts, and connections automatically seeded

## 🔑 Test Credentials

You can login with any of these test accounts:

```
Email: alex_r@example.com
Password: password123

Email: jordan_lee@example.com
Password: password123

Email: sam_chen@example.com
Password: password123
```

(All seeded users use the same password: `password123`)

## 📡 Quick API Tests

### 1. Health Check
```bash
GET http://localhost:5000/health
```

### 2. Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "alex_r@example.com",
  "password": "password123"
}
```

**Response:** Returns user profile and JWT token

### 3. Get Discovery Feed (requires auth token)
```bash
GET http://localhost:5000/api/discovery/feed
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4. Like a User
```bash
POST http://localhost:5000/api/connections/like
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "targetUserId": "USER_ID_FROM_DISCOVERY"
}
```

### 5. Get Matches
```bash
GET http://localhost:5000/api/connections/matches
Authorization: Bearer YOUR_TOKEN_HERE
```

### 6. Send Message
```bash
POST http://localhost:5000/api/messages/send
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "receiverId": "MATCHED_USER_ID",
  "content": "Hey! How's it going?"
}
```

## 📋 All Available Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (auth required)
- `POST /logout` - Logout (auth required)

### Users (`/api/users`)
- `GET /:userId` - Get user profile
- `PUT /profile` - Update profile
- `POST /photos` - Upload photo
- `DELETE /photos/:photoId` - Delete photo
- `PUT /settings` - Update settings
- `GET /stats` - Get statistics

### Discovery (`/api/discovery`)
- `GET /feed` - Get discovery feed (max 20/day)
- `POST /refresh` - Refresh pool
- `PUT /preferences` - Update preferences

### Connections (`/api/connections`)
- `POST /like` - Like user
- `POST /pass` - Pass user
- `POST /tremble` - Tremble user (super like)
- `GET /matches` - Get matches
- `DELETE /:matchId` - Unmatch

### Messages (`/api/messages`)
- `GET /conversations` - Get all conversations
- `GET /:otherUserId` - Get messages with user
- `POST /send` - Send message
- `PUT /:messageId/read` - Mark as read
- `GET /icebreakers` - Get icebreaker prompts

### Posts (`/api/posts`)
- `POST /` - Create post
- `GET /feed` - Get feed
- `GET /:postId` - Get post
- `GET /user/:userId` - Get user posts
- `DELETE /:postId` - Delete post

### Safety (`/api/safety`)
- `POST /report` - Report user/content
- `POST /block` - Block user
- `DELETE /block/:userId` - Unblock user
- `GET /blocked` - Get blocked users

### Vibes (`/api/vibes`)
- `GET /:userId` - Get user vibes
- `POST /generate` - Generate vibes

## 🎯 Key Features Implemented

✅ **JWT Authentication** - Secure token-based auth  
✅ **User Profiles** - Photos (max 6), interests, bio, settings  
✅ **Discovery Algorithm** - Interest-based matching with daily limits  
✅ **Connection System** - Like/Pass/Tremble with mutual match detection  
✅ **Messaging** - Chat unlocked on match with icebreaker prompts  
✅ **Posts** - Photo sharing with micro-captions (max 150 chars)  
✅ **Safety** - Report, block, content moderation hooks  
✅ **Vibe Badges** - Auto-generated personality signals  

## 🔄 Next Steps

### To Connect Frontend:
1. Create API client service in frontend
2. Use `http://localhost:5000` as base URL
3. Store JWT token in localStorage/sessionStorage
4. Add Authorization header: `Bearer {token}`

### To Add Database:
1. Choose database (MongoDB, PostgreSQL, etc.)
2. Install ORM/ODM (Mongoose, Prisma, TypeORM)
3. Replace `src/data/store.ts` with database queries
4. No changes needed to routes/controllers!

### To Deploy:
1. Set environment variables in production
2. Change `JWT_SECRET` to secure random string
3. Configure CORS for your frontend domain
4. Add rate limiting and security headers

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Business logic
│   ├── data/           # In-memory store + mock data
│   ├── middleware/     # Auth, validation, errors
│   ├── routes/         # API routes
│   ├── types/          # TypeScript types
│   ├── utils/          # Helpers & validators
│   └── server.ts       # Main server file
├── .env                # Environment variables
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript config
```

## 🐛 Troubleshooting

**Server won't start?**
- Check if port 5000 is available
- Verify `.env` file exists
- Run `npm install` again

**Authentication errors?**
- Check JWT_SECRET in `.env`
- Verify token format: `Bearer {token}`
- Token expires in 7 days by default

**Can't find users in discovery?**
- Daily limit is 20 profiles
- Users already liked/passed are filtered out
- Blocked users are excluded

## 💡 Tips

- Use tools like **Postman** or **Thunder Client** to test APIs
- Check server logs for request/response details
- Mock data resets on server restart
- All passwords are hashed with bcrypt
- Discovery algorithm prioritizes common interests

---

**Backend is ready! Start building your frontend or test the APIs!** 🎉

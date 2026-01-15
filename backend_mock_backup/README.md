# Tremble Backend API

A comprehensive REST API backend for Tremble - a visual-first social photo discovery platform.

## Features

- 🔐 **Authentication**: JWT-based auth with secure password hashing
- 👤 **User Profiles**: Photo galleries, interests, bio, settings
- 🔍 **Discovery**: Intelligent matching based on shared interests
- 💫 **Connections**: Like, Pass, Tremble with mutual match detection
- 💬 **Messaging**: Chat unlocked on mutual match with icebreaker prompts
- 📸 **Posts**: Photo sharing with micro-captions
- 🛡️ **Safety**: Report, block, content moderation
- ✨ **Vibe Badges**: Auto-generated personality signals

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Development

Start the development server with auto-reload:

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Production

Build and run:

```bash
npm run build
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users

- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/photos` - Upload photo
- `DELETE /api/users/photos/:photoId` - Delete photo
- `PUT /api/users/settings` - Update settings
- `GET /api/users/stats` - Get statistics

### Discovery

- `GET /api/discovery/feed` - Get discovery feed
- `POST /api/discovery/refresh` - Refresh pool
- `PUT /api/discovery/preferences` - Update preferences

### Connections

- `POST /api/connections/like` - Like user
- `POST /api/connections/pass` - Pass user
- `POST /api/connections/tremble` - Tremble user
- `GET /api/connections/matches` - Get matches
- `DELETE /api/connections/:matchId` - Unmatch

### Messages

- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:otherUserId` - Get messages
- `POST /api/messages/send` - Send message
- `PUT /api/messages/:messageId/read` - Mark as read
- `GET /api/messages/icebreakers` - Get icebreaker prompts

### Posts

- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed
- `GET /api/posts/:postId` - Get post
- `GET /api/posts/user/:userId` - Get user posts
- `DELETE /api/posts/:postId` - Delete post

### Safety

- `POST /api/safety/report` - Report user/content
- `POST /api/safety/block` - Block user
- `DELETE /api/safety/block/:userId` - Unblock user
- `GET /api/safety/blocked` - Get blocked users

### Vibes

- `GET /api/vibes/:userId` - Get user vibes
- `POST /api/vibes/generate` - Generate vibes

## Architecture

### Data Layer

Currently uses in-memory data structures (Maps/Arrays) as database placeholders. Easy to migrate to:
- MongoDB with Mongoose
- PostgreSQL with Prisma/TypeORM
- Any other database

### Authentication

- JWT tokens with configurable expiration
- bcrypt password hashing
- Protected routes with middleware

### Discovery Algorithm

- Interest-based matching
- Daily discovery limits
- Filters seen/blocked users
- Match score calculation

## Testing

Mock data is automatically seeded on server start with 10 users, posts, and connections.

Test credentials:
- Email: `alex_r@example.com`
- Password: `password123`

(Or any other seeded user)

## Future Enhancements

- [ ] Database integration
- [ ] File upload service (AWS S3, Cloudinary)
- [ ] WebSocket for real-time messaging
- [ ] AI content moderation
- [ ] Push notifications
- [ ] Caching layer (Redis)
- [ ] Rate limiting
- [ ] API documentation (Swagger)

## License

MIT

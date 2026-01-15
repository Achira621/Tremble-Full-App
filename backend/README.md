# Finsta - Social Photo Discovery Backend

A high-performance, production-ready backend for a social photo discovery application built with Node.js, Express, MongoDB Atlas, and TypeScript.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - JWT-based auth with bcrypt password hashing
- ✅ **User Profiles** - Profile management with search functionality
- ✅ **Photo Sharing** - Image upload with automatic optimization and thumbnail generation
- ✅ **Social Feed** - Optimized feed from followed users
- ✅ **Follow System** - Follow/unfollow users with follower/following lists
- ✅ **Like System** - Like/unlike posts with real-time counts

### Performance Optimizations
- ⚡ **MongoDB Atlas** - Free cloud database with optimized indexes
- ⚡ **Redis Caching** - Optional caching layer for faster responses
- ⚡ **Image Optimization** - Automatic WebP conversion and compression
- ⚡ **Thumbnail Generation** - Fast-loading previews
- ⚡ **Database Indexing** - Compound indexes for fast queries
- ⚡ **Response Compression** - Gzip compression for API responses
- ⚡ **Connection Pooling** - Optimized database connections
- ⚡ **Query Optimization** - Lean queries and pagination

### Security
- 🔒 **Rate Limiting** - Protection against DDoS attacks
- 🔒 **Input Validation** - Express-validator for request validation
- 🔒 **NoSQL Injection Prevention** - Mongo sanitization
- 🔒 **Security Headers** - Helmet.js for secure headers
- 🔒 **CORS** - Configurable cross-origin resource sharing
- 🔒 **HPP Protection** - HTTP parameter pollution prevention

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Free Tier)
- **Cache**: Redis (Optional, via Upstash free tier)
- **Authentication**: JWT + bcrypt
- **Image Processing**: Sharp
- **Validation**: express-validator
- **Logging**: Winston

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account
2. Create a new cluster (free M0 tier - 512MB storage)
3. Click "Connect" → "Connect your application"
4. Copy the connection string

### 3. Optional: Set Up Redis (Free)

For caching (optional but recommended for production):

1. Go to [Upstash](https://upstash.com/) and create a free account
2. Create a Redis database
3. Copy the connection URL

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finsta?retryWrites=true&w=majority

# Redis (Optional - set REDIS_ENABLED=false if not using)
REDIS_ENABLED=false
REDIS_URL=redis://default:password@host:port

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### 5. Run the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile (protected)
- `GET /api/users/search?q=query` - Search users

### Posts
- `POST /api/posts` - Create new post (protected, with image upload)
- `GET /api/posts/feed` - Get personalized feed (protected)
- `GET /api/posts/user/:username` - Get user's posts
- `POST /api/posts/:postId/like` - Like/unlike post (protected)

### Connections
- `POST /api/connections/follow/:userId` - Follow user (protected)
- `DELETE /api/connections/unfollow/:userId` - Unfollow user (protected)
- `GET /api/connections/followers/:userId` - Get followers
- `GET /api/connections/following/:userId` - Get following

## 🎯 Performance Metrics

### Optimizations Implemented

1. **Database Level**
   - Compound indexes for relationship queries
   - Text indexes for search
   - Connection pooling (min: 2, max: 10)
   - Query optimization with `.lean()`

2. **Application Level**
   - Redis caching for frequently accessed data
   - Image optimization (WebP, 80% quality)
   - Response compression
   - Rate limiting per endpoint

3. **Network Level**
   - Gzip compression
   - CDN-ready static file serving
   - Optimized payload sizes

## 📁 Project Structure

```
finsta/
├── src/
│   ├── config/         # Database and Redis configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── uploads/            # User uploaded files
├── logs/               # Application logs
├── .env.example        # Environment variables template
├── package.json
└── tsconfig.json
```

## 🧪 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"password123","fullName":"John Doe"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Create Post:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "media=@/path/to/image.jpg" \
  -F "caption=My first post!"
```

## 🔧 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | development | No |
| `PORT` | Server port | 3000 | No |
| `MONGODB_URI` | MongoDB connection string | - | **Yes** |
| `REDIS_ENABLED` | Enable Redis caching | false | No |
| `REDIS_URL` | Redis connection URL | - | No |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `JWT_EXPIRE` | JWT expiration | 7d | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | 5242880 | No |
| `CORS_ORIGIN` | Allowed origins | * | No |

## 📝 Notes

- The app uses **MongoDB Atlas free tier** (512MB storage, shared cluster)
- **Redis is optional** - the app works without it but caching improves performance
- Images are stored locally in `./uploads` folder - for production, use cloud storage (S3, Cloudinary)
- Rate limiting is enabled by default to prevent abuse
- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days by default

## 🚀 Next Steps

- [ ] Add real-time messaging with WebSocket
- [ ] Integrate cloud storage (AWS S3, Cloudinary)
- [ ] Add email verification
- [ ] Implement notifications
- [ ] Add comments on posts
- [ ] Implement stories feature
- [ ] Add analytics and insights

## 📄 License

ISC

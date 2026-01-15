# Quick Setup Guide for Finsta Backend

## Step 1: MongoDB Atlas Setup (Free Database)

1. **Create MongoDB Atlas Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up with Google or email

2. **Create a Free Cluster**
   - Click "Build a Database"
   - Choose "M0 Free" tier (512MB storage)
   - Select a cloud provider and region closest to you
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set permissions to "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (Deployment → Database)
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string (looks like: `mongodb+srv://...`)
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `finsta`

## Step 2: Update .env File

Open `.env` file in the project root and update:

```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/finsta?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here-make-it-long
```

**Generate a secure JWT secret:**
```bash
# Run this in terminal/PowerShell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Build and run production:**
```bash
npm run build
npm start
```

## Step 5: Test the API

**Health Check:**
```
http://localhost:3000/health
```

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test User\"}"
```

## Optional: Redis Setup (For Caching - Recommended but not required)

1. **Create Upstash Account**
   - Visit: https://upstash.com/
   - Sign up for free

2. **Create Redis Database**
   - Click "Create Database"
   - Choose a name and region
   - Copy the connection URL

3. **Update .env**
   ```env
   REDIS_ENABLED=true
   REDIS_URL=redis://default:yourpassword@host:port
   ```

## Troubleshooting

### PowerShell Script Execution Issue
If you get "running scripts is disabled" error:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm install"
```

### MongoDB Connection Error
- Make sure your IP is whitelisted (0.0.0.0/0 for development)
- Check username and password in connection string
- Ensure password doesn't have special characters (or URL encode them)

### Port Already in Use
Change the PORT in `.env`:
```env
PORT=3001
```

## Success!

If everything is set up correctly, you should see:
```
Server running in development mode on port 3000
MongoDB Connected: cluster0-xxxxx.mongodb.net
Health check: http://localhost:3000/health
```

## Next Steps

- Use the API endpoints documented in README.md
- Test with Postman or Thunder Client
- Build your frontend to consume this API

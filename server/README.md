# HealthOS Push Notification Server

This server handles real push notifications that work even when the browser/app is closed.

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Generate VAPID Keys
```bash
npm run generate-vapid
```

This creates `vapid-keys.json` with your public/private keys.

### 3. Start Server
```bash
npm start
```

Server runs at `http://localhost:3000`

### 4. Update Frontend Config
Create `.env` in project root:
```
VITE_PUSH_SERVER_URL=http://localhost:3000
```

### 5. Start Frontend
```bash
npm run dev
```

---

## Deploy to Render (Free)

### Step 1: Create Render Account
Go to render.com and sign up with GitHub.

### Step 2: Create a New Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `healthos-push`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Environment Variables
In Render dashboard, add:
- `PORT`: `3000`

### Step 4: Deploy
Click "Create Web Service". Wait for deployment to complete.

### Step 5: Update Frontend
After deployment, you will get a URL like `https://healthos-push.onrender.com`

Update your frontend `.env`:
```
VITE_PUSH_SERVER_URL=https://healthos-push.onrender.com
```

Redeploy frontend (if hosted on Vercel/Netlify) or rebuild.

---

## Set Up cron-job.org (Scheduled Notifications)

Since the server does not run continuously on free tier, we use cron-job.org to trigger notifications.

### Step 1: Create Account
Go to cron-job.org and sign up.

### Step 2: Create Cron Job
1. Click "Create Cronjob"
2. Configure:
   - **URL**: `https://your-render-app.onrender.com/api/check-scheduled`
   - **Schedule**: Every 5 minutes (*/5 * * * *)
   - **Method**: POST
   - **Headers**: `Content-Type`: `application/json`

3. **Request Body**:
```json
{
  "schedule": [
    {"key": "airway-reset", "time": "09:15"},
    {"key": "caffeine-cutoff", "time": "11:00"},
    {"key": "micro-hydration-11-15", "time": "11:15"},
    {"key": "micro-hydration-13-15", "time": "13:15"},
    {"key": "lunch-time", "time": "14:00"},
    {"key": "micro-hydration-15-15", "time": "15:15"},
    {"key": "micro-hydration-17-15", "time": "17:15"},
    {"key": "final-hydration", "time": "19:15"},
    {"key": "dinner-time", "time": "21:30"},
    {"key": "kitchen-closed", "time": "22:00"},
    {"key": "fluid-stop", "time": "23:00"},
    {"key": "snoregym-reminder", "time": "23:15"},
    {"key": "bedtime-position", "time": "01:00"}
  ],
  "snoreScore": 45
}
```

### How It Works
- cron-job.org calls the endpoint every 5 minutes
- Server checks if any notification time is within that minute
- If yes, sends push to all subscribed users

---

## Test the Server

### Health Check
```bash
curl https://your-render-app.onrender.com/api/health
```

### Check Subscriptions
```bash
curl https://your-render-app.onrender.com/api/subscriptions
```

### Send Test Notification (via Broadcast)
```bash
curl -X POST https://your-render-app.onrender.com/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "notification": {
      "title": "Test Notification",
      "body": "Push notifications are working!",
      "tag": "test"
    }
  }'
```

---

## Troubleshooting

### "Push subscription failed"
- Check browser console for errors
- Ensure service worker is registered
- Verify server is running and accessible

### "VAPID key not found"
- Run `npm run generate-vapid` in server folder
- Restart the server

### Notifications not arriving
- Check cron-job.org is running
- Verify at least one user has subscribed (check /api/subscriptions)
- Check browser notification permissions

### CORS errors
- Add your frontend URL to ALLOWED_ORIGINS in server/index.js

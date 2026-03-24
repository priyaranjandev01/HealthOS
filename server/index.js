import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load VAPID keys - generate if not exists
const vapidPath = join(__dirname, 'vapid-keys.json');

let vapidKeys;
if (existsSync(vapidPath)) {
  vapidKeys = JSON.parse(readFileSync(vapidPath, 'utf8'));
} else {
  console.log('⚠️ VAPID keys not found. Run: npm run generate-vapid');
  vapidKeys = {
    publicKey: 'YOUR_PUBLIC_KEY_HERE',
    privateKey: 'YOUR_PRIVATE_KEY_HERE'
  };
}

// Configure web-push
webpush.setVapidDetails(
  'mailto:healthos@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory store (use database in production)
const subscriptions = new Map();

const app = express();
app.use(express.json());

// Configure CORS - UPDATE this to your Netlify frontend URL
const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Alternative dev
  // Add your Netlify URL after deployment, e.g.:
  // 'https://your-app-name.netlify.app',
];

// Get Netlify URL from environment variable or use placeholder
const NETLIFY_URL = process.env.NETLIFY_URL;

// Check if origin is allowed
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, add your Netlify URL to ALLOWED_ORIGINS above
    if (!origin || ALLOWED_ORIGINS.includes(origin) || (NETLIFY_URL && origin === NETLIFY_URL) || origin.endsWith('.netlify.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));

// Get VAPID public key for frontend
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe endpoint - store push subscription
app.post('/api/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Missing subscription or userId' });
  }

  // Store subscription mapped to user
  subscriptions.set(userId, subscription);
  
  console.log(`✅ User ${userId} subscribed to push notifications`);
  res.json({ success: true, message: 'Subscription saved' });
});

// Unsubscribe endpoint
app.post('/api/unsubscribe', (req, res) => {
  const { userId } = req.body;
  
  if (userId && subscriptions.has(userId)) {
    subscriptions.delete(userId);
    console.log(`✅ User ${userId} unsubscribed`);
  }
  
  res.json({ success: true, message: 'Unsubscribed' });
});

// Send notification to a specific user
app.post('/api/send-notification', async (req, res) => {
  const { userId, notification } = req.body;
  
  const subscription = subscriptions.get(userId);
  
  if (!subscription) {
    return res.status(404).json({ error: 'No subscription found for user' });
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(notification)
    );
    console.log(`📨 Notification sent to user ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Push error:', error.message);
    
    // If subscription is no longer valid, remove it
    if (error.statusCode === 410) {
      subscriptions.delete(userId);
      return res.status(410).json({ error: 'Subscription expired' });
    }
    
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Broadcast notification to all users (for testing/admin)
app.post('/api/broadcast', async (req, res) => {
  const { notification } = req.body;
  
  let successCount = 0;
  let failCount = 0;

  for (const [userId, subscription] of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(notification)
      );
      successCount++;
    } catch (error) {
      failCount++;
      if (error.statusCode === 410) {
        subscriptions.delete(userId);
      }
    }
  }

  res.json({ 
    success: true, 
    sent: successCount, 
    failed: failCount,
    total: subscriptions.size 
  });
});

// Get subscription count (for admin/debugging)
app.get('/api/subscriptions', (req, res) => {
  res.json({ 
    count: subscriptions.size,
    users: Array.from(subscriptions.keys())
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', subscriptions: subscriptions.size });
});

// ==================== SCHEDULED NOTIFICATIONS ====================
// This endpoint can be called by cron-job.org to check and send due notifications

app.post('/api/check-scheduled', async (req, res) => {
  // Get schedule from request body or use default
  const { schedule, snoreScore } = req.body;
  
  if (!schedule || !Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Schedule array required' });
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  let sent = 0;
  let skipped = 0;

  for (const item of schedule) {
    const [hours, minutes] = item.time.split(':').map(Number);
    const scheduledTime = hours * 60 + minutes;
    
    // Check if we're within 1 minute of the scheduled time
    if (Math.abs(currentTime - scheduledTime) <= 1) {
      const notification = NOTIFICATIONS[item.key];
      if (notification) {
        // Customize body with snoreScore if provided
        let body = notification.body;
        if (snoreScore && item.key === 'kitchen-closed') {
          body = `🚫 Kitchen is now CLOSED. Protect your airway—no more calories or dairy tonight to prevent a ${snoreScore} Snore Score.`;
        }

        // Send to all subscriptions
        for (const [userId, subscription] of subscriptions) {
          try {
            await webpush.sendNotification(
              subscription,
              JSON.stringify({
                title: notification.title,
                body,
                icon: notification.icon,
                tag: notification.tag,
                requireInteraction: notification.requireInteraction
              })
            );
            sent++;
          } catch (error) {
            if (error.statusCode === 410) {
              subscriptions.delete(userId);
            }
          }
        }
      }
    } else {
      skipped++;
    }
  }

  res.json({ 
    success: true, 
    sent,
    skipped,
    currentTime: `${currentHour}:${currentMinute}`
  });
});

// Notification templates (should match frontend)
const NOTIFICATIONS = {
  'airway-reset': {
    title: '💧 Airway Reset',
    body: 'Drink 500ml now to reduce throat stickiness.',
    icon: '/icon-192.svg',
    tag: 'guardian-airway-reset',
    requireInteraction: false
  },
  'caffeine-cutoff': {
    title: '☕ Last Call for Caffeine!',
    body: 'Stop now to protect your 1:00 AM sleep.',
    icon: '/icon-192.svg',
    tag: 'guardian-caffeine',
    requireInteraction: true
  },
  'micro-hydration-11-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    tag: 'guardian-micro-hydration-11-15',
    requireInteraction: false
  },
  'micro-hydration-13-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    tag: 'guardian-micro-hydration-13-15',
    requireInteraction: false
  },
  'micro-hydration-15-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    tag: 'guardian-micro-hydration-15-15',
    requireInteraction: false
  },
  'micro-hydration-17-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    tag: 'guardian-micro-hydration-17-15',
    requireInteraction: false
  },
  'lunch-time': {
    title: '🥗 Lunch Time',
    body: 'Simple & Light. Fuel the body, don\'t bloat the airway.',
    icon: '/icon-192.svg',
    tag: 'guardian-lunch',
    requireInteraction: true
  },
  'final-hydration': {
    title: '🌊 Final Big Hydration',
    body: '400ml to clear out toxins before the Fluid Stop.',
    icon: '/icon-192.svg',
    tag: 'guardian-final-hydration',
    requireInteraction: false
  },
  'dinner-time': {
    title: '🍽️ Dinner Time',
    body: 'Light & Lean. No dairy/spices to avoid reflux.',
    icon: '/icon-192.svg',
    tag: 'guardian-dinner',
    requireInteraction: true
  },
  'kitchen-closed': {
    title: '🚫 Kitchen CLOSED',
    body: 'No more calories or dairy tonight to prevent a high Snore Score.',
    icon: '/icon-192.svg',
    tag: 'guardian-kitchen',
    requireInteraction: true
  },
  'fluid-stop': {
    title: '🛑 Fluid Stop',
    body: 'Minimize water now to avoid mid-sleep bathroom trips.',
    icon: '/icon-192.svg',
    tag: 'guardian-fluid-stop',
    requireInteraction: true
  },
  'snoregym-reminder': {
    title: '🦷 SnoreGym Time!',
    body: '15 minutes of muscle activation starts now.',
    icon: '/icon-192.svg',
    tag: 'guardian-snoregym',
    requireInteraction: true
  },
  'bedtime-position': {
    title: '🛌 Sleep Time',
    body: 'Left-Side Only. Gravity is the enemy!',
    icon: '/icon-192.svg',
    tag: 'guardian-bedtime',
    requireInteraction: true
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 HealthOS Push Server running on port ${PORT}`);
  console.log(`📋 Subscription count: ${subscriptions.size}`);
});
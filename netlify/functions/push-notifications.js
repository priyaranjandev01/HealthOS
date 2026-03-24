import webpush from 'web-push';

// Get VAPID keys from environment variables (set in Netlify dashboard)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Configure web-push if keys are available
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:healthos@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID keys configured');
} else {
  console.error('❌ VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Netlify env vars.');
}

// Note: Subscriptions and schedules are stored in memory - they reset on each function cold start
// For production, use Redis, Cloudflare KV, or Supabase to persist subscriptions
const subscriptions = new Map();

// Store schedule per user (in memory - will be set by the app each day)
const userSchedules = new Map();

// Notification templates
const NOTIFICATIONS = {
  'airway-reset': { title: '💧 Airway Reset', body: 'Drink 500ml now to reduce throat stickiness.', icon: '/icon-192.svg', tag: 'guardian-airway-reset', requireInteraction: false },
  'caffeine-cutoff': { title: '☕ Last Call for Caffeine!', body: 'Stop now to protect your 1:00 AM sleep.', icon: '/icon-192.svg', tag: 'guardian-caffeine', requireInteraction: true },
  'micro-hydration-11-15': { title: '💧 Micro-Hydration Check', body: '200ml to keep your airway lubricated.', icon: '/icon-192.svg', tag: 'guardian-micro-hydration-11-15', requireInteraction: false },
  'micro-hydration-13-15': { title: '💧 Micro-Hydration Check', body: '200ml to keep your airway lubricated.', icon: '/icon-192.svg', tag: 'guardian-micro-hydration-13-15', requireInteraction: false },
  'micro-hydration-15-15': { title: '💧 Micro-Hydration Check', body: '200ml to keep your airway lubricated.', icon: '/icon-192.svg', tag: 'guardian-micro-hydration-15-15', requireInteraction: false },
  'micro-hydration-17-15': { title: '💧 Micro-Hydration Check', body: '200ml to keep your airway lubricated.', icon: '/icon-192.svg', tag: 'guardian-micro-hydration-17-15', requireInteraction: false },
  'lunch-time': { title: '🥗 Lunch Time', body: 'Simple & Light. Fuel the body.', icon: '/icon-192.svg', tag: 'guardian-lunch', requireInteraction: true },
  'final-hydration': { title: '🌊 Final Big Hydration', body: '400ml to clear out toxins before the Fluid Stop.', icon: '/icon-192.svg', tag: 'guardian-final-hydration', requireInteraction: false },
  'dinner-time': { title: '🍽️ Dinner Time', body: 'Light & Lean. No dairy/spices.', icon: '/icon-192.svg', tag: 'guardian-dinner', requireInteraction: true },
  'kitchen-closed': { title: '🚫 Kitchen CLOSED', body: 'No more calories or dairy tonight to prevent a high Snore Score.', icon: '/icon-192.svg', tag: 'guardian-kitchen', requireInteraction: true },
  'fluid-stop': { title: '🛑 Fluid Stop', body: 'Minimize water now to avoid mid-sleep bathroom trips.', icon: '/icon-192.svg', tag: 'guardian-fluid-stop', requireInteraction: true },
  'snoregym-reminder': { title: '🦷 SnoreGym Time!', body: '15 minutes of muscle activation starts now.', icon: '/icon-192.svg', tag: 'guardian-snoregym', requireInteraction: true },
  'bedtime-position': { title: '🛌 Sleep Time', body: 'Left-Side Only. Gravity is the enemy!', icon: '/icon-192.svg', tag: 'guardian-bedtime', requireInteraction: true }
};

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Extract the API path from the full path (removes /.netlify/functions/push-notifications prefix)
  const fullPath = event.path;
  const apiPath = fullPath.replace(/^\/\.netlify\/functions\/push-notifications/, '') || '/';
  
  const method = event.httpMethod;

  // GET /api/vapid-public-key
  if (apiPath === '/api/vapid-public-key' && method === 'GET') {
    if (!vapidPublicKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'VAPID keys not configured on server' })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ publicKey: vapidPublicKey })
    };
  }

  // POST /api/subscribe
  if (apiPath === '/api/subscribe' && method === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { subscription, userId } = body;
      
      if (!subscription || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing subscription or userId' })
        };
      }

      subscriptions.set(userId, subscription);
      console.log(`✅ User ${userId} subscribed to push notifications`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Subscription saved' })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // POST /api/unsubscribe
  if (apiPath === '/api/unsubscribe' && method === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { userId } = body;
      
      if (userId && subscriptions.has(userId)) {
        subscriptions.delete(userId);
        console.log(`✅ User ${userId} unsubscribed`);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Unsubscribed' })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // POST /api/send-notification
  if (apiPath === '/api/send-notification' && method === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { userId, notification } = body;
      const subscription = subscriptions.get(userId);

      if (!subscription) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'No subscription found for user' })
        };
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(notification)
      );
      console.log(`📨 Notification sent to user ${userId}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('Push error:', error.message);
      
      if (error.statusCode === 410) {
        subscriptions.delete(userId);
        return {
          statusCode: 410,
          headers,
          body: JSON.stringify({ error: 'Subscription expired' })
        };
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to send notification' })
      };
    }
  }

  // POST /api/schedule-item - Store a scheduled notification item for background push
  if (apiPath === '/api/schedule-item' && method === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const { key, time, snoreScore, userId } = body;
      
      if (!key || !time || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing key, time, or userId' })
        };
      }

      // Get or create schedule for user
      if (!userSchedules.has(userId)) {
        userSchedules.set(userId, []);
      }
      const schedule = userSchedules.get(userId);
      
      // Add or update the schedule item
      const existingIndex = schedule.findIndex(item => item.key === key);
      const item = { key, time, snoreScore };
      
      if (existingIndex >= 0) {
        schedule[existingIndex] = item;
      } else {
        schedule.push(item);
      }
      
      console.log(`📅 Scheduled ${key} at ${time} for user ${userId}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Schedule item saved' })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // POST or GET /api/check-scheduled - For cron job to check and send due notifications
  if (apiPath === '/api/check-scheduled' && (method === 'POST' || method === 'GET')) {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      let sent = 0;
      let skipped = 0;

      // Check all users' schedules
      for (const [userId, schedule] of userSchedules) {
        const subscription = subscriptions.get(userId);
        
        if (!subscription) {
          console.log(`No subscription for user ${userId}, skipping`);
          continue;
        }

        for (const item of schedule) {
          const [hours, minutes] = item.time.split(':').map(Number);
          const scheduledTime = hours * 60 + minutes;
          
          // Check if we're within the scheduled minute (1 minute window)
          if (Math.abs(currentTime - scheduledTime) <= 1) {
            const notification = NOTIFICATIONS[item.key];
            if (notification) {
              let body = notification.body;
              if (item.snoreScore && item.key === 'kitchen-closed') {
                body = `🚫 Kitchen is now CLOSED. Protect your airway—no more calories or dairy tonight to prevent a ${item.snoreScore} Snore Score.`;
              }

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
                console.log(`📨 Sent ${item.key} notification to ${userId}`);
                sent++;
              } catch (error) {
                if (error.statusCode === 410) {
                  subscriptions.delete(userId);
                  console.log(`Subscription expired for ${userId}`);
                } else {
                  console.error(`Failed to send to ${userId}:`, error.message);
                }
              }
            }
          } else {
            skipped++;
          }
        }
      }

      // Also handle legacy format where schedule is passed directly in body
      const body = event.body ? JSON.parse(event.body) : {};
      if (body.schedule && Array.isArray(body.schedule)) {
        for (const item of body.schedule) {
          const [hours, minutes] = item.time.split(':').map(Number);
          const scheduledTime = hours * 60 + minutes;
          
          if (Math.abs(currentTime - scheduledTime) <= 1) {
            const notification = NOTIFICATIONS[item.key];
            if (notification) {
              let notifBody = notification.body;
              if (body.snoreScore && item.key === 'kitchen-closed') {
                notifBody = `🚫 Kitchen is now CLOSED. Protect your airway—no more calories or dairy tonight to prevent a ${body.snoreScore} Snore Score.`;
              }

              for (const [userId, subscription] of subscriptions) {
                try {
                  await webpush.sendNotification(
                    subscription,
                    JSON.stringify({
                      title: notification.title,
                      body: notifBody,
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
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, sent, skipped })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // GET /api/subscriptions (debug)
  if (apiPath === '/api/subscriptions' && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: subscriptions.size, message: 'Note: Subscriptions reset on function cold start' })
    };
  }

  // Health check
  if (apiPath === '/api/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'ok', 
        subscriptions: subscriptions.size, 
        vapidConfigured: !!(vapidPublicKey && vapidPrivateKey),
        schedules: userSchedules.size
      })
    };
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found', path: apiPath })
  };
}
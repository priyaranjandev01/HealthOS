const CACHE_NAME = 'healthos-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Guardian Notification Messages with Action Buttons and Sticky behavior
const GUARDIAN_NOTIFICATIONS = {
  // Morning
  'airway-reset': {
    title: '💧 Airway Reset',
    body: 'Drink 500ml now to reduce throat stickiness.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-airway-reset',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  // Mid-morning
  'caffeine-cutoff': {
    title: '☕ Last Call for Caffeine!',
    body: 'Stop now to protect your 1:00 AM sleep.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-caffeine',
    requireInteraction: true,
  },
  // Micro-hydration notifications - multiple times throughout the day
  'micro-hydration-11-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-micro-hydration-11-15',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  'micro-hydration-13-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-micro-hydration-13-15',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  'micro-hydration-15-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-micro-hydration-15-15',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  'micro-hydration-17-15': {
    title: '💧 Micro-Hydration Check',
    body: '200ml to keep your airway lubricated.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-micro-hydration-17-15',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  // Afternoon
  'lunch-time': {
    title: '🥗 Lunch Time',
    body: 'Simple & Light. Fuel the body, don\'t bloat the airway.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-lunch',
    requireInteraction: true,
  },
  // Evening
  'final-hydration': {
    title: '🌊 Final Big Hydration',
    body: '400ml to clear out toxins before the Fluid Stop.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-final-hydration',
    actions: [
      { action: 'logged', title: '✅ I Drank It' },
    ],
    requireInteraction: false,
  },
  // Pre-dinner
  'dinner-time': {
    title: '🍽️ Dinner Time',
    body: 'Light & Lean. No dairy/spices to avoid reflux.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-dinner',
    requireInteraction: true,
  },
  // Night - Sticky
  'kitchen-closed': {
    title: '🚫 Kitchen CLOSED',
    body: 'No more calories or dairy tonight to prevent a high Snore Score.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-kitchen',
    requireInteraction: true, // Sticky - cannot be dismissed
  },
  // Late night - Sticky
  'fluid-stop': {
    title: '🛑 Fluid Stop',
    body: 'Minimize water now to avoid mid-sleep bathroom trips.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-fluid-stop',
    requireInteraction: true,
  },
  // Pre-sleep - Sticky
  'snoregym-reminder': {
    title: '🦷 SnoreGym Time!',
    body: '15 minutes of muscle activation starts now.',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-snoregym',
    requireInteraction: true, // Sticky - cannot be dismissed
  },
  // Sleep time
  'bedtime-position': {
    title: '🛌 Sleep Time',
    body: 'Left-Side Only. Gravity is the enemy!',
    icon: '/icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'guardian-bedtime',
    requireInteraction: true,
  },
};

// Service Worker version for background notifications
const SW_VERSION = 'guardian-v1';

// IndexedDB for storing scheduled notifications (background persistence)
const DB_NAME = 'HealthOS_Guardian';
const DB_VERSION = 1;
const STORE_NAME = 'scheduledNotifications';

function openGuardianDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function getScheduledNotifications() {
  const db = await openGuardianDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearOldNotifications() {
  const db = await openGuardianDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const today = new Date().toISOString().split('T')[0];
  
  const request = store.getAll();
  request.onsuccess = () => {
    const notifications = request.result;
    notifications.forEach((n) => {
      if (n.date < today) {
        store.delete(n.id);
      }
    });
  };
}

// Background notification scheduler - checks every minute when app is closed
async function checkScheduledNotifications() {
  try {
    const notifications = await getScheduledNotifications();
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    
    for (const scheduled of notifications) {
      const scheduledMinute = Math.floor(new Date(scheduled.scheduledTime).getTime() / 60000);
      
      // Check if we're within the scheduled minute and haven't shown this yet
      if (scheduledMinute === currentMinute && !scheduled.shown) {
        const notificationConfig = GUARDIAN_NOTIFICATIONS[scheduled.notificationKey];
        
        if (notificationConfig) {
          let body = notificationConfig.body;
          if (scheduled.snoreScore && scheduled.notificationKey === 'kitchen-closed') {
            body = `🚫 Kitchen is now CLOSED. Protect your airway—no more calories or dairy tonight to prevent a ${scheduled.snoreScore} Snore Score.`;
          }
          
          await self.registration.showNotification(notificationConfig.title, {
            ...notificationConfig,
            body,
          });
          
          // Mark as shown
          const db = await openGuardianDB();
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          scheduled.shown = true;
          store.put(scheduled);
        }
      }
    }
  } catch (error) {
    console.error('Guardian: Error checking scheduled notifications:', error);
  }
}

// Initialize background notification checking
async function initGuardianBackground() {
  // Clear old notifications from previous days
  await clearOldNotifications();
  
  // Check notifications immediately
  await checkScheduledNotifications();
  
  // Set up periodic checking (works in background when browser is running)
  setInterval(checkScheduledNotifications, 60000);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
  
  // Initialize background notification system on activation
  event.waitUntil(initGuardianBackground());
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  if (type === 'GUARDIAN_NOTIFICATION') {
    // Immediate notification (when app is open)
    const { notificationKey, snoreScore } = payload;
    const notificationConfig = GUARDIAN_NOTIFICATIONS[notificationKey];
    
    if (notificationConfig) {
      let body = notificationConfig.body;
      if (snoreScore && notificationKey === 'kitchen-closed') {
        body = `🚫 Kitchen is now CLOSED. Protect your airway—no more calories or dairy tonight to prevent a ${snoreScore} Snore Score.`;
      }
      
      self.registration.showNotification(notificationConfig.title, {
        ...notificationConfig,
        body,
      });
    }
  } else if (type === 'SCHEDULE_NOTIFICATION') {
    // Schedule a notification for background delivery
    event.waitUntil(async () => {
      const { id, notificationKey, scheduledTime, snoreScore } = payload;
      
      const db = await openGuardianDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.put({
        id,
        notificationKey,
        scheduledTime,
        snoreScore,
        date: new Date(scheduledTime).toISOString().split('T')[0],
        shown: false,
      });
    });
  } else if (type === 'CLEAR_SCHEDULED') {
    // Clear scheduled notifications for a specific day
    event.waitUntil(async () => {
      const { date } = payload;
      
      const db = await openGuardianDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      request.onsuccess = () => {
        request.result.forEach((n) => {
          if (n.date === date) {
            store.delete(n.id);
          }
        });
      };
    });
  } else if (type === 'LOG_ACTION') {
    // Handle action button clicks (e.g., "I Drank It")
    event.waitUntil(async () => {
      const { notificationKey, action } = payload;
      
      // Store the logged action in IndexedDB
      const db = await openGuardianDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Mark as logged
      const request = store.getAll();
      request.onsuccess = () => {
        const notifications = request.result;
        const matching = notifications.find(n => n.notificationKey === notificationKey && n.date === new Date().toISOString().split('T')[0]);
        if (matching) {
          matching.logged = true;
          store.put(matching);
        }
      };
      
      // Notify all clients to update their state
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'ACTION_LOGGED',
          payload: { notificationKey, action },
        });
      });
    });
  } else if (type === 'NOTIFICATION_CLICKED') {
    // Handle notification click - notify clients to highlight corresponding UI
    event.waitUntil(async () => {
      const { notificationKey } = payload;
      
      // Map notification keys to UI elements
      const uiMapping = {
        'kitchen-closed': 'redzone-no-late-dairy',
        'snoregym-reminder': 'checklist-mouth-gym',
        'caffeine-cutoff': 'redzone-no-smoking',
        'bedtime-position': 'checklist-side-sleep',
        'lunch-time': 'schedule-lunch',
        'dinner-time': 'schedule-dinner',
        'fluid-stop': 'redzone-no-alcohol',
        'airway-reset': 'redzone-no-alcohol',
        'final-hydration': 'redzone-no-late-dairy',
        'micro-hydration-11-15': 'checklist-kitchen-closed',
        'micro-hydration-13-15': 'checklist-kitchen-closed',
        'micro-hydration-15-15': 'checklist-kitchen-closed',
        'micro-hydration-17-15': 'checklist-kitchen-closed',
      };
      
      const targetId = uiMapping[notificationKey];
      
      // Notify all clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          payload: { notificationKey, targetId },
        });
      });
    });
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationKey = event.notification.tag.replace('guardian-', '');
  
  // Handle action button clicks
  if (event.action) {
    event.waitUntil(
      (async () => {
        const db = await openGuardianDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Extract the notification key from the tag (e.g., 'guardian-micro-hydration-11-15' -> 'micro-hydration-11-15')
        const notificationKey = event.notification.tag.replace('guardian-', '');
        
        const request = store.getAll();
        request.onsuccess = () => {
          const notifications = request.result;
          const today = new Date().toISOString().split('T')[0];
          // Match by notificationKey instead of tag
          const matching = notifications.find(n => 
            n.notificationKey === notificationKey && n.date === today
          );
          if (matching) {
            matching.logged = true;
            store.put(matching);
          }
        };
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'ACTION_LOGGED',
            payload: { notificationKey, action: event.action },
          });
        });
      })()
    );
    return;
  }
  
  // Handle notification click - focus app and sync state
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: { notificationKey },
          });
          return;
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Hashed Vite assets (e.g. /assets/index-BzXthI6d.js) are immutable — cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation & other requests — stale-while-revalidate
  // IndexedDB handles all data persistence client-side, so the app shell
  // is the only thing that needs network caching for offline support.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: if both cache miss and network fail,
          // serve the app shell so IndexedDB data is still accessible
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});

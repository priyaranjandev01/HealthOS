import { useState, useEffect, useCallback, useRef } from 'react';
import { useHydrationLog } from './useHydrationLog';

// Server configuration
// Local dev: use http://localhost:3000 or empty to fallback
// Production (Netlify): use relative path via .netlify/functions
const PUSH_SERVER_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:5173/.netlify/functions/push-notifications')
  : '';

// Generate a simple user ID (in production, use proper auth)
function getOrCreateUserId(): string {
  let userId = localStorage.getItem('healthos-user-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('healthos-user-id', userId);
  }
  return userId;
}

// Store subscription in localStorage for persistence (survives function cold starts)
function saveSubscription(subscription: PushSubscriptionJSON, userId: string): void {
  localStorage.setItem('healthos-push-subscription', JSON.stringify({ subscription, userId }));
}

function getStoredSubscription(): { subscription: PushSubscriptionJSON; userId: string } | null {
  const stored = localStorage.getItem('healthos-push-subscription');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Save schedule to localStorage for persistence across cold starts
function saveScheduleToLocalStorage(schedule: { key: string; time: string; snoreScore?: number }[]): void {
  localStorage.setItem('healthos-notification-schedule', JSON.stringify(schedule));
}

function getStoredSchedule(): { key: string; time: string; snoreScore?: number }[] | null {
  const stored = localStorage.getItem('healthos-notification-schedule');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Restore schedule to server after cold start (userId passed as parameter to avoid hoisting issue)
async function restoreScheduleFromLocalStorage(baseUrl: string, userId: string): Promise<void> {
  const stored = getStoredSchedule();
  if (stored && stored.length > 0) {
    console.log('🔄 Restoring notification schedule to server...');
    for (const item of stored) {
      try {
        await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/schedule-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: item.key,
            time: item.time,
            snoreScore: item.snoreScore,
            userId,
          }),
        });
      } catch (error) {
        console.warn('Failed to restore schedule item:', error);
      }
    }
    console.log('✅ Schedule restored to server');
  }
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

export type NotificationKey = 
  | 'airway-reset' 
  | 'caffeine-cutoff' 
  | 'micro-hydration-11-15'
  | 'micro-hydration-13-15'
  | 'micro-hydration-15-15'
  | 'micro-hydration-17-15'
  | 'lunch-time' 
  | 'final-hydration' 
  | 'dinner-time' 
  | 'kitchen-closed' 
  | 'fluid-stop'
  | 'snoregym-reminder' 
  | 'bedtime-position';

export type LoggedActions = Record<string, boolean>;

interface GuardianState {
  permission: NotificationPermission;
  isSupported: boolean;
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
  enableAlerts: () => Promise<void>;
  sendNotification: (notificationKey: NotificationKey, snoreScore?: number) => Promise<void>;
  scheduleNotification: (notificationKey: NotificationKey, scheduledTime: Date, snoreScore?: number) => Promise<void>;
  clearScheduledNotifications: (date: string) => Promise<void>;
  loggedActions: LoggedActions;
  highlightedElement: string | null;
  clearHighlight: () => void;
  isSubscribed: boolean;
  subscriptionError: string | null;
}

// Convert VAPID key to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useGuardianNotifications(): GuardianState {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loggedActions, setLoggedActions] = useState<LoggedActions>({});
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  
  const { logHydration } = useHydrationLog();
  const userIdRef = useRef(getOrCreateUserId());
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // Show modal on first load if permission not yet requested
  // Also restore subscription from localStorage if exists
  useEffect(() => {
    const initNotifications = async () => {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
      
      if ('Notification' in window) {
        setPermission(Notification.permission as NotificationPermission);
        
        // Show modal on first load if permission is default (not yet requested)
        if (Notification.permission === 'default') {
          const hasSeenModal = localStorage.getItem('guardian-modal-seen');
          if (!hasSeenModal) {
            setShowPermissionModal(true);
          }
        }
      }

      // Fetch VAPID public key from server
      // On Netlify: uses relative path to functions, localhost for dev
      try {
        const baseUrl = PUSH_SERVER_URL || '';
        const response = await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/vapid-public-key`);
        const data = await response.json();
        setVapidPublicKey(data.publicKey);
      } catch (error) {
        console.error('Failed to fetch VAPID key:', error);
      }

      // If permission already granted, try to restore subscription from localStorage
      // This ensures push works even after function cold starts
      if (Notification.permission === 'granted' && vapidPublicKey) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const baseUrl = PUSH_SERVER_URL || '';
          
          // First check if browser already has a valid subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          
          if (existingSubscription) {
            // Browser has subscription - re-register with server
            console.log('🔄 Browser has existing subscription, re-registering with server...');
            await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: existingSubscription.toJSON(),
                userId: userIdRef.current,
              }),
            });
            setIsSubscribed(true);
            // Save it to localStorage if not already there
            saveSubscription(existingSubscription.toJSON(), userIdRef.current);
            console.log('✅ Push subscription active!');
            
            // Restore schedule from localStorage if exists
            await restoreScheduleFromLocalStorage(baseUrl, userIdRef.current);
          } else {
            // No browser subscription - try to restore from localStorage
            const stored = getStoredSubscription();
            if (stored) {
              console.log('🔄 Restoring push subscription from localStorage...');
              const response = await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscription: stored.subscription,
                  userId: userIdRef.current,
                }),
              });
              if (response.ok) {
                setIsSubscribed(true);
                console.log('✅ Push subscription restored!');
                
                // Restore schedule from localStorage if exists
                await restoreScheduleFromLocalStorage(baseUrl, userIdRef.current);
              } else if (response.status === 410) {
                // Subscription expired, clear localStorage
                localStorage.removeItem('healthos-push-subscription');
                console.log('⚠️ Push subscription expired, please re-subscribe');
              }
            }
          }
        } catch (error) {
          console.error('Failed to restore subscription:', error);
        }
      }
    };

    initNotifications();
  }, []);

  // Listen for messages from Service Worker (action clicks, notification clicks)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      
      if (type === 'ACTION_LOGGED') {
        const { notificationKey } = payload;
        setLoggedActions(prev => ({ ...prev, [notificationKey]: true }));
        logHydration(notificationKey).catch(err => console.error('Failed to log hydration:', err));
        console.log(`Guardian: Action logged for ${notificationKey}`);
      } else if (type === 'NOTIFICATION_CLICKED') {
        const { targetId } = payload;
        if (targetId) {
          setHighlightedElement(targetId);
          setTimeout(() => setHighlightedElement(null), 3000);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [logHydration]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !vapidPublicKey) {
      setSubscriptionError('Push not supported or VAPID key not loaded');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        subscriptionRef.current = existingSubscription;
        setIsSubscribed(true);
        return true;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });

      subscriptionRef.current = subscription;
      
      // Send subscription to server
      const baseUrl = PUSH_SERVER_URL || '';
      const response = await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: userIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      // Save subscription to localStorage for persistence
      saveSubscription(subscription.toJSON(), userIdRef.current);
      console.log('💾 Saved push subscription to localStorage');

      setIsSubscribed(true);
      setSubscriptionError(null);
      console.log('✅ Subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Push subscription error:', error);
      setSubscriptionError(error instanceof Error ? error.message : 'Subscription failed');
      return false;
    }
  }, [vapidPublicKey]);

  // Enable alerts - request permission AND subscribe to push
  const enableAlerts = useCallback(async () => {
    if (!('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      localStorage.setItem('guardian-modal-seen', 'true');
      setShowPermissionModal(false);

      // Subscribe to push after permission is granted
      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }, [subscribeToPush]);

  const clearHighlight = useCallback(() => {
    setHighlightedElement(null);
  }, []);

  // Send immediate notification (for foreground notifications)
  const sendNotification = useCallback(async (notificationKey: NotificationKey, snoreScore?: number) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'GUARDIAN_NOTIFICATION',
        payload: { notificationKey, snoreScore },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [permission]);

  // Schedule notification - stores locally AND sends to server for background push (works when browser closed)
  const scheduleNotification = useCallback(async (
    notificationKey: NotificationKey,
    scheduledTime: Date,
    snoreScore?: number
  ) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const id = `${notificationKey}-${scheduledTime.getTime()}`;
      const timeStr = `${scheduledTime.getHours().toString().padStart(2, '0')}:${scheduledTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Store locally in Service Worker for when browser is open
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
          id,
          notificationKey,
          scheduledTime: scheduledTime.toISOString(),
          snoreScore,
        },
      });
      
      // Also send to server for background push (works when browser is closed)
      try {
        const baseUrl = PUSH_SERVER_URL || '';
        await fetch(`${baseUrl}/.netlify/functions/push-notifications/api/schedule-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: notificationKey,
            time: timeStr,
            snoreScore,
            userId: userIdRef.current,
          }),
        });
        console.log(`Guardian: Sent ${notificationKey} at ${timeStr} to server for background push`);
        
        // Also save to localStorage so we can restore after cold start
        const stored = getStoredSchedule() || [];
        const existingIndex = stored.findIndex(item => item.key === notificationKey);
        const item = { key: notificationKey, time: timeStr, snoreScore };
        if (existingIndex >= 0) {
          stored[existingIndex] = item;
        } else {
          stored.push(item);
        }
        saveScheduleToLocalStorage(stored);
      } catch (serverError) {
        console.warn('Failed to send schedule to server (will use local only):', serverError);
      }
      
      console.log(`Guardian: Scheduled ${notificationKey} for ${scheduledTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }, [permission]);

  // Clear scheduled notifications
  const clearScheduledNotifications = useCallback(async (date: string) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'CLEAR_SCHEDULED',
        payload: { date },
      });
      
      console.log(`Guardian: Cleared scheduled notifications for ${date}`);
    } catch (error) {
      console.error('Failed to clear scheduled notifications:', error);
    }
  }, []);

  return {
    permission,
    isSupported,
    showPermissionModal,
    setShowPermissionModal,
    enableAlerts,
    sendNotification,
    scheduleNotification,
    clearScheduledNotifications,
    loggedActions,
    highlightedElement,
    clearHighlight,
    isSubscribed,
    subscriptionError,
  };
}
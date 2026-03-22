import { useState, useEffect, useCallback } from 'react';
import { useHydrationLog } from './useHydrationLog';

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
}

export function useGuardianNotifications(): GuardianState {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [loggedActions, setLoggedActions] = useState<LoggedActions>({});
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  const { logHydration } = useHydrationLog();

  // Show modal on first load if permission not yet requested
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermission);
      // Show modal on first load if permission is default (not yet requested)
      if (Notification.permission === 'default') {
        // Check if this is first visit (stored in localStorage)
        const hasSeenModal = localStorage.getItem('guardian-modal-seen');
        if (!hasSeenModal) {
          setShowPermissionModal(true);
        }
      }
    }
  }, []);

  // Listen for messages from Service Worker (action clicks, notification clicks)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      
      if (type === 'ACTION_LOGGED') {
        const { notificationKey } = payload;
        setLoggedActions(prev => ({ ...prev, [notificationKey]: true }));
        // Also log hydration to main IndexedDB
        logHydration(notificationKey).catch(err => console.error('Failed to log hydration:', err));
        console.log(`Guardian: Action logged for ${notificationKey}`);
      } else if (type === 'NOTIFICATION_CLICKED') {
        const { targetId } = payload;
        if (targetId) {
          setHighlightedElement(targetId);
          // Auto-clear highlight after 3 seconds
          setTimeout(() => setHighlightedElement(null), 3000);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  const enableAlerts = useCallback(async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      // Mark that user has seen the modal
      localStorage.setItem('guardian-modal-seen', 'true');
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedElement(null);
  }, []);

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

  // Schedule a notification for background delivery (works even when app is closed)
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
      
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
          id,
          notificationKey,
          scheduledTime: scheduledTime.toISOString(),
          snoreScore,
        },
      });
      
      console.log(`Guardian: Scheduled ${notificationKey} for ${scheduledTime.toLocaleString()}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }, [permission]);

  // Clear scheduled notifications for a specific date
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
  };
}

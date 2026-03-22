import { BellOff, AlertTriangle, Shield, Zap, Droplets, Activity } from 'lucide-react';
import { useGuardianNotifications, type NotificationKey } from '../hooks/useGuardianNotifications';
import { useHealthOS } from '../context/HealthOSContext';
import { useEffect, useState, useMemo } from 'react';
import GuardianDashboard from './GuardianDashboard';

// Complete Guardian notification schedule based on user's target sleep time
function calculateGuardianSchedule(targetSleepTime: string): { key: NotificationKey; time: Date; label: string }[] {
  const [hours, minutes] = targetSleepTime.split(':').map(Number);
  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Sleep target time
  let sleepTarget = new Date(baseDate);
  sleepTarget.setHours(hours, minutes, 0, 0);
  
  // If sleep time is in the past, use tomorrow
  if (sleepTarget.getTime() <= now.getTime()) {
    sleepTarget.setDate(sleepTarget.getDate() + 1);
  }

  const schedule: { key: NotificationKey; time: Date; label: string }[] = [
    // 09:15 AM - Airway Reset
    { key: 'airway-reset', time: new Date(new Date(baseDate).setHours(9, 15, 0, 0)), label: 'Airway Reset' },
    // 11:00 AM - Caffeine Cutoff
    { key: 'caffeine-cutoff', time: new Date(new Date(baseDate).setHours(11, 0, 0, 0)), label: 'Caffeine Cutoff' },
    // 11:15 AM - Micro-Hydration
    { key: 'micro-hydration-11-15', time: new Date(new Date(baseDate).setHours(11, 15, 0, 0)), label: 'Micro-Hydration' },
    // 01:15 PM - Micro-Hydration
    { key: 'micro-hydration-13-15', time: new Date(new Date(baseDate).setHours(13, 15, 0, 0)), label: 'Micro-Hydration' },
    // 02:00 PM - Lunch Time
    { key: 'lunch-time', time: new Date(new Date(baseDate).setHours(14, 0, 0, 0)), label: 'Lunch Time' },
    // 03:15 PM - Micro-Hydration
    { key: 'micro-hydration-15-15', time: new Date(new Date(baseDate).setHours(15, 15, 0, 0)), label: 'Micro-Hydration' },
    // 05:15 PM - Micro-Hydration
    { key: 'micro-hydration-17-15', time: new Date(new Date(baseDate).setHours(17, 15, 0, 0)), label: 'Micro-Hydration' },
    // 07:15 PM - Final Big Hydration
    { key: 'final-hydration', time: new Date(new Date(baseDate).setHours(19, 15, 0, 0)), label: 'Final Hydration' },
    // 09:30 PM - Dinner Time
    { key: 'dinner-time', time: new Date(new Date(baseDate).setHours(21, 30, 0, 0)), label: 'Dinner Time' },
    // 10:00 PM - Kitchen Closed
    { key: 'kitchen-closed', time: new Date(new Date(sleepTarget).getTime() - 3 * 60 * 60 * 1000), label: 'Kitchen Closed' },
    // 11:00 PM - Fluid Stop
    { key: 'fluid-stop', time: new Date(new Date(sleepTarget).getTime() - 2 * 60 * 60 * 1000), label: 'Fluid Stop' },
    // 11:15 PM - SnoreGym
    { key: 'snoregym-reminder', time: new Date(new Date(sleepTarget).getTime() - 1.75 * 60 * 60 * 1000), label: 'SnoreGym' },
    // 01:00 AM - Bedtime
    { key: 'bedtime-position', time: sleepTarget, label: 'Sleep Time' },
  ];

  return schedule;
}

export default function GuardianAlerts() {
  const { permission, isSupported, enableAlerts, scheduleNotification, clearScheduledNotifications, loggedActions } = useGuardianNotifications();
  const { targetSleepTime, latestMetric } = useHealthOS();
  const [scheduledCount, setScheduledCount] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);

  // Memoize the schedule to avoid recalculating on every render
  const schedule = useMemo(() => {
    if (!targetSleepTime) return [];
    return calculateGuardianSchedule(targetSleepTime);
  }, [targetSleepTime]);

  // Schedule notifications when permission is granted
  useEffect(() => {
    if (permission !== 'granted' || schedule.length === 0) return;

    const scheduleAllNotifications = async () => {
      const today = new Date().toISOString().split('T')[0];
      const snoreScore = latestMetric?.snoreScore;
      
      // Clear previous day's notifications first
      await clearScheduledNotifications(today);
      
      // Schedule all notifications for background delivery
      let count = 0;
      for (const { key, time } of schedule) {
        // Only schedule future notifications
        if (time.getTime() > Date.now()) {
          await scheduleNotification(key, time, snoreScore);
          count++;
        }
      }
      setScheduledCount(count);
      console.log(`Guardian: Scheduled ${count} background notifications for today`);
    };

    scheduleAllNotifications();
  }, [permission, schedule, latestMetric, scheduleNotification, clearScheduledNotifications]);

  if (!isSupported) return null;

  const handleDashboardClick = () => {
    setShowDashboard(true);
  };

  // Count logged actions
  const loggedCount = Object.values(loggedActions).filter(Boolean).length;

  if (permission === 'granted') {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDashboardClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-teal/10 border border-accent-teal/20 hover:bg-accent-teal/20 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-accent-teal" />
            <span className="text-xs font-medium text-accent-teal">
              Guardian
            </span>
          </button>
          {scheduledCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-overlay">
              <Zap className="w-3 h-3 text-accent-cyan" />
              <span className="text-[10px] text-text-muted font-mono">{scheduledCount}</span>
            </div>
          )}
          {loggedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent-violet/10">
              <Droplets className="w-3 h-3 text-accent-violet" />
              <span className="text-[10px] text-accent-violet font-mono">{loggedCount}</span>
            </div>
          )}
          <button
            onClick={handleDashboardClick}
            className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer"
            title="Open Guardian Dashboard"
          >
            <Activity className="w-4 h-4 text-text-muted hover:text-accent-cyan" />
          </button>
        </div>
        <GuardianDashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
      </>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20">
        <AlertTriangle className="w-4 h-4 text-accent-red" />
        <span className="text-xs font-medium text-accent-red">Alerts Blocked</span>
      </div>
    );
  }

  return (
    <button
      onClick={enableAlerts}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-colors cursor-pointer"
    >
      <BellOff className="w-4 h-4 text-accent-cyan" />
      <span className="text-xs font-medium text-accent-cyan">Enable Alerts</span>
    </button>
  );
}

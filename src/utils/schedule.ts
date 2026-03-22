import type { CutoffTimer } from '../types';

export function getNextOccurrence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

export function computeCutoffTime(sleepTarget: Date, offsetHours: number, offsetMinutes: number): Date {
  return new Date(sleepTarget.getTime() - (offsetHours * 60 + offsetMinutes) * 60 * 1000);
}

export function buildTimers(targetSleepTime: string): CutoffTimer[] {
  const sleepTarget = getNextOccurrence(targetSleepTime);

  return [
    {
      id: 'caffeine',
      label: 'Caffeine Deadzone',
      icon: 'coffee',
      offsetHours: 14,
      offsetMinutes: 0,
      cutoffTime: computeCutoffTime(sleepTarget, 14, 0),
      color: 'cyan',
    },
    {
      id: 'kitchen',
      label: 'Kitchen Closed',
      icon: 'utensils-crossed',
      offsetHours: 2,
      offsetMinutes: 30,
      cutoffTime: computeCutoffTime(sleepTarget, 2, 30),
      color: 'amber',
    },
    {
      id: 'snoregym',
      label: 'SnoreGym Reminder',
      icon: 'dumbbell',
      offsetHours: 1,
      offsetMinutes: 45,
      cutoffTime: computeCutoffTime(sleepTarget, 1, 45),
      color: 'violet',
    },
  ];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatTimeShort(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

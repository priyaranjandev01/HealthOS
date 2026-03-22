import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useHealthData } from '../hooks/useHealthData';
import { useGuardianNotifications } from '../hooks/useGuardianNotifications';
import type { DailyProtocol, SleepMetric, Insight } from '../types';

interface HealthOSState {
  targetSleepTime: string;
  setTargetSleepTime: (time: string) => void;
  latestMetric: SleepMetric | undefined;
  upsertSleepMetric: (data: { date: string; snoreScore: number; breathFlowPercentage: number }) => Promise<void>;
  todayProtocol: DailyProtocol;
  toggleChecklistItem: (itemId: string) => Promise<void>;
  toggleRedZoneItem: (itemId: string) => Promise<void>;
  insights: Insight[];
  history: SleepMetric[];
  morningSyncAlert: boolean;
  saveDailyLog: (data: {
    protocol?: DailyProtocol;
    metric?: { date: string; snoreScore: number; breathFlowPercentage: number };
  }) => Promise<void>;
  getHistory: (limit: number) => Promise<SleepMetric[]>;
  highlightedElement: string | null;
  clearHighlight: () => void;
}

const HealthOSContext = createContext<HealthOSState | null>(null);

export function HealthOSProvider({ children }: { children: ReactNode }) {
  const [targetSleepTime, setTargetSleepTime] = useLocalStorage<string>('healthos-sleep-time', '01:00');
  
  // Get highlight state from Guardian notifications
  const { highlightedElement, clearHighlight } = useGuardianNotifications();

  const {
    todayProtocol,
    latestMetric,
    history,
    morningSyncAlert,
    upsertSleepMetric,
    saveDailyLog,
    getHistory,
    toggleChecklistItem,
    toggleRedZoneItem,
  } = useHealthData();

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    if (morningSyncAlert) {
      result.push({
        id: 'morning-sync',
        message: 'Morning Sync: High Airway Stress detected from last night — review your sleep protocol.',
        severity: 'critical',
      });
    }

    if (latestMetric && latestMetric.snoreScore > 100) {
      result.push({
        id: 'critical-snore',
        message: 'Critical Airway Stress Detected \u2014 Strictly follow the Red Zone protocol today.',
        severity: 'critical',
      });
    } else if (latestMetric && latestMetric.snoreScore > 70) {
      result.push({
        id: 'high-snore',
        message: 'High Airway Stress Detected \u2014 Check your 3-hour fasting window.',
        severity: 'critical',
      });
    }

    const redZoneTriggered = todayProtocol.redZoneItems?.some((i) => i.triggered) ?? false;
    if (redZoneTriggered) {
      result.push({
        id: 'redzone-trigger',
        message: 'Warning: Trigger detected. Expect a higher Snore Score tomorrow morning.',
        severity: 'warning',
      });
    }

    if (latestMetric && latestMetric.breathFlowPercentage < 50) {
      result.push({
        id: 'low-breathflow',
        message: 'Low BreathFlow detected. Consider SnoreGym exercises before bed.',
        severity: 'warning',
      });
    }

    const completedCount = todayProtocol.items.filter((i) => i.checked).length;
    if (completedCount === todayProtocol.items.length && todayProtocol.items.length > 0) {
      result.push({
        id: 'all-complete',
        message: 'All daily tasks completed. You\'re set for optimal recovery tonight.',
        severity: 'info',
      });
    } else if (completedCount === 0) {
      result.push({
        id: 'none-complete',
        message: 'No tasks completed today. Start your sleep protocol!',
        severity: 'warning',
      });
    }

    return result;
  }, [latestMetric, todayProtocol, todayProtocol.redZoneItems, morningSyncAlert]);

  const value = useMemo<HealthOSState>(
    () => ({
      targetSleepTime,
      setTargetSleepTime,
      latestMetric,
      upsertSleepMetric,
      todayProtocol,
      toggleChecklistItem,
      toggleRedZoneItem,
      insights,
      history,
      morningSyncAlert,
      saveDailyLog,
      getHistory,
      highlightedElement,
      clearHighlight,
    }),
    [
      targetSleepTime, setTargetSleepTime,
      latestMetric, upsertSleepMetric,
      todayProtocol, toggleChecklistItem, toggleRedZoneItem,
      insights, history, morningSyncAlert,
      saveDailyLog, getHistory,
      highlightedElement, clearHighlight,
    ]
  );

  return <HealthOSContext value={value}>{children}</HealthOSContext>;
}

export function useHealthOS(): HealthOSState {
  const ctx = useContext(HealthOSContext);
  if (!ctx) {
    throw new Error('useHealthOS must be used within a HealthOSProvider');
  }
  return ctx;
}

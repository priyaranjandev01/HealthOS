import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/healthDB';
import type { HydrationLog } from '../types';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

const HYDRATION_AMOUNTS: Record<string, number> = {
  'airway-reset': 500,
  'micro-hydration-11-15': 200,
  'micro-hydration-13-15': 200,
  'micro-hydration-15-15': 200,
  'micro-hydration-17-15': 200,
  'final-hydration': 400,
};

export function useHydrationLog() {
  const todayKey = getTodayKey();

  const todayLogs = useLiveQuery(
    () => db.hydrationLogs.where('date').equals(todayKey).toArray(),
    [todayKey]
  );

  const recentLogs = useLiveQuery(
    () => db.hydrationLogs.orderBy('timestamp').reverse().limit(30).toArray()
  );

  const logHydration = async (notificationKey: string): Promise<HydrationLog> => {
    const amount = HYDRATION_AMOUNTS[notificationKey] || 0;
    const log: HydrationLog = {
      id: `${notificationKey}-${Date.now()}`,
      date: todayKey,
      notificationKey,
      timestamp: Date.now(),
      amount,
    };
    await db.hydrationLogs.put(log);
    return log;
  };

  const getTotalHydrationToday = (): number => {
    return todayLogs?.reduce((sum, log) => sum + log.amount, 0) || 0;
  };

  const getHydrationCountToday = (): number => {
    return todayLogs?.length || 0;
  };

  return {
    todayLogs: todayLogs ?? [],
    recentLogs: recentLogs ?? [],
    logHydration,
    getTotalHydrationToday,
    getHydrationCountToday,
  };
}

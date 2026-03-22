import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/healthDB';
import type { DailyProtocol, SleepMetric, ChecklistItem, RedZoneItem } from '../types';

const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'caffeine-stop', label: 'Caffeine Stop' },
  { id: 'kitchen-closed', label: 'Kitchen Closed' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'mouth-gym', label: 'Mouth Gym' },
  { id: 'side-sleep', label: 'Side-Sleep' },
];

const DEFAULT_REDZONE_ITEMS: Omit<RedZoneItem, 'triggered'>[] = [
  { id: 'no-smoking', label: 'No Smoking', description: 'Irritates and swells throat tissues.', icon: 'cigarette' },
  { id: 'no-alcohol', label: 'No Alcohol', description: 'Over-relaxes throat muscles (causes "Unstable" flow).', icon: 'wine' },
  { id: 'no-late-dairy', label: 'No Late Dairy', description: 'No Milk/Paneer after 4 PM (prevents sticky mucus).', icon: 'milk' },
  { id: 'no-back-sleeping', label: 'No Back-Sleeping', description: 'Gravity collapses the airway. Left side only.', icon: 'bed' },
  { id: 'no-spicy-meals', label: 'No Spicy Night Meals', description: 'Prevents acid reflux that narrows the airway.', icon: 'flame' },
];

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function buildDefaultProtocol(): DailyProtocol {
  return {
    date: getTodayKey(),
    items: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false })),
    redZoneItems: DEFAULT_REDZONE_ITEMS.map((item) => ({ ...item, triggered: false })),
  };
}

function ensureRedZoneItems(protocol: DailyProtocol): DailyProtocol {
  if (protocol.redZoneItems && protocol.redZoneItems.length > 0) return protocol;
  return {
    ...protocol,
    redZoneItems: DEFAULT_REDZONE_ITEMS.map((item) => ({ ...item, triggered: false })),
  };
}

export function useHealthData() {
  const todayKey = getTodayKey();

  const todayProtocolRaw = useLiveQuery(
    () => db.dailyProtocols.get(todayKey),
    [todayKey]
  );

  const latestMetric = useLiveQuery(
    () => db.sleepMetrics.orderBy('date').reverse().first()
  );

  const history = useLiveQuery(
    () => db.sleepMetrics.orderBy('date').reverse().limit(7).toArray()
  );

  const todayProtocol: DailyProtocol = ensureRedZoneItems(todayProtocolRaw ?? buildDefaultProtocol());

  // --- Morning Sync Logic ---
  const [morningSyncAlert, setMorningSyncAlert] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      db.sleepMetrics
        .orderBy('date')
        .reverse()
        .first()
        .then((metric) => {
          if (metric && metric.snoreScore > 75) {
            setMorningSyncAlert(true);
          }
        });
    }
  }, []);

  // --- Mutations ---

  const upsertSleepMetric = useCallback(
    async (data: { date: string; snoreScore: number; breathFlowPercentage: number }) => {
      // Get today's protocol to calculate warriorScore
      const todayProtocol = await db.dailyProtocols.get(data.date);
      const completedCount = todayProtocol?.items?.filter(i => i.checked).length ?? 0;
      const triggeredCount = todayProtocol?.redZoneItems?.filter(i => i.triggered).length ?? 0;
      const warriorScore = Math.max(0, Math.min(100, (completedCount * 20) - (triggeredCount * 20)));

      const metric: SleepMetric = {
        date: data.date,
        snoreScore: data.snoreScore,
        breathFlowPercentage: data.breathFlowPercentage,
        isUnstable: data.snoreScore > 75,
        timestamp: Date.now(),
        warriorScore,
      };
      await db.sleepMetrics.put(metric);
    },
    []
  );

  const saveDailyLog = useCallback(
    async (data: {
      protocol?: DailyProtocol;
      metric?: { date: string; snoreScore: number; breathFlowPercentage: number };
    }) => {
      await db.transaction('rw', db.dailyProtocols, db.sleepMetrics, async () => {
        if (data.protocol) {
          await db.dailyProtocols.put(data.protocol);
        }
        if (data.metric) {
          // Get today's protocol to calculate warriorScore
          const todayProtocol = await db.dailyProtocols.get(data.metric.date);
          const completedCount = todayProtocol?.items?.filter(i => i.checked).length ?? 0;
          const triggeredCount = todayProtocol?.redZoneItems?.filter(i => i.triggered).length ?? 0;
          const warriorScore = Math.max(0, Math.min(100, (completedCount * 20) - (triggeredCount * 20)));

          await db.sleepMetrics.put({
            ...data.metric,
            isUnstable: data.metric.snoreScore > 75,
            timestamp: Date.now(),
            warriorScore,
          });
        }
      });
    },
    []
  );

  const getHistory = useCallback(
    async (limit: number): Promise<SleepMetric[]> => {
      return db.sleepMetrics.orderBy('date').reverse().limit(limit).toArray();
    },
    []
  );

  const toggleChecklistItem = useCallback(
    async (itemId: string) => {
      const current = await db.dailyProtocols.get(todayKey);
      const protocol = ensureRedZoneItems(current ?? buildDefaultProtocol());
      const updatedItems = protocol.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      const completedCount = updatedItems.filter(i => i.checked).length;
      const triggeredCount = protocol.redZoneItems.filter(i => i.triggered).length;
      const warriorScore = Math.max(0, Math.min(100, (completedCount * 20) - (triggeredCount * 20)));
      const updated: DailyProtocol = {
        ...protocol,
        date: todayKey,
        items: updatedItems,
        warriorScore,
      };
      await db.dailyProtocols.put(updated);
    },
    [todayKey]
  );

  const toggleRedZoneItem = useCallback(
    async (itemId: string) => {
      const current = await db.dailyProtocols.get(todayKey);
      const protocol = ensureRedZoneItems(current ?? buildDefaultProtocol());
      const updatedRedZoneItems = protocol.redZoneItems.map((item) =>
        item.id === itemId ? { ...item, triggered: !item.triggered } : item
      );
      const completedCount = protocol.items.filter(i => i.checked).length;
      const triggeredCount = updatedRedZoneItems.filter(i => i.triggered).length;
      const warriorScore = Math.max(0, Math.min(100, (completedCount * 20) - (triggeredCount * 20)));
      const updated: DailyProtocol = {
        ...protocol,
        date: todayKey,
        redZoneItems: updatedRedZoneItems,
        warriorScore,
      };
      await db.dailyProtocols.put(updated);
    },
    [todayKey]
  );

  return {
    todayProtocol,
    latestMetric,
    history: history ?? [],
    morningSyncAlert,
    upsertSleepMetric,
    saveDailyLog,
    getHistory,
    toggleChecklistItem,
    toggleRedZoneItem,
  };
}

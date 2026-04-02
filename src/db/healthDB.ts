import Dexie, { type Table } from 'dexie';
import type { DailyProtocol, SleepMetric, HydrationLog, GymLog } from '../types';

export class HealthOSDatabase extends Dexie {
  dailyProtocols!: Table<DailyProtocol, string>;
  sleepMetrics!: Table<SleepMetric, string>;
  hydrationLogs!: Table<HydrationLog, string>;
  gymLogs!: Table<GymLog, string>;

  constructor() {
    super('HealthOS_DB');
    this.version(3).stores({
      dailyProtocols: 'date',
      sleepMetrics: 'date',
      hydrationLogs: 'id, date, notificationKey, timestamp',
      gymLogs: 'id, date, dayNumber, timestamp',
    });
  }
}

export const db = new HealthOSDatabase();

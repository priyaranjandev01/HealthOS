import Dexie, { type Table } from 'dexie';
import type { DailyProtocol, SleepMetric, HydrationLog } from '../types';

export class HealthOSDatabase extends Dexie {
  dailyProtocols!: Table<DailyProtocol, string>;
  sleepMetrics!: Table<SleepMetric, string>;
  hydrationLogs!: Table<HydrationLog, string>;

  constructor() {
    super('HealthOS_DB');
    this.version(2).stores({
      dailyProtocols: 'date',
      sleepMetrics: 'date',
      hydrationLogs: 'id, date, notificationKey, timestamp',
    });
  }
}

export const db = new HealthOSDatabase();

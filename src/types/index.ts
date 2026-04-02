export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface RedZoneItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  triggered: boolean;
}

export interface DailyProtocol {
  date: string; // YYYY-MM-DD, primary key
  items: ChecklistItem[];
  redZoneItems: RedZoneItem[];
  mealTimestamp?: number;
  sleepTimestamp?: number;
  warriorScore?: number; // 0-100 calculated daily
}

export interface SleepMetric {
  date: string; // YYYY-MM-DD, primary key
  snoreScore: number;
  breathFlowPercentage: number;
  isUnstable: boolean;
  timestamp: number;
  warriorScore?: number; // Stored for historical tracking
}

export interface CutoffTimer {
  id: string;
  label: string;
  icon: string;
  offsetHours: number;
  offsetMinutes: number;
  cutoffTime: Date | null;
  color: string;
}

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  message: string;
  severity: InsightSeverity;
}

export interface HydrationLog {
  id: string;
  date: string; // YYYY-MM-DD
  notificationKey: string;
  timestamp: number;
  amount: number; // in ml
}

// Gym Tracker Types
export interface GymExercise {
  id: string;
  name: string;
  sets: number;
  completed: boolean;
}

export interface GymDay {
  dayNumber: number;
  dayName: string;
  focus: string;
  warmup: string;
  exercises: GymExercise[];
  isRestDay: boolean;
  completed: boolean;
  cardio?: { name: string; duration: string; completed: boolean }[];
}

export interface GymLog {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  completedExercises: string[]; // exercise IDs
  duration: number; // in minutes
  notes: string;
  timestamp: number;
}

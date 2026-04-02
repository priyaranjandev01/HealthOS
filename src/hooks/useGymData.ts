import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/healthDB';
import type { GymDay } from '../types';

// Weekly gym schedule based on user requirements
export const WEEKLY_GYM_SCHEDULE: GymDay[] = [
  {
    dayNumber: 1,
    dayName: 'Monday',
    focus: 'Back & Abs',
    warmup: '10 min Chinups',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'lat-pulldown', name: 'Lat Pull Down', sets: 4, completed: false },
      { id: 'reverse-lat-pulldown', name: 'Reverse Lat Pull Down', sets: 4, completed: false },
      { id: 'single-arm-rowing', name: 'Single Arm Rowing', sets: 3, completed: false },
      { id: 'dumbell-rowing', name: 'Dumbell Rowing', sets: 4, completed: false },
      { id: 'pull-over', name: 'Pull Over', sets: 4, completed: false },
      { id: 'deadlifts', name: 'Deadlifts', sets: 5, completed: false },
    ],
  },
  {
    dayNumber: 1,
    dayName: 'Monday (Abs)',
    focus: 'Abs',
    warmup: '',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'plank', name: 'Plank', sets: 3, completed: false },
      { id: 'crunches', name: 'Crunches', sets: 5, completed: false },
      { id: 'leg-raises', name: 'Leg Raises', sets: 5, completed: false },
      { id: 'mountain-climbing', name: 'Mountain Climbing', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 2,
    dayName: 'Tuesday',
    focus: 'Chest & Obliques',
    warmup: '10 min Pushups',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'incline-bench-dumbell', name: 'Incline Bench Press Dumbell', sets: 4, completed: false },
      { id: 'incline-fly', name: 'Incline Fly', sets: 4, completed: false },
      { id: 'decline-press', name: 'Decline Press', sets: 5, completed: false },
      { id: 'flat-chest-fly', name: 'Flat Chest Fly', sets: 3, completed: false },
      { id: 'flat-machine-press', name: 'Flat Machine Press Drop sets', sets: 3, completed: false },
      { id: 'peck-deck', name: 'Peck Deck', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 2,
    dayName: 'Tuesday (Obliques)',
    focus: 'Obliques',
    warmup: '',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'side-bending', name: 'Side Bending', sets: 4, completed: false },
      { id: 'side-crunches', name: 'Side Crunches', sets: 5, completed: false },
      { id: 'russian-twist', name: 'Russian Twist', sets: 3, completed: false },
      { id: 'cross-body-mountain', name: 'Cross Body Mountain Climbing', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 3,
    dayName: 'Wednesday',
    focus: 'Shoulders & Abs',
    warmup: '10 min',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'dumbell-shoulder-press', name: 'Dumbell Shoulder Press', sets: 4, completed: false },
      { id: 'lateral-raises', name: 'Lateral Raises', sets: 3, completed: false },
      { id: 'front-raises', name: 'Front Raises', sets: 3, completed: false },
      { id: 'arnold-press', name: 'Arnold Press', sets: 4, completed: false },
      { id: 'shoulder-twister', name: 'Shoulder Twister', sets: 4, completed: false },
      { id: 'shrugs', name: 'Shrugs', sets: 5, completed: false },
    ],
  },
  {
    dayNumber: 3,
    dayName: 'Wednesday (Abs)',
    focus: 'Abs',
    warmup: '',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'assisted-leg-raises', name: 'Assisted Leg Raises', sets: 4, completed: false },
      { id: 'lying-mountain-climbing', name: 'Lying Mountain Climbing', sets: 4, completed: false },
      { id: 'cable-crunches', name: 'Cable Crunches', sets: 3, completed: false },
      { id: 'burpees', name: 'Burpees', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 4,
    dayName: 'Thursday',
    focus: 'Rest Day',
    warmup: '',
    isRestDay: true,
    completed: false,
    exercises: [],
  },
  {
    dayNumber: 5,
    dayName: 'Friday',
    focus: 'Legs & Core',
    warmup: 'Free Squats 5 sets',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'weighted-squats', name: 'Weighted Squats (Dumbbell/Rod)', sets: 4, completed: false },
      { id: 'leg-extensions', name: 'Leg Extensions', sets: 4, completed: false },
      { id: 'leg-press', name: 'Leg Press', sets: 5, completed: false },
      { id: 'hack-squats', name: 'Hack Squats', sets: 4, completed: false },
      { id: 'lunges', name: 'Lunges', sets: 5, completed: false },
      { id: 'single-leg-press', name: 'Single Leg Press', sets: 4, completed: false },
      { id: 'calves-raises', name: 'Calves Raises', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 5,
    dayName: 'Friday (Core)',
    focus: 'Core',
    warmup: '',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'elevated-stand-ups', name: 'Elevated Stand ups', sets: 4, completed: false },
      { id: 'mountain-climbing-core', name: 'Mountain Climbing', sets: 4, completed: false },
      { id: 'burpees-core', name: 'Burpees', sets: 4, completed: false },
      { id: 'plank-core', name: 'Plank', sets: 4, completed: false },
    ],
  },
  {
    dayNumber: 6,
    dayName: 'Saturday',
    focus: 'Arms & Cardio',
    warmup: '',
    isRestDay: false,
    completed: false,
    exercises: [
      { id: 'wide-grip-biceps-curl', name: 'Wide Grip Biceps Curl', sets: 4, completed: false },
      { id: 'dumbell-biceps-curl', name: 'Dumbell Biceps Curl', sets: 3, completed: false },
      { id: 'concentration-curl', name: 'Concentration Curl', sets: 4, completed: false },
      { id: 'hammer-curl', name: 'Hammer Curl', sets: 5, completed: false },
      { id: 'triceps-overhead-extension', name: 'Triceps Overhead Extension Dumbell', sets: 4, completed: false },
      { id: 'rope-pushdown', name: 'Rope Pushdown', sets: 4, completed: false },
      { id: 'reverse-pushdown', name: 'Reverse Pushdown', sets: 4, completed: false },
      { id: 'skull-crusher', name: 'Skull Crusher', sets: 5, completed: false },
      { id: 'back-pushups', name: 'Back Pushups', sets: 5, completed: false },
    ],
    cardio: [
      { name: 'Farmer Walk', duration: '5 min', completed: false },
      { name: 'Cycling', duration: '10 min', completed: false },
      { name: 'Cross Trainer', duration: '10 min', completed: false },
      { name: 'Threadmill', duration: '5 min', completed: false },
    ],
  },
  {
    dayNumber: 7,
    dayName: 'Sunday',
    focus: 'Rest Day',
    warmup: '',
    isRestDay: true,
    completed: false,
    exercises: [],
  },
];

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDayOfWeek(): number {
  return new Date().getDay() === 0 ? 7 : new Date().getDay();
}

export function useGymData() {
  const todayKey = getTodayKey();
  const dayOfWeek = getDayOfWeek();

  const todayGymLog = useLiveQuery(
    () => db.gymLogs.get(todayKey),
    [todayKey]
  );

  const gymHistory = useLiveQuery(
    () => db.gymLogs.orderBy('date').reverse().limit(7).toArray(),
  );

  const currentDaySchedule = WEEKLY_GYM_SCHEDULE.filter(d => d.dayNumber === dayOfWeek);

  // Get gym log for a specific date
  const getGymLogForDate = useCallback(
    async (dateKey: string) => {
      return await db.gymLogs.get(dateKey);
    },
    []
  );

  // Fetch all gym logs for this week
  const weekStart = new Date();
  const currentDayOfWeek = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (currentDayOfWeek - 1));
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const weeklyLogs = useLiveQuery(
    () => db.gymLogs.where('date').between(weekStartStr, todayKey).toArray(),
    [weekStartStr, todayKey]
  );

  // Get weekly stats - completion for each day of the week
  const getWeeklyStats = useCallback(() => {
    const stats: { dayNumber: number; completed: number; total: number; percentage: number }[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      const currentDay = today.getDay() || 7;
      const diff = currentDay - i;
      if (diff >= 0) {
        date.setDate(date.getDate() - diff);
      } else {
        date.setDate(date.getDate() + Math.abs(diff));
      }
      const dateKey = date.toISOString().split('T')[0];
      
      // Get schedule for this day
      const daySchedule = WEEKLY_GYM_SCHEDULE.filter(d => d.dayNumber === i);
      const totalExercises = daySchedule.reduce((sum, day) => sum + day.exercises.length, 0);
      
      // Find this day's log from weekly logs
      const dayLog = weeklyLogs?.find(log => log.date === dateKey);
      const completed = dayLog?.completedExercises.length || 0;
      const percentage = totalExercises > 0 ? Math.round((completed / totalExercises) * 100) : 0;
      
      stats.push({ dayNumber: i, completed, total: totalExercises, percentage });
    }
    
    return stats;
  }, [weeklyLogs]);

  const toggleExerciseCompletion = useCallback(
    async (exerciseId: string) => {
      const existing = await db.gymLogs.get(todayKey);
      
      if (existing) {
        const completedExercises = existing.completedExercises.includes(exerciseId)
          ? existing.completedExercises.filter(id => id !== exerciseId)
          : [...existing.completedExercises, exerciseId];
        
        await db.gymLogs.put({
          ...existing,
          completedExercises,
          timestamp: Date.now(),
        });
      } else {
        await db.gymLogs.put({
          id: todayKey,
          date: todayKey,
          dayNumber: dayOfWeek,
          completedExercises: [exerciseId],
          duration: 0,
          notes: '',
          timestamp: Date.now(),
        });
      }
    },
    [todayKey, dayOfWeek]
  );

  const toggleCardioCompletion = useCallback(
    async (cardioName: string) => {
      const existing = await db.gymLogs.get(todayKey);
      
      // Parse existing cardio data or start fresh
      let currentCardio: { name: string; duration: string; completed: boolean }[] = [];
      if (existing?.notes) {
        try {
          const parsed = JSON.parse(existing.notes);
          currentCardio = parsed.cardio || [];
        } catch {
          currentCardio = [];
        }
      }
      
      // Find if this cardio item already exists
      const existingIndex = currentCardio.findIndex(c => c.name === cardioName);
      
      let updatedCardio: { name: string; duration: string; completed: boolean }[];
      if (existingIndex >= 0) {
        // Toggle the completion status
        updatedCardio = currentCardio.map((c, i) => 
          i === existingIndex ? { ...c, completed: !c.completed } : c
        );
      } else {
        // Add new cardio item (find duration from schedule)
        const saturdaySchedule = WEEKLY_GYM_SCHEDULE.find(d => d.dayNumber === 6 && d.cardio);
        const cardioItem = saturdaySchedule?.cardio?.find(c => c.name === cardioName);
        updatedCardio = [...currentCardio, { name: cardioName, duration: cardioItem?.duration || '0 min', completed: true }];
      }
      
      if (existing) {
        await db.gymLogs.put({
          ...existing,
          notes: JSON.stringify({ cardio: updatedCardio }),
          timestamp: Date.now(),
        });
      } else {
        await db.gymLogs.put({
          id: todayKey,
          date: todayKey,
          dayNumber: dayOfWeek,
          completedExercises: [],
          duration: 0,
          notes: JSON.stringify({ cardio: updatedCardio }),
          timestamp: Date.now(),
        });
      }
    },
    [todayKey, dayOfWeek]
  );

  const getTodayStats = useCallback(() => {
    if (!todayGymLog) return null;
    
    const completedCount = todayGymLog.completedExercises.length;
    const totalExercises = currentDaySchedule.reduce((sum, day) => sum + day.exercises.length, 0);
    const percentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
    
    let cardioCompleted = 0;
    let cardioTotal = 0;
    if (todayGymLog.notes) {
      try {
        const parsed = JSON.parse(todayGymLog.notes);
        if (parsed.cardio) {
          cardioTotal = parsed.cardio.length;
          cardioCompleted = parsed.cardio.filter((c: { completed: boolean }) => c.completed).length;
        }
      } catch {}
    }
    
    return {
      completedExercises: completedCount,
      totalExercises,
      percentage,
      cardioCompleted,
      cardioTotal,
    };
  }, [todayGymLog, currentDaySchedule]);

  return {
    currentDaySchedule,
    todayGymLog,
    gymHistory,
    toggleExerciseCompletion,
    toggleCardioCompletion,
    getTodayStats,
    getGymLogForDate,
    getWeeklyStats,
  };
}

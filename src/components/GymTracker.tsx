import { Dumbbell, Check, X, Flame, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useGymData, WEEKLY_GYM_SCHEDULE } from '../hooks/useGymData';

export default function GymTracker() {
  const { 
    currentDaySchedule, 
    todayGymLog, 
    toggleExerciseCompletion, 
    toggleCardioCompletion,
    getTodayStats,
    getWeeklyStats
  } = useGymData();
  
  const [expandedDays, setExpandedDays] = useState<number[]>([new Date().getDay() || 7]);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  
  const weeklyStats = getWeeklyStats();
  
  const stats = getTodayStats();
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[today.getDay()];
  
  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev => 
      prev.includes(dayNum) 
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum]
    );
  };
  
  const isExerciseCompleted = (exerciseId: string) => {
    return todayGymLog?.completedExercises.includes(exerciseId) || false;
  };
  
  const isCardioCompleted = (cardioName: string) => {
    if (!todayGymLog?.notes) return false;
    try {
      const cardioData = JSON.parse(todayGymLog.notes).cardio || [];
      return cardioData.some((c: { name: string; completed: boolean }) => c.name === cardioName && c.completed);
    } catch {
      return false;
    }
  };
  
  const displayDays = viewMode === 'week' 
    ? WEEKLY_GYM_SCHEDULE.filter((_, index) => {
        // Get unique day numbers to avoid duplicates
        const dayNum = WEEKLY_GYM_SCHEDULE[index].dayNumber;
        return WEEKLY_GYM_SCHEDULE.findIndex(d => d.dayNumber === dayNum) === index;
      })
    : currentDaySchedule;
  
  const renderExercise = (exercise: { id: string; name: string; sets: number }) => {
    const completed = isExerciseCompleted(exercise.id);
    return (
      <button
        key={exercise.id}
        onClick={() => toggleExerciseCompletion(exercise.id)}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-left transition-all duration-200 ${
          completed 
            ? 'bg-accent-teal/10 border border-accent-teal/20' 
            : 'bg-surface-overlay hover:bg-surface-overlay/80 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-200 ${
            completed
              ? 'bg-accent-teal border-accent-teal'
              : 'border-border-accent bg-transparent'
          }`}>
            {completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
          <div>
            <p className={`text-sm font-medium transition-all duration-200 ${
              completed ? 'text-text-muted line-through' : 'text-text-primary'
            }`}>
              {exercise.name}
            </p>
            <p className={`text-xs ${completed ? 'text-accent-teal' : 'text-text-muted'}`}>
              {exercise.sets} sets
            </p>
          </div>
        </div>
        {completed && (
          <span className="text-xs font-medium text-accent-teal">Done</span>
        )}
      </button>
    );
  };
  
  const renderCardioSection = (cardio: { name: string; duration: string; completed: boolean }[]) => (
    <div className="mt-4 pt-4 border-t border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-accent-amber" />
        <h4 className="text-sm font-semibold text-text-primary">Cardio</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cardio.map((item) => {
          const completed = isCardioCompleted(item.name);
          return (
            <button
              key={item.name}
              onClick={() => toggleCardioCompletion(item.name)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                completed
                  ? 'bg-accent-amber/10 border border-accent-amber/20'
                  : 'bg-surface-overlay hover:bg-surface-overlay/80 border border-transparent'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                completed ? 'bg-accent-amber border-accent-amber' : 'border-border-accent'
              }`}>
                {completed && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {item.name}
                </p>
                <p className="text-[10px] text-text-muted">{item.duration}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
  
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-amber/10">
            <Dumbbell className="w-4 h-4 text-accent-amber" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Gym Tracker</h2>
            <p className="text-xs text-text-muted">{currentDayName} - {currentDaySchedule[0]?.focus || 'Rest Day'}</p>
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-mono text-text-muted">
              {stats.completedExercises}/{stats.totalExercises}
            </span>
          </div>
        )}
      </div>
      
      {stats && stats.totalExercises > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-surface-raised border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Today's Progress</span>
            <span className="text-sm font-bold text-accent-teal">{stats.percentage}%</span>
          </div>
          <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-amber to-accent-teal transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          {stats.cardioTotal > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-accent-amber" />
              <span className="text-xs text-text-muted">
                Cardio: {stats.cardioCompleted}/{stats.cardioTotal}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
        {displayDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border-b border-border-subtle last:border-b-0">
            <button
              onClick={() => !day.isRestDay && toggleDay(day.dayNumber)}
              className={`flex items-center justify-between w-full px-5 py-4 text-left hover:bg-surface-overlay/40 transition-colors ${
                day.isRestDay ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  day.isRestDay ? 'bg-surface-overlay' : 'bg-accent-amber/10'
                }`}>
                  {day.isRestDay ? (
                    <X className="w-5 h-5 text-text-muted" />
                  ) : (
                    <Dumbbell className="w-5 h-5 text-accent-amber" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{day.dayName}</h3>
                  <p className="text-xs text-text-muted">{day.focus}</p>
                </div>
              </div>
              {!day.isRestDay && (
                <div className="flex items-center gap-2">
                  {day.warmup && (
                    <span className="text-[10px] text-text-muted bg-surface-overlay px-2 py-1 rounded">
                      {day.warmup}
                    </span>
                  )}
                  {expandedDays.includes(day.dayNumber) ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              )}
            </button>
            
            {!day.isRestDay && expandedDays.includes(day.dayNumber) && (
              <div className="px-4 pb-4 space-y-2">
                {day.exercises.map((exercise) => renderExercise(exercise))}
                {day.cardio && renderCardioSection(day.cardio)}
              </div>
            )}
            
            {day.isRestDay && (
              <div className="px-5 pb-5">
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-overlay flex items-center justify-center mb-3">
                    <X className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-sm text-text-muted">Rest Day - Recover and prepare</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* View Mode Toggle */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setViewMode('today')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'today'
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          Today's Workout
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          Weekly Overview
        </button>
      </div>

      {/* Weekly Progress Bar */}
      {viewMode === 'week' && (
        <div className="mt-4 p-4 rounded-xl bg-surface-raised border border-border-subtle">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Weekly Progress</h4>
          <div className="flex gap-2">
            {weeklyStats.map((stat) => {
              const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const isRestDay = stat.total === 0;
              return (
                <div key={stat.dayNumber} className="flex-1 text-center">
                  <div className={`h-16 rounded-lg flex items-end justify-center mb-2 ${
                    isRestDay ? 'bg-surface-overlay' : 
                    stat.percentage >= 80 ? 'bg-accent-teal/20' :
                    stat.percentage >= 50 ? 'bg-accent-amber/20' :
                    'bg-surface-overlay'
                  }`}>
                    {!isRestDay && (
                      <div 
                        className="w-full rounded-lg bg-gradient-to-t from-accent-amber to-accent-teal transition-all"
                        style={{ height: `${stat.percentage}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">{dayNames[stat.dayNumber]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
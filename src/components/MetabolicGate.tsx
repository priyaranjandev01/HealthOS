import { useMemo, useState, useEffect } from 'react';
import { Moon, Clock } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';
import { buildTimers, formatTimeShort } from '../utils/schedule';
import TimerCard from './TimerCard';

export default function MetabolicGate() {
  const { targetSleepTime, setTargetSleepTime } = useHealthOS();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);
  const timers = useMemo(() => buildTimers(targetSleepTime), [targetSleepTime, tick]);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
          <Clock className="w-4 h-4 text-accent-cyan" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Metabolic Gate Engine</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 rounded-xl bg-surface-raised border border-border-subtle">
        <div className="flex items-center gap-3">
          <Moon className="w-5 h-5 text-accent-violet" />
          <label htmlFor="sleep-target" className="text-sm font-medium text-text-secondary whitespace-nowrap">
            Target Sleep Time
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="sleep-target"
            type="time"
            value={targetSleepTime}
            onChange={(e) => setTargetSleepTime(e.target.value)}
            className="bg-surface-overlay border border-border-accent rounded-lg px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 transition-all"
          />
          <span className="text-xs text-text-muted">
            {formatTimeShort(targetSleepTime)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {timers.map((timer) => (
          <TimerCard key={timer.id} timer={timer} />
        ))}
      </div>
    </section>
  );
}

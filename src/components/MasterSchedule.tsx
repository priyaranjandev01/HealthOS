import { CalendarDays } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';

interface ScheduleRow {
  time: string;
  activity: string;
  rule: string;
}

const SCHEDULE: ScheduleRow[] = [
  { time: '09:30 AM', activity: 'GYM Workout', rule: 'Cardio to firm airway.' },
  { time: '11:00 AM', activity: 'Post-Gym Brunch', rule: 'Last Caffeine Window.' },
  { time: '12:00 PM', activity: 'Office Starts', rule: 'Deep work focus.' },
  { time: '02:00 PM', activity: 'Simple Lunch', rule: 'Light & Clean (No heavy oils).' },
  { time: '09:30 PM', activity: 'Dinner Time', rule: 'Light & Lean (No Dairy/Spices).' },
  { time: '11:15 PM', activity: 'SnoreGym', rule: '15 min Airway Activation.' },
  { time: '01:00 AM', activity: 'SLEEP', rule: 'Left-Side Only (Prop head 4").' },
];

export default function MasterSchedule() {
  const { highlightedElement } = useHealthOS();

  const isHighlighted = (id: string) => highlightedElement === `schedule-${id}`;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-violet/10">
          <CalendarDays className="w-4 h-4 text-accent-violet" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          📅 Master Schedule
          <span className="text-xs font-normal text-text-muted ml-2">(Mon–Fri)</span>
        </h2>
      </div>

      <div className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-overlay/50">
                <th className="text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold px-5 py-3 w-28">Time</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold px-5 py-3 w-40">Activity</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold px-5 py-3">Rule / Benefit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {SCHEDULE.map((row, index) => {
                const activityId = index === 3 ? 'lunch' : index === 4 ? 'dinner' : null;
                return (
                <tr
                  key={row.time}
                  className={`hover:bg-surface-overlay/40 transition-colors group ${
                    activityId && isHighlighted(activityId) 
                      ? 'bg-accent-violet/20 ring-2 ring-accent-violet animate-pulse' 
                      : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-mono font-bold text-accent-cyan">{row.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-text-primary">{row.activity}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-text-secondary">{row.rule}</span>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

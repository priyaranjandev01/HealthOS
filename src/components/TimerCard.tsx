import { Coffee, UtensilsCrossed, Dumbbell, type LucideIcon } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import { formatTime } from '../utils/schedule';
import type { CutoffTimer } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  'coffee': Coffee,
  'utensils-crossed': UtensilsCrossed,
  'dumbbell': Dumbbell,
};

const COLOR_MAP: Record<string, { ring: string; text: string; bg: string; glow: string }> = {
  cyan: {
    ring: 'ring-accent-cyan/30',
    text: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.08)]',
  },
  amber: {
    ring: 'ring-accent-amber/30',
    text: 'text-accent-amber',
    bg: 'bg-accent-amber/10',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.08)]',
  },
  violet: {
    ring: 'ring-accent-violet/30',
    text: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
    glow: 'shadow-[0_0_24px_rgba(167,139,250,0.08)]',
  },
};

interface TimerCardProps {
  timer: CutoffTimer;
}

export default function TimerCard({ timer }: TimerCardProps) {
  const countdown = useCountdown(timer.cutoffTime);
  const Icon = ICON_MAP[timer.icon] ?? Coffee;
  const colors = COLOR_MAP[timer.color] ?? COLOR_MAP.cyan;

  return (
    <div
      className={`relative rounded-2xl bg-surface-raised border border-border-subtle p-5 ring-1 ${colors.ring} ${colors.glow} transition-all duration-300 hover:border-border-accent group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {countdown.isPassed ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-red/15 text-accent-red tracking-wide uppercase">
            Passed
          </span>
        ) : (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} tracking-wide uppercase`}>
            Active
          </span>
        )}
      </div>

      <h3 className="text-sm font-medium text-text-secondary mb-1">{timer.label}</h3>

      <p className={`text-3xl font-mono font-bold tracking-tight mb-2 tabular-nums ${countdown.isPassed ? 'text-text-muted' : colors.text}`}>
        {countdown.display}
      </p>

      <p className="text-xs text-text-muted">
        Hard cutoff at{' '}
        <span className="text-text-secondary font-medium">
          {timer.cutoffTime ? formatTime(timer.cutoffTime) : '--:--'}
        </span>
      </p>

      <div
        className={`absolute bottom-0 left-4 right-4 h-px transition-opacity duration-300 ${
          countdown.isPassed ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: `linear-gradient(90deg, transparent, var(--color-accent-${timer.color}), transparent)`,
        }}
      />
    </div>
  );
}

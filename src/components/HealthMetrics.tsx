import { AlertTriangle, Info, ShieldCheck, Brain } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';
import type { InsightSeverity } from '../types';

const SEVERITY_STYLES: Record<InsightSeverity, { icon: typeof AlertTriangle; bg: string; border: string; text: string }> = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-accent-red/10',
    border: 'border-accent-red/25',
    text: 'text-accent-red',
  },
  warning: {
    icon: Info,
    bg: 'bg-accent-amber/10',
    border: 'border-accent-amber/25',
    text: 'text-accent-amber',
  },
  info: {
    icon: ShieldCheck,
    bg: 'bg-accent-teal/10',
    border: 'border-accent-teal/25',
    text: 'text-accent-teal',
  },
};

export default function HealthMetrics() {
  const { insights } = useHealthOS();

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-amber/10">
          <Brain className="w-4 h-4 text-accent-amber" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Insights</h2>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="rounded-xl bg-surface-raised border border-border-subtle p-5 text-center">
            <p className="text-sm text-text-muted">No insights yet. Log your sleep data to get started.</p>
          </div>
        ) : (
          insights.map((insight) => {
            const style = SEVERITY_STYLES[insight.severity];
            const Icon = style.icon;
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 rounded-xl ${style.bg} border ${style.border} p-4 transition-all duration-200`}
              >
                <Icon className={`w-5 h-5 ${style.text} shrink-0 mt-0.5`} />
                <p className={`text-sm font-medium ${style.text}`}>{insight.message}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

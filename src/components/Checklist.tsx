import { ListChecks, Check } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';

const HIGHLIGHT_MAP: Record<string, string> = {
  'checklist-mouth-gym': 'mouth-gym',
  'checklist-side-sleep': 'side-sleep',
  'checklist-kitchen-closed': 'kitchen-closed',
  'checklist-caffeine-stop': 'caffeine-stop',
};

export default function Checklist() {
  const { todayProtocol, toggleChecklistItem, highlightedElement } = useHealthOS();
  const completedCount = todayProtocol.items.filter((i) => i.checked).length;
  const totalCount = todayProtocol.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-violet/10">
            <ListChecks className="w-4 h-4 text-accent-violet" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Daily Protocol</h2>
        </div>
        <span className="text-xs font-mono text-text-muted">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
        <div className="h-1 bg-surface-overlay">
          <div
            className="h-full bg-gradient-to-r from-accent-violet to-accent-cyan transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="divide-y divide-border-subtle">
          {todayProtocol.items.map((item) => {
            const isHighlighted = highlightedElement && HIGHLIGHT_MAP[highlightedElement] === item.id;
            return (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`flex items-center gap-4 w-full px-5 py-3.5 text-left hover:bg-surface-overlay/50 transition-colors cursor-pointer ${
                  isHighlighted 
                    ? 'bg-accent-violet/20 ring-2 ring-accent-violet animate-pulse' 
                    : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                    item.checked
                      ? 'bg-accent-violet border-accent-violet'
                      : 'border-border-accent bg-transparent hover:border-accent-violet/50'
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
                <span
                  className={`text-sm font-medium transition-all duration-200 ${
                    item.checked ? 'text-text-muted line-through' : 'text-text-primary'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

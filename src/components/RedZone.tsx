import { Cigarette, Wine, Milk, BedDouble, Flame, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';

const HIGHLIGHT_MAP: Record<string, string> = {
  'redzone-no-smoking': 'no-smoking',
  'redzone-no-alcohol': 'no-alcohol',
  'redzone-no-late-dairy': 'no-late-dairy',
  'redzone-no-back-sleeping': 'no-back-sleeping',
  'redzone-no-spicy-meals': 'no-spicy-meals',
};

const ICON_MAP: Record<string, LucideIcon> = {
  cigarette: Cigarette,
  wine: Wine,
  milk: Milk,
  bed: BedDouble,
  flame: Flame,
};

const ACCENT_MAP: Record<string, string> = {
  'no-smoking': 'text-accent-red',
  'no-alcohol': 'text-accent-amber',
  'no-late-dairy': 'text-accent-amber',
  'no-back-sleeping': 'text-accent-red',
  'no-spicy-meals': 'text-accent-amber',
};

export default function RedZone() {
  const { todayProtocol, toggleRedZoneItem, highlightedElement } = useHealthOS();
  const items = todayProtocol.redZoneItems ?? [];
  const triggeredCount = items.filter((i) => i.triggered).length;

  const isHighlighted = (id: string) => {
    const highlightKey = HIGHLIGHT_MAP[highlightedElement || ''];
    return highlightKey === id;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-red/10">
            <ShieldAlert className="w-4 h-4 text-accent-red" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            🚫 Red Zone
            <span className="text-xs font-normal text-text-muted ml-2">Snore Triggers</span>
          </h2>
        </div>
        {triggeredCount > 0 && (
          <span className="text-xs font-bold uppercase tracking-wider text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-full">
            {triggeredCount} active
          </span>
        )}
      </div>

      <div className="rounded-xl bg-surface-raised border border-accent-red/15 overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle bg-accent-red/5">
          <p className="text-xs text-accent-red/80 font-medium">
            Toggle ON if you violated any trigger today. This data feeds into your Insights engine.
          </p>
        </div>

        {triggeredCount > 0 && (
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-accent-red/5 border-b border-accent-red/15">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
            <p className="text-xs font-medium text-accent-red">
              {triggeredCount} trigger{triggeredCount > 1 ? 's' : ''} active — elevated snore risk tonight
            </p>
          </div>
        )}

        <div className="divide-y divide-border-subtle">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? ShieldAlert;
            const accent = ACCENT_MAP[item.id] ?? 'text-accent-red';
            return (
              <button
                key={item.id}
                onClick={() => toggleRedZoneItem(item.id)}
                className={`flex items-center gap-4 w-full px-5 py-4 text-left hover:bg-surface-overlay/40 transition-colors cursor-pointer group ${
                  item.triggered ? 'bg-accent-red/5' : ''
                } ${isHighlighted(item.id) ? 'bg-accent-cyan/20 ring-2 ring-accent-cyan animate-pulse' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-200 ${
                    item.triggered
                      ? 'bg-accent-red/20 ring-1 ring-accent-red/30'
                      : 'bg-surface-overlay group-hover:bg-surface-overlay/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      item.triggered ? 'text-accent-red' : accent + ' opacity-60'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium transition-colors duration-200 ${
                      item.triggered ? 'text-accent-red' : 'text-text-primary'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.description}</p>
                </div>

                <div
                  className={`relative w-11 h-6 rounded-full shrink-0 transition-all duration-200 ${
                    item.triggered
                      ? 'bg-accent-red/30 ring-1 ring-accent-red/40'
                      : 'bg-surface-overlay ring-1 ring-border-accent'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 ${
                      item.triggered
                        ? 'left-6 bg-accent-red shadow-[0_0_8px_rgba(248,113,113,0.4)]'
                        : 'left-1 bg-text-muted'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

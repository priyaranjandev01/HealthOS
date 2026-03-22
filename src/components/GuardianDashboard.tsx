import { X, Shield, Clock, Check } from 'lucide-react';
import { useHydrationLog } from '../hooks/useHydrationLog';
import { useGuardianNotifications } from '../hooks/useGuardianNotifications';
import { useState } from 'react';

interface GuardianDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const HYDRATION_ITEMS = [
  { id: 'airway-reset', time: '09:15 AM', label: 'Morning Airway Reset', amount: 500 },
  { id: 'micro-hydration-11-15', time: '11:15 AM', label: 'Micro-Hydration', amount: 200 },
  { id: 'micro-hydration-13-15', time: '01:15 PM', label: 'Micro-Hydration', amount: 200 },
  { id: 'lunch-time', time: '02:00 PM', label: 'Lunch', amount: 0 },
  { id: 'micro-hydration-15-15', time: '03:15 PM', label: 'Micro-Hydration', amount: 200 },
  { id: 'micro-hydration-17-15', time: '05:15 PM', label: 'Micro-Hydration', amount: 200 },
  { id: 'final-hydration', time: '07:15 PM', label: 'Final Big Hydration', amount: 400 },
  { id: 'dinner-time', time: '09:30 PM', label: 'Dinner', amount: 0 },
];

export default function GuardianDashboard({ isOpen, onClose }: GuardianDashboardProps) {
  const { logHydration } = useHydrationLog();
  const { loggedActions } = useGuardianNotifications();
  const [manualToggles, setManualToggles] = useState<Record<string, boolean>>({});

  const isItemLogged = (itemId: string) => {
    return loggedActions[itemId] || manualToggles[itemId] || false;
  };

  const handleToggle = async (item: typeof HYDRATION_ITEMS[0]) => {
    const newState = !manualToggles[item.id];
    setManualToggles(prev => ({ ...prev, [item.id]: newState }));
    
    if (newState && item.amount > 0) {
      await logHydration(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm" onClick={onClose} />
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md bg-surface-raised border border-accent-cyan/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with Close Button */}
        <div className="relative px-5 py-4 bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border-b border-border-subtle">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-text-muted hover:text-white" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-teal/20">
              <Shield className="w-5 h-5 text-accent-teal" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Guardian Dashboard</h2>
              <p className="text-xs text-text-muted">Hydration & Activity Tracker</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="space-y-2">
              {HYDRATION_ITEMS.map((item) => {
                const logged = isItemLogged(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    className={`flex items-center justify-between w-full p-3 rounded-lg border transition-all cursor-pointer ${
                      logged 
                        ? 'bg-accent-teal/10 border-accent-teal/30' 
                        : 'bg-surface-overlay/50 border-border-subtle hover:bg-surface-overlay'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${
                        logged
                          ? 'bg-accent-teal border-accent-teal'
                          : 'border-border-accent bg-transparent'
                      }`}>
                        {logged && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium transition-all ${
                          logged ? 'text-accent-teal' : 'text-text-primary'
                        }`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </p>
                      </div>
                    </div>
                    {item.amount > 0 && (
                      <span className={`text-sm font-mono font-bold ${
                        logged ? 'text-accent-teal' : 'text-text-muted'
                      }`}>
                        {logged ? `✓ ${item.amount}ml` : `${item.amount}ml`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        <div className="px-5 pb-4 pt-3 border-t border-border-subtle">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-surface-overlay text-text-secondary font-medium text-sm hover:bg-surface-overlay/80 transition-colors cursor-pointer">
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
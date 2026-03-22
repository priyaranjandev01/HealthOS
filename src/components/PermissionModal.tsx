import { Bell, AlertCircle, X } from 'lucide-react';
import { useGuardianNotifications } from '../hooks/useGuardianNotifications';

export default function PermissionModal() {
  const { showPermissionModal, setShowPermissionModal, enableAlerts, permission } = useGuardianNotifications();

  if (!showPermissionModal || permission === 'granted') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface/90 backdrop-blur-sm"
        onClick={() => setShowPermissionModal(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-raised border border-accent-cyan/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border-b border-border-subtle">
          <button
            onClick={() => setShowPermissionModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-overlay transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-cyan/20">
              <Bell className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Enable Guardian Alerts</h2>
              <p className="text-xs text-text-muted">Protect your airway 24/7</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-accent-red">Your Snore Score matters</p>
              <p className="text-xs text-text-secondary mt-1">
                A high Snore Score (like 122) indicates serious airway obstruction that affects your sleep quality, 
                oxygen levels, and long-term health. Without timely alerts, you're unprotected during critical 
                protocol windows.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">What you'll receive:</p>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                Morning airway reset reminders
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                Hydration checks every 2 hours
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                Meal timing alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                Kitchen closed & SnoreGym reminders
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                Bedtime position coaching
              </li>
            </ul>
          </div>

          {permission === 'denied' && (
            <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/20">
              <p className="text-xs text-accent-amber font-medium">
                ⚠️ Alerts are blocked. Please enable notifications in your browser settings to receive Guardian protection.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
          {permission !== 'denied' ? (
            <button
              onClick={enableAlerts}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-accent-cyan/25"
            >
              Enable Guardian Protection
            </button>
          ) : (
            <button
              onClick={() => {
                // Open browser notification settings
                if (window.Notification && window.Notification.requestPermission) {
                  window.Notification.requestPermission();
                }
                setShowPermissionModal(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-accent-amber text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => setShowPermissionModal(false)}
            className="w-full py-2.5 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

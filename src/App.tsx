import { Shield } from 'lucide-react';
import MetabolicGate from './components/MetabolicGate';
import MasterSchedule from './components/MasterSchedule';
import SnoreLabForm from './components/SnoreLabForm';
import Checklist from './components/Checklist';
import RedZone from './components/RedZone';
import HealthMetrics from './components/HealthMetrics';
import History from './components/History';
import WarriorScore from './components/WarriorScore';
import GuardianAlerts from './components/GuardianAlerts';
import PermissionModal from './components/PermissionModal';

export default function App() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/20">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight leading-none">
                HealthOS
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                Sleep Optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GuardianAlerts />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
              <span className="text-xs text-text-muted font-mono">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">
        <PermissionModal />
        <WarriorScore />
        <MetabolicGate />
        <MasterSchedule />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          <div className="space-y-8 sm:space-y-10">
            <SnoreLabForm />
            <HealthMetrics />
          </div>
          <div className="space-y-8 sm:space-y-10">
            <Checklist />
            <RedZone />
            <History />
          </div>
        </div>
      </main>

      <footer className="border-t border-border-subtle mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            HealthOS v1.0 — Sleep &amp; Metabolic Optimization Platform
          </p>
          <p className="text-xs text-text-muted font-mono">PWA Enabled · Offline Ready</p>
        </div>
      </footer>
    </div>
  );
}

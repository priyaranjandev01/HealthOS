import { Trophy, Share2, Zap } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';

interface WarriorStatus {
  status: 'elite' | 'solid' | 'risk';
  message: string;
  color: string;
  bgColor: string;
}

function getWarriorStatus(score: number): WarriorStatus {
  if (score >= 100) {
    return {
      status: 'elite',
      message: "Elite Status: Airway is fully protected. Sleep well, Warrior.",
      color: 'text-accent-teal',
      bgColor: 'bg-accent-teal/10',
    };
  }
  if (score >= 70) {
    return {
      status: 'solid',
      message: "Solid Discipline: Watch the Red Zone triggers tonight.",
      color: 'text-accent-amber',
      bgColor: 'bg-accent-amber/10',
    };
  }
  return {
    status: 'risk',
    message: "High Risk: Your Snore Score is likely to repeat. Tighten the protocol.",
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10',
  };
}

export default function WarriorScore() {
  const { todayProtocol } = useHealthOS();

  const checklistItems = todayProtocol.items ?? [];
  const redZoneItems = todayProtocol.redZoneItems ?? [];
  
  const completedCount = checklistItems.filter(i => i.checked).length;
  const totalChecklist = checklistItems.length;
  const triggeredCount = redZoneItems.filter(i => i.triggered).length;
  const totalRedZone = redZoneItems.length;

  const rawScore = (completedCount * 20) - (triggeredCount * 20);
  const warriorScore = Math.max(0, Math.min(100, rawScore));

  const status = getWarriorStatus(warriorScore);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (warriorScore / 100) * circumference;

  const handleShare = () => {
    const summary = `🏆 Warrior Score: ${warriorScore}%

📋 Daily Protocol: ${completedCount}/${totalChecklist} completed
⚠️ Red Zone Violations: ${triggeredCount}/${totalRedZone} triggered

${status.message}

#HealthOS #WarriorDiscipline`;

    if (navigator.share) {
      navigator.share({
        title: 'My Warrior Score',
        text: summary,
      }).catch(() => {
        navigator.clipboard.writeText(summary);
      });
    } else {
      navigator.clipboard.writeText(summary);
    }
  };

  const getStrokeColor = () => {
    if (status.status === 'elite') return '#2dd4bf';
    if (status.status === 'solid') return '#fbbf24';
    return '#f87171';
  };

  return (
    <section className="relative">
      <div className={`absolute inset-0 rounded-2xl opacity-50 blur-xl ${status.bgColor} -z-10`} />

      <div className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${status.bgColor}`}>
              <Trophy className={`w-4 h-4 ${status.color}`} />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Today's Warrior Score</h2>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all duration-200"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <div className="p-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative">
            <svg width="140" height="140" className="transform -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-overlay"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={getStrokeColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${getStrokeColor()}60)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${status.color}`}>
                {warriorScore}
              </span>
              <span className="text-xs text-text-muted font-mono">%</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${status.bgColor} border border-current/20`}>
              <Zap className={`w-4 h-4 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>
                {status.status === 'elite' ? '🏆 ELITE' : status.status === 'solid' ? '💪 SOLID' : '⚠️ HIGH RISK'}
              </span>
            </div>

            <p className={`text-sm font-medium leading-relaxed ${status.color}`}>
              {status.message}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-surface-overlay">
                <p className="text-xs text-text-muted mb-1">Protocol Done</p>
                <p className="text-lg font-bold text-accent-violet">
                  +{completedCount * 20}%
                </p>
                <p className="text-[10px] text-text-muted">
                  {completedCount}/{totalChecklist} items
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-overlay">
                <p className="text-xs text-text-muted mb-1">Red Zone Hits</p>
                <p className={`text-lg font-bold ${triggeredCount > 0 ? 'text-accent-red' : 'text-accent-teal'}`}>
                  {triggeredCount > 0 ? `-${triggeredCount * 20}%` : '0%'}
                </p>
                <p className="text-[10px] text-text-muted">
                  {triggeredCount}/{totalRedZone} violations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

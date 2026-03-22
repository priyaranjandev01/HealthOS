import { useState } from 'react';
import { Activity, Wind, Send } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';

export default function SnoreLabForm() {
  const { upsertSleepMetric, latestMetric } = useHealthOS();
  const [snoreScore, setSnoreScore] = useState('');
  const [breathFlow, setBreathFlow] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(snoreScore);
    const flow = Number(breathFlow);
    if (isNaN(score) || isNaN(flow) || score < 0 || flow < 0 || flow > 100) return;

    try {
      await upsertSleepMetric({ date: todayKey, snoreScore: score, breathFlowPercentage: flow });
      setSnoreScore('');
      setBreathFlow('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    } catch {
      // IndexedDB write failed — inputs are preserved so the user can retry
    }
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-teal/10">
          <Activity className="w-4 h-4 text-accent-teal" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">SnoreLab Ingestion</h2>
      </div>

      <div className="rounded-xl bg-surface-raised border border-border-subtle p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="snore-score" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Activity className="w-3.5 h-3.5 text-accent-amber" />
                Snore Score
              </label>
              <input
                id="snore-score"
                type="number"
                min="0"
                max="200"
                placeholder="0\u2013200"
                value={snoreScore}
                onChange={(e) => setSnoreScore(e.target.value)}
                required
                className="w-full bg-surface-overlay border border-border-accent rounded-lg px-3 py-2.5 text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="breath-flow" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Wind className="w-3.5 h-3.5 text-accent-cyan" />
                BreathFlow %
              </label>
              <input
                id="breath-flow"
                type="number"
                min="0"
                max="100"
                placeholder="0\u2013100"
                value={breathFlow}
                onChange={(e) => setBreathFlow(e.target.value)}
                required
                className="w-full bg-surface-overlay border border-border-accent rounded-lg px-3 py-2.5 text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal/40 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-accent-teal/15 text-accent-teal border border-accent-teal/20 text-sm font-medium hover:bg-accent-teal/25 hover:border-accent-teal/40 focus:outline-none focus:ring-2 focus:ring-accent-teal/40 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitted ? 'Logged \u2713' : 'Log Sleep Data'}
          </button>
        </form>

        {latestMetric && (
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Latest Entry</p>
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-text-muted">Snore Score</span>
                <p className={`font-mono font-bold text-lg ${
                  latestMetric.snoreScore > 70 ? 'text-accent-red' : 'text-accent-teal'
                }`}>
                  {latestMetric.snoreScore}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-muted">BreathFlow</span>
                <p className={`font-mono font-bold text-lg ${
                  latestMetric.breathFlowPercentage < 50 ? 'text-accent-amber' : 'text-accent-cyan'
                }`}>
                  {latestMetric.breathFlowPercentage}%
                </p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Date</span>
                <p className="font-mono text-sm text-text-secondary mt-0.5">{latestMetric.date}</p>
              </div>
              {latestMetric.isUnstable && (
                <div>
                  <span className="text-xs text-accent-red font-medium uppercase">Unstable</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

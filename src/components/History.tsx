import { TrendingDown, TrendingUp, Minus, BarChart3, TrendingDown as TrendDown } from 'lucide-react';
import { useHealthOS } from '../context/HealthOSContext';
import type { SleepMetric } from '../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function computeTrend(scores: number[]): { direction: 'up' | 'down' | 'stable'; percent: number } {
  if (scores.length < 2) return { direction: 'stable', percent: 0 };
  const oldest = scores[scores.length - 1];
  const newest = scores[0];
  if (oldest === 0) return { direction: newest > 0 ? 'up' : 'stable', percent: 0 };
  const change = ((newest - oldest) / oldest) * 100;
  const rounded = Math.abs(Math.round(change));
  if (change > 2) return { direction: 'up', percent: rounded };
  if (change < -2) return { direction: 'down', percent: rounded };
  return { direction: 'stable', percent: rounded };
}

function scoreColor(score: number): string {
  if (score > 75) return 'text-accent-red';
  if (score > 50) return 'text-accent-amber';
  return 'text-accent-teal';
}

function flowColor(flow: number): string {
  if (flow < 50) return 'text-accent-amber';
  return 'text-accent-cyan';
}

function barWidth(value: number, max: number): string {
  if (max === 0) return '0%';
  return `${Math.min((value / max) * 100, 100)}%`;
}

// Generate SVG path for the Warrior Score line
function generateWarriorLinePath(metrics: SleepMetric[], height: number, padding: number): string {
  const validMetrics = metrics.filter(m => m.warriorScore !== undefined && m.warriorScore !== null);
  if (validMetrics.length < 2) return '';
  
  const points = validMetrics.map((m, i) => {
    const x = padding + (i * (140 - padding * 2) / (validMetrics.length - 1));
    const y = height - padding - (m.warriorScore! / 100) * (height - padding * 2);
    return `${x},${y}`;
  });
  
  return `M ${points.join(' L ')}`;
}

export default function History() {
  const { history } = useHealthOS();

  const trend = computeTrend(history.map((m) => m.snoreScore));
  const maxScore = history.length > 0 ? Math.max(...history.map((m) => m.snoreScore), 1) : 1;

  const TrendIcon = trend.direction === 'down' ? TrendingDown : trend.direction === 'up' ? TrendingUp : Minus;
  const trendColor = trend.direction === 'down' ? 'text-accent-teal' : trend.direction === 'up' ? 'text-accent-red' : 'text-text-secondary';
  const trendBg = trend.direction === 'down' ? 'bg-accent-teal/10 border-accent-teal/20' : trend.direction === 'up' ? 'bg-accent-red/10 border-accent-red/20' : 'bg-surface-overlay border-border-subtle';

  // Check if there's warrior score data for correlation
  const hasWarriorData = history.some(m => m.warriorScore !== undefined && m.warriorScore !== null);

  // Chart dimensions
  const chartHeight = 80;
  const chartPadding = 10;
  const warriorLinePath = generateWarriorLinePath(history, chartHeight, chartPadding);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
            <BarChart3 className="w-4 h-4 text-accent-cyan" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Sleep History</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend for Warrior Score */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-accent-violet" />
            <span className="text-[10px] text-text-muted">Warrior</span>
          </div>
          <span className="text-xs font-mono text-text-muted">7d</span>
        </div>
      </div>

      <div className="rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
        {history.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-text-muted">No sleep data yet.</p>
            <p className="text-xs text-text-muted mt-1">Start logging to see trends.</p>
          </div>
        ) : (
          <>
            {/* Chart Overlay: Warrior Score Line vs Snore Score Bars */}
            {hasWarriorData && history.length >= 2 && (
              <div className="p-4 border-b border-border-subtle bg-gradient-to-b from-surface-overlay/30 to-transparent">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">Correlation: Warrior Score (Line) vs Snore Score (Bars)</p>
                <div className="relative h-20">
                  {/* Bar chart (Snore Score) - background */}
                  <div className="absolute inset-0 flex items-end gap-1">
                    {history.map((m) => (
                      <div key={m.date} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            m.snoreScore > 75 ? 'bg-accent-red/60' : m.snoreScore > 50 ? 'bg-accent-amber/60' : 'bg-accent-teal/60'
                          }`}
                          style={{ height: `${(m.snoreScore / maxScore) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Warrior Score line overlay */}
                  {warriorLinePath && (
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="warriorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <path
                        d={warriorLinePath}
                        fill="none"
                        stroke="url(#warriorGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
                      />
                    </svg>
                  )}
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[8px] text-text-muted/50">
                    <span>100</span>
                    <span>50</span>
                    <span>0</span>
                  </div>
                </div>
              </div>
            )}

            {history.length >= 2 && (
              <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-border-subtle ${trendBg}`}>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <p className={`text-sm font-medium ${trendColor}`}>
                  Snore Score is trending{' '}
                  <span className="uppercase font-bold">{trend.direction}</span>
                  {trend.percent > 0 && <> by {trend.percent}% this week</>}
                </p>
              </div>
            )}

            {/* Show correlation insight if we have both scores */}
            {hasWarriorData && history.length >= 3 && (
              <div className="px-5 py-3 bg-accent-violet/5 border-b border-accent-violet/10">
                <div className="flex items-center gap-2">
                  <TrendDown className="w-3.5 h-3.5 text-accent-violet" />
                  <p className="text-xs text-accent-violet font-medium">
                    Correlation Insight: High Warrior Score → Lower Snore Score
                  </p>
                </div>
              </div>
            )}

            <div className="divide-y divide-border-subtle">
              {history.map((metric) => (
                <div key={metric.date} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-overlay/40 transition-colors">
                  <span className="text-xs font-mono text-text-muted w-16 shrink-0">
                    {formatDate(metric.date)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-text-muted w-12">Score</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-overlay overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            metric.snoreScore > 75 ? 'bg-accent-red' : metric.snoreScore > 50 ? 'bg-accent-amber' : 'bg-accent-teal'
                          }`}
                          style={{ width: barWidth(metric.snoreScore, maxScore) }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-8 text-right ${scoreColor(metric.snoreScore)}`}>
                        {metric.snoreScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-text-muted w-12">Flow</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-overlay overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            metric.breathFlowPercentage < 50 ? 'bg-accent-amber' : 'bg-accent-cyan'
                          }`}
                          style={{ width: `${metric.breathFlowPercentage}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-8 text-right ${flowColor(metric.breathFlowPercentage)}`}>
                        {metric.breathFlowPercentage}%
                      </span>
                    </div>
                  </div>

                  {metric.isUnstable && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-red bg-accent-red/10 px-2 py-0.5 rounded-full shrink-0">
                      Unstable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

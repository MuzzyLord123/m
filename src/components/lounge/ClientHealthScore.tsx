import { useMemo } from 'react';
import { StatusBadge, type Tone } from '@/components/platform';

interface HealthData {
  lastLogin: string | null;
  contentPending: number;
  contentDelivered: number;
  appProjects: number;
  activeProjects: number;
  messageCount: number;
  hasOverduePayments: boolean;
  websiteStatus: string | null;
}

interface ScoreDimension {
  label: string;
  score: number;
  description: string;
}

function calcEngagement(data: HealthData): number {
  let s = 40;
  if (data.contentDelivered > 0) s += 15;
  if (data.contentPending > 0) s += 10;
  if (data.appProjects > 0) s += 15;
  if (data.activeProjects > 0) s += 10;
  if (data.websiteStatus === 'live') s += 10;
  return Math.min(100, s);
}

function calcResponsiveness(data: HealthData): number {
  let s = 50;
  if (data.lastLogin) {
    const days = (Date.now() - new Date(data.lastLogin).getTime()) / 86400000;
    if (days < 1) s = 95;
    else if (days < 3) s = 80;
    else if (days < 7) s = 65;
    else if (days < 14) s = 45;
    else s = 25;
  }
  return s;
}

function calcPaymentHealth(data: HealthData): number {
  return data.hasOverduePayments ? 35 : 90;
}

function calcSatisfaction(data: HealthData): number {
  let s = 60;
  if (data.messageCount > 0) s += 10;
  if (data.contentDelivered > 0) s += 15;
  if (data.websiteStatus === 'live') s += 15;
  return Math.min(100, s);
}

/** Presentation mapping only: ok >= 70, attend 40-69, risk < 40. */
function scoreTone(score: number): Tone {
  if (score >= 70) return 'ok';
  if (score >= 40) return 'attend';
  return 'risk';
}

function scoreToneLabel(score: number): string {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Needs attention';
  return 'At risk';
}

export default function ClientHealthScore({ data }: { data: HealthData }) {
  const dimensions: ScoreDimension[] = useMemo(() => [
    { label: 'Engagement', score: calcEngagement(data), description: 'Project activity and content usage' },
    { label: 'Responsiveness', score: calcResponsiveness(data), description: 'Login frequency and platform usage' },
    { label: 'Payments', score: calcPaymentHealth(data), description: 'Payment status and billing health' },
    { label: 'Satisfaction', score: calcSatisfaction(data), description: 'Content delivery and project completion' },
  ], [data]);

  const overall = useMemo(() => Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length), [dimensions]);

  return (
    <div>
      {/* Overall score */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">
            {overall}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            of 100
          </span>
        </div>
        <StatusBadge tone={scoreTone(overall)} label={scoreToneLabel(overall)} />
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Calculated from engagement, responsiveness, payment history and satisfaction signals.
      </p>

      {/* Factor ledger */}
      <ul className="mt-4 border-t border-border/60">
        {dimensions.map(d => (
          <li
            key={d.label}
            title={d.description}
            className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0"
          >
            <span className="text-[12.5px] text-ink-2">{d.label}</span>
            <span className="font-mono text-xs tabular-nums text-foreground">{d.score}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

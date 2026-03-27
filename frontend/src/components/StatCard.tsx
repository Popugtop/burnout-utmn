import { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`card p-6 ${accent ? 'border-accent/40 glow-orange' : ''}`}>
      <p className="text-text-muted text-sm font-body mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
      {sub && <p className="text-text-secondary text-sm mt-1">{sub}</p>}
    </div>
  );
}

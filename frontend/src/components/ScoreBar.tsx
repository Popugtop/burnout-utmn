import { motion } from 'framer-motion';

interface Props {
  label: string;
  score: number;
}

function heatColor(score: number): string {
  if (score <= 20) return '#1B2A4A';
  if (score <= 40) return '#2A5A6A';
  if (score <= 60) return '#C47A30';
  if (score <= 80) return '#D55B34';
  return '#E84430';
}

export default function ScoreBar({ label, score }: Props) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-text-secondary text-sm">{label}</span>
        <span className="font-mono text-sm font-medium" style={{ color: heatColor(score) }}>
          {Math.round(score)}%
        </span>
      </div>
      <div className="h-2 bg-base-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: heatColor(score) }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

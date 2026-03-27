import { motion } from 'framer-motion';
import { useState } from 'react';
import { HeatmapRow } from '../types';
import { DEPT_SHORT } from '../data/departments';

interface Props {
  data: HeatmapRow[];
}

const CATEGORIES = [
  { key: 'academic', label: 'Academic' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'social', label: 'Social' },
];

function heatColor(score: number): string {
  if (score <= 20) return '#1B2A4A';
  if (score <= 40) return '#2A5A6A';
  if (score <= 60) return '#C47A30';
  if (score <= 80) return '#D55B34';
  return '#E84430';
}

export default function HeatmapGrid({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    dept: string; cat: string; score: number; count: number; x: number; y: number;
  } | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="text-left text-text-muted text-xs font-body pb-3 pr-4 w-40">Department</th>
            {CATEGORIES.map(c => (
              <th key={c.key} className="text-center text-text-secondary text-xs font-body pb-3 px-1">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={row.department}>
              <td className="text-text-secondary text-xs py-1.5 pr-4 font-body whitespace-nowrap">
                {DEPT_SHORT[row.department] || row.department}
              </td>
              {CATEGORIES.map((cat, ci) => {
                const score = row[cat.key as keyof HeatmapRow] as number;
                const color = heatColor(score);
                return (
                  <td key={cat.key} className="px-1 py-1.5">
                    <motion.div
                      className="h-9 rounded cursor-pointer relative"
                      style={{ backgroundColor: color }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ri * 0.05 + ci * 0.02, duration: 0.3 }}
                      onMouseEnter={e => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ dept: row.department, cat: cat.label, score, count: row.count, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[10px] font-mono font-medium">
                        {Math.round(score)}
                      </span>
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip && (
        <div
          className="fixed z-50 bg-base-700 border border-base-600 rounded-lg p-3 text-sm pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
        >
          <p className="text-text-primary font-medium">{tooltip.dept}</p>
          <p className="text-text-secondary">{tooltip.cat}: <span className="text-accent font-mono">{Math.round(tooltip.score)}%</span></p>
          <p className="text-text-muted text-xs">{tooltip.count} responses</p>
        </div>
      )}
    </div>
  );
}

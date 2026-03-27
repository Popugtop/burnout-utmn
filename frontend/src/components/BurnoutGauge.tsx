import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score <= 20) return '#34D5A0';
  if (score <= 40) return '#2A5A6A';
  if (score <= 60) return '#C47A30';
  if (score <= 80) return '#D55B34';
  return '#E84430';
}

function scoreLabel(score: number): string {
  if (score <= 20) return "You're doing great!";
  if (score <= 40) return 'Mild stress — keep an eye on it';
  if (score <= 60) return 'Moderate burnout — time to take action';
  if (score <= 80) return 'High burnout — please seek support';
  return 'Critical burnout — talk to someone you trust';
}

export default function BurnoutGauge({ score, size = 200 }: Props) {
  const [animated, setAnimated] = useState(0);
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // half circle
  const color = scoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const progress = (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#1C2333"
          strokeWidth={size * 0.06}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.06}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - size * 0.04}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {Math.round(score)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.08}
          textAnchor="middle"
          fill="#8892A8"
          fontSize={size * 0.07}
          fontFamily="DM Sans, sans-serif"
        >
          / 100
        </text>
      </svg>
      <p className="text-center font-display text-lg font-semibold" style={{ color }}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}

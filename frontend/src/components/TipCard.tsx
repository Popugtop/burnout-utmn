const CATEGORY_ICONS: Record<string, string> = {
  academic: '📚',
  sleep: '🌙',
  emotional: '🧠',
  social: '🤝',
};

const CATEGORY_COLORS: Record<string, string> = {
  academic: '#C47A30',
  sleep: '#2A5A6A',
  emotional: '#D55B34',
  social: '#34D5A0',
};

interface Tip {
  id: string;
  category: string;
  title: string;
  body: string;
  source?: string | null;
}

interface Props {
  tip: Tip;
}

export default function TipCard({ tip }: Props) {
  const color = CATEGORY_COLORS[tip.category] || '#8892A8';
  return (
    <div className="card p-5 hover:border-base-600/80 transition-all duration-200" style={{ borderColor: `${color}40` }}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{CATEGORY_ICONS[tip.category] || '💡'}</span>
        <h3 className="font-display text-lg font-semibold text-text-primary">{tip.title}</h3>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed mb-3">{tip.body}</p>
      {tip.source && (
        <p className="text-text-muted text-xs italic border-t border-base-600 pt-2">{tip.source}</p>
      )}
    </div>
  );
}

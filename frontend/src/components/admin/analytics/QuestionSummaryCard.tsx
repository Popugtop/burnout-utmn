import { QuestionSummaryItem } from '../../../types';

const SCALE_COLORS = ['#34D5A0', '#6AB8A0', '#C47A30', '#D55B34', '#E84430'];

interface Props {
  question: QuestionSummaryItem;
}

export default function QuestionSummaryCard({ question }: Props) {
  if (question.question_type === 'scale_1_5') {
    return (
      <div className="card p-5">
        <p className="text-text-secondary text-sm font-medium mb-3">{question.question_text}</p>
        <div className="space-y-1.5">
          {[1,2,3,4,5].map(v => {
            const count = question.distribution[v] || 0;
            const pct = question.distribution_pct[v] || 0;
            return (
              <div key={v} className="flex items-center gap-3">
                <span className="text-text-muted text-xs w-4 text-right">{v}</span>
                <div className="flex-1 bg-base-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: SCALE_COLORS[v-1] }} />
                </div>
                <span className="text-text-muted text-xs w-14 text-right">{pct}% ({count})</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-text-muted">
          <span>Mean: <strong className="text-text-primary">{(question.mean || 0).toFixed(2)}</strong></span>
          <span>n = <strong className="text-text-primary">{question.count}</strong></span>
          <span className="ml-auto px-2 py-0.5 rounded text-xs capitalize" style={{
            background: question.category === 'academic' ? '#1a2a4a' : question.category === 'sleep' ? '#1a3a2a' : question.category === 'emotional' ? '#3a2a1a' : '#2a1a3a'
          }}>{question.category}</span>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...(question.choices || []).map(c => question.distribution[c] || 0), 1);

  return (
    <div className="card p-5">
      <p className="text-text-secondary text-sm font-medium mb-3">{question.question_text}</p>
      <div className="space-y-2">
        {(question.choices || []).map((choice, i) => {
          const count = question.distribution[choice] || 0;
          const pct = question.distribution_pct[choice] || 0;
          const isMax = count === maxCount && count > 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-text-muted text-xs w-16 truncate" title={choice}>{choice}</span>
              <div className="flex-1 bg-base-700 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${(count / maxCount) * 100}%`,
                  backgroundColor: isMax ? '#D55B34' : '#2A5A6A'
                }} />
              </div>
              <span className="text-text-muted text-xs w-20 text-right">{pct}% ({count})</span>
            </div>
          );
        })}
      </div>
      <p className="text-text-muted text-xs mt-3">n = <strong className="text-text-primary">{question.count}</strong></p>
    </div>
  );
}

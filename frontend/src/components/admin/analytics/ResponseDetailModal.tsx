import { ResponseDetail } from '../../../types';

interface Props {
  detail: ResponseDetail | null;
  onClose: () => void;
}

function scoreColor(s: number) {
  if (s <= 20) return '#34D5A0';
  if (s <= 40) return '#2A5A6A';
  if (s <= 60) return '#C47A30';
  if (s <= 80) return '#D55B34';
  return '#E84430';
}

export default function ResponseDetailModal({ detail, onClose }: Props) {
  if (!detail) return null;
  const { response, answers } = detail;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-base-600 flex justify-between items-start">
          <div>
            <h3 className="font-display text-xl font-bold">Response Details</h3>
            <p className="text-text-muted text-sm mt-1">
              {new Date(response.created_at).toLocaleString()} · Year {response.course_year} · {response.department?.split(' ').slice(-1)[0]}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total', score: response.score_total },
              { label: 'Academic', score: response.score_academic },
              { label: 'Sleep', score: response.score_sleep },
              { label: 'Emotional', score: response.score_emotional },
              { label: 'Social', score: response.score_social },
            ].map(({ label, score }) => (
              <div key={label} className="card p-3 text-center">
                <p className="text-text-muted text-xs mb-1">{label}</p>
                <p className="font-mono font-bold text-lg" style={{ color: scoreColor(score) }}>{Math.round(score)}%</p>
              </div>
            ))}
          </div>

          {response.completion_time_seconds && (
            <p className="text-text-muted text-xs mb-4">
              Completion time: {Math.floor(response.completion_time_seconds / 60)}m {response.completion_time_seconds % 60}s
              {response.is_suspicious ? ' · ⚠️ Marked suspicious' : ''}
            </p>
          )}

          <div className="space-y-3">
            {answers.map((a, i) => (
              <div key={i} className="border border-base-600 rounded-lg p-3">
                <p className="text-text-secondary text-sm mb-1.5">{a.question_text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-medium text-sm">{a.answer_value}</span>
                  <span className="text-text-muted text-xs font-mono">
                    Score: {Math.round(a.normalized_score)}% · <span className="capitalize">{a.category}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

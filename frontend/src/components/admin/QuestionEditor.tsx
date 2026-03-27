import { useState } from 'react';
import { SurveyQuestion } from '../../types';
import { adminFetch } from '../../hooks/useAdmin';

interface Props {
  question: SurveyQuestion;
  onSaved: () => void;
  onDeleted: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const CATEGORIES = ['academic', 'sleep', 'emotional', 'social'];

export default function QuestionEditor({ question, onSaved, onDeleted, onMoveUp, onMoveDown, isFirst, isLast }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    question_text: question.question_text,
    category: question.category,
    question_type: question.question_type,
    scale_label_low: question.scale_label_low || '',
    scale_label_high: question.scale_label_high || '',
    choices: question.choices_json ? (JSON.parse(question.choices_json) as string[]) : [''],
    scoring: question.scoring_map_json ? (JSON.parse(question.scoring_map_json) as Record<string, number>) : {},
    is_inverted: question.is_inverted === 1,
  });

  async function save() {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/questions/${question.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          question_text: form.question_text,
          category: form.category,
          question_type: form.question_type,
          scale_label_low: form.scale_label_low || null,
          scale_label_high: form.scale_label_high || null,
          choices_json: form.question_type === 'choice' ? JSON.stringify(form.choices) : null,
          is_inverted: form.is_inverted ? 1 : 0,
          scoring_map_json: form.question_type === 'choice' ? JSON.stringify(form.scoring) : null,
        }),
      });
      onSaved();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm('Delete this question?')) return;
    await adminFetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' });
    onDeleted();
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-base-700/50" onClick={() => setOpen(!open)}>
        <div className="flex flex-col gap-0.5">
          <button onClick={e => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst}
            className="text-text-muted hover:text-text-primary disabled:opacity-30 text-xs leading-none">▲</button>
          <button onClick={e => { e.stopPropagation(); onMoveDown(); }} disabled={isLast}
            className="text-text-muted hover:text-text-primary disabled:opacity-30 text-xs leading-none">▼</button>
        </div>
        <span className="text-accent font-mono text-xs w-6">{question.order_index}</span>
        <span className="bg-base-700 text-text-muted text-xs px-2 py-0.5 rounded">{form.category}</span>
        <p className="flex-1 text-text-secondary text-sm truncate">{form.question_text}</p>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="border-t border-base-600 p-4 space-y-4">
          <div>
            <label className="block text-text-muted text-xs mb-1">Question Text</label>
            <textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              className="input resize-none" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted text-xs mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SurveyQuestion['category'] }))}
                className="input">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-text-muted text-xs mb-1">Type</label>
              <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as SurveyQuestion['question_type'] }))}
                className="input">
                <option value="scale_1_5">Scale 1-5</option>
                <option value="choice">Multiple Choice</option>
              </select>
            </div>
          </div>

          {form.question_type === 'scale_1_5' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-xs mb-1">Low label</label>
                <input value={form.scale_label_low} onChange={e => setForm(f => ({ ...f, scale_label_low: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-text-muted text-xs mb-1">High label</label>
                <input value={form.scale_label_high} onChange={e => setForm(f => ({ ...f, scale_label_high: e.target.value }))} className="input" />
              </div>
            </div>
          )}

          {form.question_type === 'choice' && (
            <div>
              <label className="block text-text-muted text-xs mb-2">Choices & Scores (0-100)</label>
              {form.choices.map((choice, ci) => (
                <div key={ci} className="flex gap-2 mb-2">
                  <input value={choice}
                    onChange={e => setForm(f => { const c = [...f.choices]; c[ci] = e.target.value; return { ...f, choices: c }; })}
                    className="input text-sm" placeholder="Choice text" />
                  <input type="number" min="0" max="100"
                    value={form.scoring[choice] ?? ''}
                    onChange={e => setForm(f => ({ ...f, scoring: { ...f.scoring, [choice]: Number(e.target.value) } }))}
                    className="input w-20 text-sm" placeholder="Score" />
                  <button onClick={() => setForm(f => ({ ...f, choices: f.choices.filter((_, i) => i !== ci) }))}
                    className="text-heat-critical text-sm px-2">×</button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, choices: [...f.choices, ''] }))}
                className="text-accent text-xs hover:underline">+ Add choice</button>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_inverted}
              onChange={e => setForm(f => ({ ...f, is_inverted: e.target.checked }))}
              className="w-4 h-4 accent-[#D55B34]" />
            <span className="text-text-secondary text-sm">Inverted scoring (positive question)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-5 disabled:opacity-40">
              {saving ? 'Saving...' : 'Save Question'}
            </button>
            <button onClick={del} className="btn-danger text-sm py-2 px-4">Delete</button>
            <button onClick={() => setOpen(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

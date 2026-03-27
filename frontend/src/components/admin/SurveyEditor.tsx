import { useState, useEffect } from 'react';
import { adminFetch } from '../../hooks/useAdmin';
import { Survey, SurveyQuestion } from '../../types';
import QuestionEditor from './QuestionEditor';

interface Props {
  survey: Survey;
  onBack: () => void;
}

const NEW_Q_DEFAULTS = {
  category: 'academic' as SurveyQuestion['category'],
  question_text: '',
  question_type: 'scale_1_5' as SurveyQuestion['question_type'],
  scale_label_low: 'Never',
  scale_label_high: 'Always',
};

export default function SurveyEditor({ survey, onBack }: Props) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [title, setTitle] = useState(survey.title);
  const [desc, setDesc] = useState(survey.description);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [addingQ, setAddingQ] = useState(false);
  const [newQ, setNewQ] = useState(NEW_Q_DEFAULTS);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function loadQuestions() {
    const data = await adminFetch<SurveyQuestion[]>(`/api/admin/surveys/${survey.id}/questions`);
    setQuestions(data);
  }

  useEffect(() => { loadQuestions(); }, []);

  async function saveMeta() {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/surveys/${survey.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description: desc }),
      });
      showToast('Survey saved!');
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion() {
    if (!newQ.question_text.trim()) return;
    await adminFetch(`/api/admin/surveys/${survey.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        ...newQ,
        scale_label_low: newQ.scale_label_low || null,
        scale_label_high: newQ.scale_label_high || null,
      }),
    });
    setAddingQ(false);
    setNewQ(NEW_Q_DEFAULTS);
    loadQuestions();
  }

  async function reorder(fromIndex: number, toIndex: number) {
    const reordered = [...questions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setQuestions(reordered);
    await adminFetch(`/api/admin/surveys/${survey.id}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ order: reordered.map(q => q.id) }),
    });
    loadQuestions();
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 bg-success text-base-900 px-5 py-3 rounded-xl font-medium z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary text-sm py-2 px-4">← Back</button>
        <h2 className="font-display text-2xl font-semibold">Edit Survey</h2>
        {survey.is_active ? (
          <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full">Active</span>
        ) : null}
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-text-muted text-xs mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input resize-none" rows={2} />
        </div>
        <button onClick={saveMeta} disabled={saving} className="btn-primary text-sm py-2 px-5 disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Info'}
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-display text-xl font-semibold">Questions ({questions.length})</h3>
        <button onClick={() => setAddingQ(!addingQ)} className="btn-primary text-sm py-2 px-5">+ Add Question</button>
      </div>

      {addingQ && (
        <div className="card p-5 space-y-4">
          <h4 className="font-medium text-text-secondary">New Question</h4>
          <textarea value={newQ.question_text} onChange={e => setNewQ(q => ({ ...q, question_text: e.target.value }))}
            className="input resize-none" rows={2} placeholder="Question text..." />
          <div className="grid grid-cols-2 gap-4">
            <select value={newQ.category} onChange={e => setNewQ(q => ({ ...q, category: e.target.value as SurveyQuestion['category'] }))}
              className="input">
              {['academic', 'sleep', 'emotional', 'social'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newQ.question_type} onChange={e => setNewQ(q => ({ ...q, question_type: e.target.value as SurveyQuestion['question_type'] }))}
              className="input">
              <option value="scale_1_5">Scale 1-5</option>
              <option value="choice">Multiple Choice</option>
            </select>
          </div>
          {newQ.question_type === 'scale_1_5' && (
            <div className="grid grid-cols-2 gap-4">
              <input value={newQ.scale_label_low} onChange={e => setNewQ(q => ({ ...q, scale_label_low: e.target.value }))} className="input" placeholder="Low label" />
              <input value={newQ.scale_label_high} onChange={e => setNewQ(q => ({ ...q, scale_label_high: e.target.value }))} className="input" placeholder="High label" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={addQuestion} className="btn-primary text-sm py-2 px-5">Add</button>
            <button onClick={() => setAddingQ(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            isFirst={i === 0}
            isLast={i === questions.length - 1}
            onSaved={() => { loadQuestions(); showToast('Question saved!'); }}
            onDeleted={() => { loadQuestions(); showToast('Question deleted.'); }}
            onMoveUp={() => reorder(i, i - 1)}
            onMoveDown={() => reorder(i, i + 1)}
          />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';

interface Tip {
  id: string;
  category: string;
  title: string;
  body: string;
  source: string | null;
  order_index: number;
  is_active: number;
}

const CATEGORIES = ['academic', 'sleep', 'emotional', 'social'];

const CATEGORY_LABELS: Record<string, string> = {
  academic: 'Academic Load',
  sleep: 'Sleep & Energy',
  emotional: 'Emotional State',
  social: 'Social & Lifestyle',
};

const EMPTY_FORM = { category: 'academic', title: '', body: '', source: '' };

export default function TipsEditor() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetch<Tip[]>('/api/admin/cms/tips');
      setTips(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(tip: Tip) {
    setEditing(tip);
    setCreating(false);
    setForm({ category: tip.category, title: tip.title, body: tip.body, source: tip.source || '' });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (creating) {
        await adminFetch('/api/admin/cms/tips', {
          method: 'POST',
          body: JSON.stringify({ ...form, source: form.source || null }),
        });
      } else if (editing) {
        await adminFetch(`/api/admin/cms/tips/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, source: form.source || null }),
        });
      }
      cancelForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(tip: Tip) {
    await adminFetch(`/api/admin/cms/tips/${tip.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: tip.is_active ? 0 : 1 }),
    });
    await load();
  }

  async function deleteTip(tip: Tip) {
    if (!confirm(`Delete "${tip.title}"?`)) return;
    await adminFetch(`/api/admin/cms/tips/${tip.id}`, { method: 'DELETE' });
    await load();
  }

  const filtered = filterCat === 'all' ? tips : tips.filter(t => t.category === filterCat);

  const CATEGORY_COLORS: Record<string, string> = {
    academic: '#C47A30', sleep: '#2A5A6A', emotional: '#D55B34', social: '#34D5A0',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {['all', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize
                ${filterCat === cat ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'}`}>
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <button onClick={startCreate} className="btn-primary text-sm py-2 px-4">+ Add Tip</button>
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="card p-6 border-accent/30">
          <h3 className="font-display text-lg font-semibold mb-4">{creating ? 'New Tip' : 'Edit Tip'}</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-text-muted text-xs mb-1">Category</label>
              <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-text-muted text-xs mb-1">Title</label>
              <input className="input text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tip title..." />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-text-muted text-xs mb-1">Body</label>
            <textarea className="input text-sm min-h-[100px] resize-y" value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Tip content..." />
          </div>
          <div className="mb-5">
            <label className="block text-text-muted text-xs mb-1">Source (optional)</label>
            <input className="input text-sm" value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Author (Year). Title. Publisher." />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={!form.title || !form.body || saving}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-40">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={cancelForm} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      {loading && <div className="text-text-muted text-sm animate-pulse">Loading...</div>}

      <div className="space-y-2">
        {filtered.map(tip => (
          <div key={tip.id}
            className={`card p-4 flex gap-4 items-start transition-opacity ${tip.is_active ? '' : 'opacity-40'}`}
            style={{ borderLeftColor: `${CATEGORY_COLORS[tip.category]}60`, borderLeftWidth: 3 }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium capitalize" style={{ color: CATEGORY_COLORS[tip.category] }}>
                  {CATEGORY_LABELS[tip.category]}
                </span>
                {!tip.is_active && <span className="text-xs text-text-muted">(hidden)</span>}
              </div>
              <p className="font-medium text-text-primary text-sm">{tip.title}</p>
              <p className="text-text-muted text-xs mt-1 line-clamp-2">{tip.body}</p>
              {tip.source && <p className="text-text-muted text-xs italic mt-1">{tip.source}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => toggleActive(tip)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${tip.is_active ? 'border-base-600 text-text-muted hover:text-text-primary' : 'border-accent/40 text-accent'}`}>
                {tip.is_active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => startEdit(tip)} className="text-xs text-accent hover:underline">Edit</button>
              <button onClick={() => deleteTip(tip)} className="text-xs text-heat-critical/60 hover:text-heat-critical">Delete</button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">No tips in this category</p>
        )}
      </div>
    </div>
  );
}

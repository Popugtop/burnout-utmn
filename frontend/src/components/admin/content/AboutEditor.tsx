import { useState, useEffect } from 'react';
import { adminFetch } from '../../../hooks/useAdmin';

interface Section {
  id: string;
  section_key: string;
  title: string;
  body: string;
  meta_json: string | null;
}

interface Source {
  id: string;
  author: string;
  year: number | null;
  title: string;
  publication: string | null;
  order_index: number;
}

interface AboutData {
  sections: Section[];
  sources: Source[];
}

const SECTION_LABELS: Record<string, string> = {
  page_meta: 'Page Header',
  project: 'About the Project',
  methodology: 'Methodology',
};

const EMPTY_SOURCE = { author: '', year: '', title: '', publication: '' };

export default function AboutEditor() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', body: '' });
  const [metaSubtitle, setMetaSubtitle] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  const [addingSource, setAddingSource] = useState(false);
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [savingSource, setSavingSource] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await adminFetch<AboutData>('/api/admin/cms/about');
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEditSection(section: Section) {
    setEditingSection(section.section_key);
    if (section.section_key === 'page_meta') {
      try { setMetaSubtitle(JSON.parse(section.body).subtitle || ''); } catch { setMetaSubtitle(''); }
      setSectionForm({ title: section.title, body: '' });
    } else {
      setSectionForm({ title: section.title, body: section.body });
    }
  }

  async function saveSection() {
    if (!editingSection) return;
    setSavingSection(true);
    try {
      const payload: Record<string, string> = {};
      if (editingSection === 'page_meta') {
        payload.title = sectionForm.title;
        payload.body = JSON.stringify({ subtitle: metaSubtitle });
      } else {
        payload.title = sectionForm.title;
        payload.body = sectionForm.body;
      }
      await adminFetch(`/api/admin/cms/about/sections/${editingSection}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setEditingSection(null);
      await load();
    } finally {
      setSavingSection(false);
    }
  }

  async function saveSource() {
    setSavingSource(true);
    try {
      const payload = {
        author: sourceForm.author,
        year: sourceForm.year ? parseInt(sourceForm.year, 10) : null,
        title: sourceForm.title,
        publication: sourceForm.publication || null,
      };
      if (editingSource) {
        await adminFetch(`/api/admin/cms/sources/${editingSource.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/api/admin/cms/sources', { method: 'POST', body: JSON.stringify(payload) });
      }
      setAddingSource(false);
      setEditingSource(null);
      setSourceForm(EMPTY_SOURCE);
      await load();
    } finally {
      setSavingSource(false);
    }
  }

  async function deleteSource(id: string) {
    if (!confirm('Delete this source?')) return;
    await adminFetch(`/api/admin/cms/sources/${id}`, { method: 'DELETE' });
    await load();
  }

  function startEditSource(s: Source) {
    setEditingSource(s);
    setAddingSource(false);
    setSourceForm({ author: s.author, year: s.year ? String(s.year) : '', title: s.title, publication: s.publication || '' });
  }

  const editableSections = data?.sections.filter(s => s.section_key !== 'page_meta') || [];
  const pageMeta = data?.sections.find(s => s.section_key === 'page_meta');

  return (
    <div className="space-y-8">
      {loading && <div className="text-text-muted text-sm animate-pulse">Loading...</div>}

      {data && (
        <>
          {/* Page header */}
          {pageMeta && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-semibold">Page Header</h3>
                <button onClick={() => startEditSection(pageMeta)} className="text-accent text-xs hover:underline">Edit</button>
              </div>
              {editingSection === 'page_meta' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Page Title</label>
                    <input className="input text-sm" value={sectionForm.title}
                      onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Subtitle</label>
                    <input className="input text-sm" value={metaSubtitle}
                      onChange={e => setMetaSubtitle(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveSection} disabled={savingSection} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-40">
                      {savingSection ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingSection(null)} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-text-muted text-sm">
                  <p>Title: <span className="text-text-secondary">{pageMeta.title}</span></p>
                  <p>Subtitle: <span className="text-text-secondary">
                    {(() => { try { return JSON.parse(pageMeta.body).subtitle; } catch { return '—'; } })()}
                  </span></p>
                </div>
              )}
            </div>
          )}

          {/* Text sections */}
          {editableSections.map(section => (
            <div key={section.section_key} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-semibold">
                  {SECTION_LABELS[section.section_key] || section.section_key}
                </h3>
                <button onClick={() => startEditSection(section)} className="text-accent text-xs hover:underline">Edit</button>
              </div>
              {editingSection === section.section_key ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Section Title</label>
                    <input className="input text-sm" value={sectionForm.title}
                      onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Content (use blank line for paragraph break)</label>
                    <textarea className="input text-sm min-h-[120px] resize-y" value={sectionForm.body}
                      onChange={e => setSectionForm(f => ({ ...f, body: e.target.value }))} />
                  </div>
                  {section.section_key === 'methodology' && (
                    <p className="text-text-muted text-xs">Note: The four dimension cards are edited separately in the DB. Contact admin to update them.</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={saveSection} disabled={savingSection} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-40">
                      {savingSection ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingSection(null)} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-text-muted text-sm line-clamp-3">{section.body}</p>
              )}
            </div>
          ))}

          {/* Sources */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold">Sources / Bibliography</h3>
              <button onClick={() => { setAddingSource(true); setEditingSource(null); setSourceForm(EMPTY_SOURCE); }}
                className="text-accent text-xs hover:underline">+ Add Source</button>
            </div>

            {(addingSource || editingSource) && (
              <div className="card p-4 mb-4 border-accent/20">
                <h4 className="text-sm font-medium text-text-secondary mb-3">{editingSource ? 'Edit Source' : 'New Source'}</h4>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Author(s)</label>
                    <input className="input text-sm" value={sourceForm.author}
                      onChange={e => setSourceForm(f => ({ ...f, author: e.target.value }))}
                      placeholder="Maslach, C., & Leiter, M. P." />
                  </div>
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Year</label>
                    <input className="input text-sm" value={sourceForm.year}
                      onChange={e => setSourceForm(f => ({ ...f, year: e.target.value }))}
                      placeholder="2024" type="number" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-text-muted text-xs mb-1">Title</label>
                    <input className="input text-sm" value={sourceForm.title}
                      onChange={e => setSourceForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="The Truth About Burnout" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-text-muted text-xs mb-1">Publication</label>
                    <input className="input text-sm" value={sourceForm.publication}
                      onChange={e => setSourceForm(f => ({ ...f, publication: e.target.value }))}
                      placeholder="Journal of Psychology, 10(2), 44-56." />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveSource} disabled={!sourceForm.author || !sourceForm.title || savingSource}
                    className="btn-primary text-sm py-1.5 px-4 disabled:opacity-40">
                    {savingSource ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setAddingSource(false); setEditingSource(null); }}
                    className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(data.sources || []).map((s, i) => (
                <div key={s.id} className="flex items-start gap-3 py-2 border-b border-base-700/40 last:border-0">
                  <span className="text-text-muted text-xs font-mono mt-0.5 w-5 shrink-0">{i + 1}.</span>
                  <div className="flex-1 text-sm text-text-secondary">
                    <span className="text-text-primary font-medium">{s.author}</span>
                    {s.year ? ` (${s.year})` : ''}. <em>{s.title}</em>
                    {s.publication ? `. ${s.publication}` : '.'}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEditSource(s)} className="text-xs text-accent hover:underline">Edit</button>
                    <button onClick={() => deleteSource(s.id)} className="text-xs text-heat-critical/60 hover:text-heat-critical">×</button>
                  </div>
                </div>
              ))}
              {data.sources.length === 0 && (
                <p className="text-text-muted text-sm text-center py-4">No sources yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

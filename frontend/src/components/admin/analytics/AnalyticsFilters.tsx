import { AnalyticsFilters } from '../../../types';
import { DEPARTMENTS } from '../../../data/departments';

interface Props {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
}

export default function AnalyticsFiltersPanel({ filters, onChange }: Props) {
  const set = (key: keyof AnalyticsFilters, value: string | boolean) =>
    onChange({ ...filters, [key]: value });

  const hasFilters = filters.date_from || filters.date_to || filters.course_years ||
    filters.departments || !filters.exclude_suspicious;

  return (
    <div className="card p-4 mb-6 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-text-muted text-xs mb-1">From</label>
          <input type="date" value={filters.date_from} onChange={e => set('date_from', e.target.value)}
            className="input text-sm w-36" />
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">To</label>
          <input type="date" value={filters.date_to} onChange={e => set('date_to', e.target.value)}
            className="input text-sm w-36" />
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">Course Years</label>
          <select value={filters.course_years} onChange={e => set('course_years', e.target.value)} className="input text-sm w-32">
            <option value="">All years</option>
            {[1,2,3,4,5].map(y => <option key={y} value={String(y)}>Year {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">Department</label>
          <select value={filters.departments} onChange={e => set('departments', e.target.value)} className="input text-sm max-w-[180px]">
            <option value="">All departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d.split(' ').slice(-1)[0]}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-text-secondary text-sm cursor-pointer">
          <input type="checkbox" checked={filters.exclude_suspicious}
            onChange={e => set('exclude_suspicious', e.target.checked)}
            className="w-4 h-4 rounded" />
          Exclude suspicious
        </label>
        {hasFilters && (
          <button onClick={() => onChange({ date_from: '', date_to: '', course_years: '', departments: '', exclude_suspicious: true })}
            className="text-accent text-sm hover:underline">
            Reset
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Today', from: new Date().toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) },
          { label: 'Last 7d', from: new Date(Date.now()-7*86400000).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) },
          { label: 'Last 30d', from: new Date(Date.now()-30*86400000).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) },
          { label: 'All time', from: '', to: '' },
        ].map(preset => (
          <button key={preset.label}
            onClick={() => onChange({ ...filters, date_from: preset.from, date_to: preset.to })}
            className="text-text-muted text-xs px-2 py-1 rounded border border-base-600 hover:border-accent hover:text-accent transition-colors">
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

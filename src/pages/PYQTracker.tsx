import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { PYQ, SUBJECTS, Subject } from '@/lib/types';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { getSubjectProgress } from '@/lib/store';

export default function PYQTracker() {
  const { data, addPYQ, updatePYQ, deletePYQ } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Subject | 'All'>('All');

  const [form, setForm] = useState({
    subject: SUBJECTS[0] as Subject,
    topic: '',
    year: 2024,
    solved: false,
    revisionNeeded: false,
  });

  const filtered = filter === 'All' ? data.pyqs : data.pyqs.filter(p => p.subject === filter);

  // PYQ stats per subject
  const pyqStats = SUBJECTS.map(s => {
    const all = data.pyqs.filter(p => p.subject === s);
    const solved = all.filter(p => p.solved).length;
    return { subject: s, solved, total: all.length, pct: all.length > 0 ? Math.round((solved / all.length) * 100) : 0 };
  }).filter(s => s.total > 0);

  const handleSubmit = () => {
    if (!form.topic.trim()) return;
    addPYQ(form);
    setForm({ subject: SUBJECTS[0], topic: '', year: 2024, solved: false, revisionNeeded: false });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PYQ Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track Previous Year Questions by subject</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add PYQ
        </button>
      </div>

      {/* PYQ Coverage */}
      {pyqStats.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3">PYQ Coverage by Subject</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pyqStats.map(s => (
              <div key={s.subject} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground">{s.subject}</span>
                  <span className="text-xs text-muted-foreground">{s.solved}/{s.total} ({s.pct}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('All')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>All</button>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{s}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Add PYQ</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value as Subject }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
              <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. SQL Queries" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.solved} onChange={e => setForm(p => ({ ...p, solved: e.target.checked }))} className="rounded" />
                <span className="text-sm text-foreground">Solved</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.revisionNeeded} onChange={e => setForm(p => ({ ...p, revisionNeeded: e.target.checked }))} className="rounded" />
                <span className="text-sm text-foreground">Needs Revision</span>
              </label>
            </div>
          </div>
          <button onClick={handleSubmit} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Check className="w-4 h-4" /> Add
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Topic</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Solved</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rev Needed</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No PYQs yet.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{p.subject}</td>
                  <td className="px-4 py-3 text-foreground">{p.topic}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.year}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updatePYQ({ ...p, solved: !p.solved })} className={`text-xs px-2 py-0.5 rounded-md font-medium ${p.solved ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {p.solved ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">{p.revisionNeeded ? <span className="text-warning text-xs font-medium">Yes</span> : <span className="text-muted-foreground text-xs">No</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deletePYQ(p.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

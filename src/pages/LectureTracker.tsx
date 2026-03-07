import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Lecture, LectureStatus, SUBJECTS, Subject } from '@/lib/types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { generateId, getToday } from '@/lib/store';

const statusColors: Record<LectureStatus, string> = {
  'Not Started': 'bg-secondary text-muted-foreground',
  'In Progress': 'bg-warning/15 text-warning',
  'Completed': 'bg-success/15 text-success',
};

export default function LectureTracker() {
  const { data, addLecture, updateLecture, deleteLecture } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Subject | 'All'>('All');

  const [form, setForm] = useState({
    subject: SUBJECTS[0] as Subject,
    lectureNumber: 1,
    topic: '',
    status: 'Not Started' as LectureStatus,
    difficulty: 3,
    pyqSolved: false,
  });

  const filtered = filter === 'All' ? data.lectures : data.lectures.filter(l => l.subject === filter);

  const handleSubmit = () => {
    if (!form.topic.trim()) return;
    if (editId) {
      const existing = data.lectures.find(l => l.id === editId)!;
      updateLecture({
        ...existing,
        ...form,
        completedDate: form.status === 'Completed' && !existing.completedDate ? getToday() : existing.completedDate,
      });
      setEditId(null);
    } else {
      addLecture({
        ...form,
        revisionCount: 0,
        lastRevision: null,
        nextRevision: null,
        completedDate: form.status === 'Completed' ? getToday() : null,
      });
    }
    setForm({ subject: SUBJECTS[0], lectureNumber: 1, topic: '', status: 'Not Started', difficulty: 3, pyqSolved: false });
    setShowForm(false);
  };

  const startEdit = (lecture: Lecture) => {
    setForm({
      subject: lecture.subject,
      lectureNumber: lecture.lectureNumber,
      topic: lecture.topic,
      status: lecture.status,
      difficulty: lecture.difficulty,
      pyqSolved: lecture.pyqSolved,
    });
    setEditId(lecture.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lecture Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your lecture progress across all subjects</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ subject: SUBJECTS[0], lectureNumber: 1, topic: '', status: 'Not Started', difficulty: 3, pyqSolved: false }); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Lecture
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('All')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>All</button>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{editId ? 'Edit Lecture' : 'Add New Lecture'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value as Subject }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lecture #</label>
              <input type="number" min={1} value={form.lectureNumber} onChange={e => setForm(p => ({ ...p, lectureNumber: +e.target.value }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
              <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. CFG Simplification" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as LectureStatus }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty (1-5)</label>
              <input type="number" min={1} max={5} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: Math.min(5, Math.max(1, +e.target.value)) }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pyqSolved} onChange={e => setForm(p => ({ ...p, pyqSolved: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm text-foreground">PYQ Solved</span>
              </label>
            </div>
          </div>
          <button onClick={handleSubmit} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Check className="w-4 h-4" /> {editId ? 'Update' : 'Add'}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Topic</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Diff</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">PYQ</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rev</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No lectures yet. Add your first one!</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{l.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.lectureNumber}</td>
                  <td className="px-4 py-3 text-foreground">{l.topic}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[l.status]}`}>{l.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{'★'.repeat(l.difficulty)}{'☆'.repeat(5 - l.difficulty)}</td>
                  <td className="px-4 py-3">{l.pyqSolved ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.revisionCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(l)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteLecture(l.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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

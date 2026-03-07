import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { SUBJECTS, Subject } from '@/lib/types';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { getToday } from '@/lib/store';

export default function StudyLogs() {
  const { data, addStudyLog, deleteStudyLog } = useAppData();
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: getToday(),
    subject: SUBJECTS[0] as Subject,
    topic: '',
    hoursStudied: 1,
    notes: '',
  });

  const sorted = [...data.studyLogs].sort((a, b) => b.date.localeCompare(a.date));

  const handleSubmit = () => {
    if (!form.topic.trim()) return;
    addStudyLog(form);
    setForm({ date: getToday(), subject: SUBJECTS[0], topic: '', hoursStudied: 1, notes: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Log your daily study sessions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Log Study Session</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value as Subject }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
              <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="What did you study?" className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hours</label>
              <input type="number" min={0.5} step={0.5} value={form.hoursStudied} onChange={e => setForm(p => ({ ...p, hoursStudied: +e.target.value }))} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Optional notes..." className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
          </div>
          <button onClick={handleSubmit} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Check className="w-4 h-4" /> Log
          </button>
        </div>
      )}

      {/* Logs */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">No study logs yet. Start logging!</div>
        ) : sorted.map(log => (
          <div key={log.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{log.topic}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">{log.subject}</span>
                <span className="text-xs text-muted-foreground">{log.hoursStudied}h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{log.date}</p>
              {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
            </div>
            <button onClick={() => deleteStudyLog(log.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

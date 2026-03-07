import { useAppData } from '@/hooks/useAppData';
import { getSubjectProgress, getWeakTopics, getTodayRevisions, calculateStreak, getToday } from '@/lib/store';
import { BookOpen, CheckCircle2, Clock, TrendingUp, Flame, AlertTriangle, CalendarCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data, completeRevision, skipRevision } = useAppData();

  const subjectProgress = getSubjectProgress(data.lectures, data.subjectSettings);
  const totalLectures = data.subjectSettings.reduce((s, c) => s + c.totalLectures, 0);
  const completedLectures = data.lectures.filter(l => l.status === 'Completed').length;
  const remaining = totalLectures - completedLectures;
  const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
  const weakTopics = getWeakTopics(data.lectures);
  const todayRevisions = getTodayRevisions(data.revisions);
  const streak = calculateStreak(data);

  // Weekly study hours
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const hours = data.studyLogs.filter(l => l.date === dateStr).reduce((s, l) => s + l.hoursStudied, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), hours };
  });

  const stats = [
    { label: 'Total Lectures', value: totalLectures, icon: BookOpen, color: 'text-chart-5' },
    { label: 'Completed', value: completedLectures, icon: CheckCircle2, color: 'text-success' },
    { label: 'Remaining', value: remaining, icon: Clock, color: 'text-warning' },
    { label: 'Progress', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your GATE CSE preparation overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 stat-glow">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-secondary ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak + Weak topics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Study Streak</h3>
          </div>
          <p className="text-4xl font-bold text-foreground">{streak} <span className="text-base font-normal text-muted-foreground">days</span></p>
          <p className="text-xs text-muted-foreground mt-1">Keep studying daily to maintain your streak!</p>
        </div>

        {/* Today's Revisions */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Today's Revision Tasks</h3>
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{todayRevisions.length}</span>
          </div>
          {todayRevisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revisions due today. 🎉</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {todayRevisions.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.topic}</span>
                    <span className="text-xs text-muted-foreground ml-2">({r.subject})</span>
                  </div>
                  <button onClick={() => completeRevision(r.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md font-medium hover:opacity-90 transition-opacity">
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bars + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject Progress */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Subject Progress</h3>
          <div className="space-y-3">
            {subjectProgress.map(s => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate max-w-[60%]">{s.subject}</span>
                  <span className="text-xs text-muted-foreground">{s.completed}/{s.total} ({s.percentage}%)</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Weak Topics</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {weakTopics.map(t => (
              <div key={t.id} className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-foreground">{t.topic}</p>
                <p className="text-xs text-muted-foreground">{t.subject} · Difficulty {t.difficulty}/5 · Revised {t.revisionCount}x</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

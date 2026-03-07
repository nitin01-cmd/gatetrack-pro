import { useAppData } from '@/hooks/useAppData';
import { SUBJECTS } from '@/lib/types';
import { getSubjectProgress, calculateStreak } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  'hsl(172, 66%, 50%)', 'hsl(262, 60%, 55%)', 'hsl(38, 92%, 50%)', 
  'hsl(0, 72%, 51%)', 'hsl(220, 70%, 55%)', 'hsl(142, 71%, 45%)',
];

export default function Analytics() {
  const { data } = useAppData();
  const streak = calculateStreak(data);
  const subjectProgress = getSubjectProgress(data.lectures, data.subjectSettings);

  // Weekly study hours
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const hours = data.studyLogs.filter(l => l.date === dateStr).reduce((s, l) => s + l.hoursStudied, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), hours };
  });

  // Monthly (last 30 days)
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const hours = data.studyLogs.filter(l => l.date === dateStr).reduce((s, l) => s + l.hoursStudied, 0);
    return { day: d.getDate().toString(), hours };
  });

  // Subject distribution
  const subjectHours = SUBJECTS.map(s => ({
    name: s,
    hours: data.studyLogs.filter(l => l.subject === s).reduce((sum, l) => sum + l.hoursStudied, 0),
  })).filter(s => s.hours > 0);

  const totalHours = data.studyLogs.reduce((s, l) => s + l.hoursStudied, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your study performance insights</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: totalHours.toFixed(1) },
          { label: 'Study Streak', value: `${streak} days` },
          { label: 'Sessions Logged', value: data.studyLogs.length },
          { label: 'Subjects Active', value: subjectHours.length },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Progress (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthDays}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject distribution */}
      {subjectHours.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Study Distribution by Subject</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectHours} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

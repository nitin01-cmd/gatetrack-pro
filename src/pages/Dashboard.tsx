import { useAppData } from '@/hooks/useAppData';
import { getSubjectProgress, getWeakTopics, getTodayRevisions, calculateStreak, getToday } from '@/lib/store';
import { getQuoteOfTheDay, getDailyReminder, getMilestoneMessage } from '@/lib/motivationalQuotes';
import { BookOpen, CheckCircle2, Clock, TrendingUp, Flame, AlertTriangle, CalendarCheck, Quote, Target, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

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
  const today = getToday();
  const overdueRevisions = data.revisions.filter(r => !r.completed && r.dueDate < today && r.status === 'Pending');

  const quote = getQuoteOfTheDay();
  const reminder = getDailyReminder();
  const milestone = getMilestoneMessage(overallProgress);

  // Weekly study hours
  const todayDate = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const hours = data.studyLogs.filter(l => l.date === dateStr).reduce((s, l) => s + l.hoursStudied, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), hours };
  });

  // PYQ Coverage
  const pyqTotal = data.pyqs.length;
  const pyqSolved = data.pyqs.filter(p => p.solved).length;
  const pyqPercentage = pyqTotal > 0 ? Math.round((pyqSolved / pyqTotal) * 100) : 0;

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

      {/* TOP SECTION: Motivation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quote of the Day */}
        <div className="glass-card rounded-xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Quote className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Quote of the Day</h3>
          </div>
          <p className="text-foreground italic text-sm leading-relaxed">"{quote}"</p>
        </div>

        {/* Study Streak */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Study Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-primary">{streak}</p>
            <span className="text-base font-medium text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Keep studying daily to maintain your streak!</p>
        </div>

        {/* Today's Reminder */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Today's Reminder</h3>
          </div>
          <p className="text-foreground text-sm leading-relaxed">"{reminder}"</p>
        </div>
      </div>

      {/* Today's Revision Tasks */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarCheck className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Today's Revision Tasks</h3>
          <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">{todayRevisions.length}</span>
          {overdueRevisions.length > 0 && (
            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-medium">{overdueRevisions.length} overdue</span>
          )}
          <Link to="/revisions" className="text-xs text-primary hover:underline font-medium ml-2">View All →</Link>
        </div>
        {todayRevisions.length === 0 && overdueRevisions.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-success" />
            No revisions due today. Great job staying on track! 🎉
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {overdueRevisions.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.topic}</span>
                    <span className="text-xs text-muted-foreground ml-2">({r.subject})</span>
                  </div>
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded font-medium">Overdue</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => completeRevision(r.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/85 transition-colors">Done</button>
                  <button onClick={() => skipRevision(r.id)} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md font-medium hover:bg-muted/80 transition-colors">Skip</button>
                </div>
              </div>
            ))}
            {todayRevisions.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between bg-warning/5 border border-warning/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-warning" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.topic}</span>
                    <span className="text-xs text-muted-foreground ml-2">({r.subject})</span>
                  </div>
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded font-medium">Due Today</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => completeRevision(r.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/85 transition-colors">Done</button>
                  <button onClick={() => skipRevision(r.id)} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md font-medium hover:bg-muted/80 transition-colors">Skip</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MIDDLE SECTION: Stats + Progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 stat-glow">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
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

      {/* Overall Progress with Motivation */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Overall Progress</h3>
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-3 mb-3" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{milestone.emoji}</span>
          <span>You are {overallProgress}% done with your GATE preparation. {milestone.message}</span>
        </div>
      </div>

      {/* Subject-wise Progress */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Subject-wise Progress</h3>
        <div className="space-y-4">
          {subjectProgress.map(s => (
            <div key={s.subject}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{s.subject}</span>
                <span className="text-sm text-muted-foreground">{s.completed}/{s.total} ({s.percentage}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: Weak Topics, PYQ Coverage, Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weak Topics */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Weak Topics</h3>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weak topics identified yet. Keep studying!</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {weakTopics.map(t => (
                <div key={t.id} className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{t.topic}</p>
                  <p className="text-xs text-muted-foreground">{t.subject} · Difficulty {t.difficulty}/5 · Revised {t.revisionCount}x</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PYQ Coverage */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">PYQ Coverage</h3>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl font-bold text-foreground">{pyqPercentage}%</div>
            <div className="text-sm text-muted-foreground">
              <p>{pyqSolved} of {pyqTotal} questions solved</p>
            </div>
          </div>
          <Progress value={pyqPercentage} className="h-2" />
          <Link to="/pyqs" className="inline-block mt-3 text-sm text-primary hover:underline font-medium">View PYQ Tracker →</Link>
        </div>
      </div>

      {/* Weekly Study Hours Chart */}
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
  );
}

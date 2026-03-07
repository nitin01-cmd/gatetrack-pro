import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { getToday } from '@/lib/store';
import { Revision, SUBJECTS, RevisionStatus } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  CalendarCheck, CheckCircle2, Clock, AlertTriangle,
  SkipForward, CalendarIcon, Filter, List, CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'calendar';
type FilterStatus = 'all' | RevisionStatus | 'overdue' | 'today';

export default function RevisionManager() {
  const { data, completeRevision, skipRevision, rescheduleRevision, updateRevisionNotes } = useAppData();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [selectedCalDate, setSelectedCalDate] = useState<Date | undefined>(new Date());

  const today = getToday();

  // Derive effective status for display
  function getEffectiveStatus(r: Revision): RevisionStatus {
    if (r.status === 'Completed' || r.status === 'Skipped') return r.status;
    if (r.dueDate < today && !r.completed) return 'Missed';
    return 'Pending';
  }

  const enrichedRevisions = data.revisions.map(r => ({
    ...r,
    effectiveStatus: getEffectiveStatus(r),
    isToday: r.dueDate === today,
    isOverdue: r.dueDate < today && !r.completed && r.status === 'Pending',
  }));

  const filtered = enrichedRevisions.filter(r => {
    if (filterSubject !== 'all' && r.subject !== filterSubject) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'today') return r.isToday && !r.completed;
    if (filterStatus === 'overdue') return r.isOverdue;
    return r.effectiveStatus === filterStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    // Pending first, then by date
    const statusOrder = { Pending: 0, Missed: 1, Completed: 2, Skipped: 3 };
    const diff = statusOrder[a.effectiveStatus] - statusOrder[b.effectiveStatus];
    if (diff !== 0) return diff;
    return a.dueDate.localeCompare(b.dueDate);
  });

  // Stats
  const totalPending = enrichedRevisions.filter(r => r.effectiveStatus === 'Pending').length;
  const dueToday = enrichedRevisions.filter(r => r.isToday && !r.completed).length;
  const overdue = enrichedRevisions.filter(r => r.isOverdue).length;
  const completedCount = enrichedRevisions.filter(r => r.effectiveStatus === 'Completed').length;

  // Calendar: get dates with revisions
  const revisionsByDate = enrichedRevisions.reduce((acc, r) => {
    if (!acc[r.dueDate]) acc[r.dueDate] = [];
    acc[r.dueDate].push(r);
    return acc;
  }, {} as Record<string, typeof enrichedRevisions>);

  const selectedDateStr = selectedCalDate ? format(selectedCalDate, 'yyyy-MM-dd') : '';
  const calendarDayRevisions = revisionsByDate[selectedDateStr] || [];

  function getStatusColor(status: RevisionStatus, isOverdue: boolean, isToday: boolean) {
    if (status === 'Completed') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (status === 'Skipped') return 'text-muted-foreground bg-muted/50 border-border';
    if (isOverdue) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (isToday) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-primary bg-primary/10 border-primary/20';
  }

  function getStatusIcon(status: RevisionStatus, isOverdue: boolean, isToday: boolean) {
    if (status === 'Completed') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'Skipped') return <SkipForward className="w-4 h-4 text-muted-foreground" />;
    if (isOverdue) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isToday) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CalendarCheck className="w-4 h-4 text-primary" />;
  }

  function getStatusBadge(status: RevisionStatus, isOverdue: boolean, isToday: boolean) {
    if (status === 'Completed') return 'Completed';
    if (status === 'Skipped') return 'Skipped';
    if (isOverdue) return 'Overdue';
    if (isToday) return 'Due Today';
    return 'Pending';
  }

  function handleSaveNotes(id: string) {
    updateRevisionNotes(id, notesValue);
    setEditingNotes(null);
  }

  function handleReschedule(id: string, date: Date | undefined) {
    if (!date) return;
    rescheduleRevision(id, format(date, 'yyyy-MM-dd'));
    setRescheduleId(null);
  }

  // Calendar day modifiers
  const calendarModifiers = {
    hasRevision: Object.keys(revisionsByDate).map(d => new Date(d + 'T00:00:00')),
    hasOverdue: Object.entries(revisionsByDate)
      .filter(([, revs]) => revs.some(r => r.isOverdue))
      .map(([d]) => new Date(d + 'T00:00:00')),
    hasCompleted: Object.entries(revisionsByDate)
      .filter(([, revs]) => revs.every(r => r.effectiveStatus === 'Completed'))
      .map(([d]) => new Date(d + 'T00:00:00')),
  };

  const stats = [
    { label: 'Due Today', value: dueToday, icon: Clock, colorClass: 'text-yellow-500' },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, colorClass: 'text-red-500' },
    { label: 'Pending', value: totalPending, icon: CalendarCheck, colorClass: 'text-primary' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, colorClass: 'text-green-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revision Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Spaced repetition revision tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-1" /> List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="w-4 h-4 mr-1" /> Calendar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-secondary", s.colorClass)}>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="text-sm bg-secondary text-foreground border border-border rounded-lg px-3 py-1.5"
        >
          <option value="all">All Status</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Skipped">Skipped</option>
        </select>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="text-sm bg-secondary text-foreground border border-border rounded-lg px-3 py-1.5"
        >
          <option value="all">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <CalendarCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No revisions found. Complete lectures to generate revision tasks.</p>
            </div>
          ) : (
            sorted.map(r => (
              <div
                key={r.id}
                className={cn(
                  "glass-card rounded-xl p-4 border transition-all",
                  getStatusColor(r.effectiveStatus, r.isOverdue, r.isToday)
                )}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(r.effectiveStatus, r.isOverdue, r.isToday)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{r.topic}</p>
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{r.subject}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          getStatusColor(r.effectiveStatus, r.isOverdue, r.isToday)
                        )}>
                          {getStatusBadge(r.effectiveStatus, r.isOverdue, r.isToday)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Revision {r.revisionNumber}/4</span>
                        <span>Day +{r.dayInterval}</span>
                        <span>Due: {r.dueDate}</span>
                        {r.completedDate && <span>Done: {r.completedDate}</span>}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">📝 {r.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!r.completed && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => completeRevision(r.id)} className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => skipRevision(r.id)} className="text-xs">
                        <SkipForward className="w-3 h-3 mr-1" /> Skip
                      </Button>
                      <Popover open={rescheduleId === r.id} onOpenChange={open => setRescheduleId(open ? r.id : null)}>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs">
                            <CalendarIcon className="w-3 h-3 mr-1" /> Reschedule
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={new Date(r.dueDate + 'T00:00:00')}
                            onSelect={(d) => handleReschedule(r.id, d)}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {editingNotes === r.id ? (
                        <div className="flex items-center gap-1">
                          <Textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            className="text-xs h-8 w-32"
                            placeholder="Add notes..."
                          />
                          <Button size="sm" variant="outline" onClick={() => handleSaveNotes(r.id)} className="text-xs">Save</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => { setEditingNotes(r.id); setNotesValue(r.notes); }}
                        >
                          📝
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-4">
            <Calendar
              mode="single"
              selected={selectedCalDate}
              onSelect={setSelectedCalDate}
              modifiers={calendarModifiers}
              modifiersClassNames={{
                hasRevision: 'bg-primary/20 font-bold',
                hasOverdue: 'bg-red-500/20 text-red-500 font-bold',
                hasCompleted: 'bg-green-500/20 text-green-500',
              }}
              className={cn("p-3 pointer-events-auto w-full")}
            />
            <div className="flex items-center gap-4 mt-3 px-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/30" /> Scheduled</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/30" /> Overdue</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/30" /> All Done</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">
              {selectedCalDate ? format(selectedCalDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>
            {calendarDayRevisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revisions on this date.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {calendarDayRevisions.map(r => (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 border",
                      getStatusColor(r.effectiveStatus, r.isOverdue, r.isToday)
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(r.effectiveStatus, r.isOverdue, r.isToday)}
                      <div>
                        <p className="text-sm font-medium text-foreground truncate">{r.topic}</p>
                        <p className="text-xs text-muted-foreground">{r.subject} · Rev {r.revisionNumber}/4</p>
                      </div>
                    </div>
                    {!r.completed && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => completeRevision(r.id)} className="text-xs h-7 px-2">Done</Button>
                        <Button size="sm" variant="outline" onClick={() => skipRevision(r.id)} className="text-xs h-7 px-2">Skip</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

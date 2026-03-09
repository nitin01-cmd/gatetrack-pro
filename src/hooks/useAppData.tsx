import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppData, Lecture, PYQ, StudyLog, Revision, SubjectSettings, SUBJECTS } from '@/lib/types';
import { addDays, getToday } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const REVISION_INTERVALS = [1, 7, 21, 60];

const celebrationMessages = [
  "Great work! Another step closer to your GATE goal. 🎯",
  "Awesome! Keep up the momentum! 💪",
  "You're crushing it! Stay consistent! 🔥",
  "Excellent progress! Every lecture counts! ✨",
  "Well done! Success is built one step at a time! 🚀",
];

function getCelebrationMessage() {
  return celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
}

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#D32F2F', '#FF5252', '#4CAF50', '#FFC107'],
  });
}

const defaultSettings: SubjectSettings[] = SUBJECTS.map(subject => ({
  subject,
  totalLectures: 30,
}));

const emptyData: AppData = {
  lectures: [],
  pyqs: [],
  studyLogs: [],
  revisions: [],
  subjectSettings: defaultSettings,
  studyStreak: 0,
  lastStudyDate: null,
};

interface DataContextType {
  data: AppData;
  loading: boolean;
  addLecture: (lecture: Omit<Lecture, 'id'>) => void;
  updateLecture: (lecture: Lecture) => void;
  deleteLecture: (id: string) => void;
  addPYQ: (pyq: Omit<PYQ, 'id'>) => void;
  updatePYQ: (pyq: PYQ) => void;
  deletePYQ: (id: string) => void;
  addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
  deleteStudyLog: (id: string) => void;
  completeRevision: (id: string) => void;
  skipRevision: (id: string) => void;
  rescheduleRevision: (id: string, newDate: string) => void;
  updateRevisionNotes: (id: string, notes: string) => void;
  updateSettings: (settings: SubjectSettings[]) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);

  // Load all data from DB
  const loadAll = useCallback(async () => {
    if (!user) { setData(emptyData); setLoading(false); return; }
    setLoading(true);
    const uid = user.id;

    const [lecturesRes, pyqsRes, logsRes, revisionsRes, settingsRes, streakRes] = await Promise.all([
      supabase.from('lectures').select('*').eq('user_id', uid),
      supabase.from('pyqs').select('*').eq('user_id', uid),
      supabase.from('study_logs').select('*').eq('user_id', uid),
      supabase.from('revisions').select('*').eq('user_id', uid),
      supabase.from('subject_settings').select('*').eq('user_id', uid),
      supabase.from('user_streaks').select('*').eq('user_id', uid).maybeSingle(),
    ]);

    const lectures: Lecture[] = (lecturesRes.data || []).map((r: any) => ({
      id: r.id,
      subject: r.subject,
      lectureNumber: r.lecture_number,
      topic: r.topic,
      status: r.status,
      difficulty: r.difficulty,
      pyqSolved: r.pyq_solved,
      revisionCount: r.revision_count,
      lastRevision: r.last_revision,
      nextRevision: r.next_revision,
      completedDate: r.completed_date,
    }));

    const pyqs: PYQ[] = (pyqsRes.data || []).map((r: any) => ({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      year: r.year,
      solved: r.solved,
      revisionNeeded: r.revision_needed,
    }));

    const studyLogs: StudyLog[] = (logsRes.data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      subject: r.subject,
      topic: r.topic,
      hoursStudied: Number(r.hours_studied),
      notes: r.notes,
    }));

    const revisions: Revision[] = (revisionsRes.data || []).map((r: any) => ({
      id: r.id,
      lectureId: r.lecture_id,
      subject: r.subject,
      topic: r.topic,
      dueDate: r.due_date,
      completed: r.completed,
      status: r.status,
      dayInterval: r.day_interval,
      revisionNumber: r.revision_number,
      notes: r.notes,
      completedDate: r.completed_date,
    }));

    let subjectSettings = defaultSettings;
    if (settingsRes.data && settingsRes.data.length > 0) {
      subjectSettings = SUBJECTS.map(subject => {
        const found = settingsRes.data!.find((s: any) => s.subject === subject);
        return { subject, totalLectures: found ? found.total_lectures : 30 };
      });
    }

    const streakData = streakRes.data;
    setData({
      lectures,
      pyqs,
      studyLogs,
      revisions,
      subjectSettings,
      studyStreak: streakData?.study_streak || 0,
      lastStudyDate: streakData?.last_study_date || null,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addLecture = useCallback(async (lecture: Omit<Lecture, 'id'>) => {
    if (!user) return;
    const { data: inserted, error } = await supabase.from('lectures').insert({
      user_id: user.id,
      subject: lecture.subject,
      lecture_number: lecture.lectureNumber,
      topic: lecture.topic,
      status: lecture.status,
      difficulty: lecture.difficulty,
      pyq_solved: lecture.pyqSolved,
      revision_count: lecture.revisionCount,
      last_revision: lecture.lastRevision,
      next_revision: lecture.nextRevision,
      completed_date: lecture.completedDate,
    }).select().single();
    if (error || !inserted) return;

    // Create revisions if completed
    if (lecture.status === 'Completed' && lecture.completedDate) {
      const revs = REVISION_INTERVALS.map((interval, index) => ({
        user_id: user.id,
        lecture_id: inserted.id,
        subject: lecture.subject,
        topic: lecture.topic,
        due_date: addDays(lecture.completedDate!, interval),
        completed: false,
        status: 'Pending',
        day_interval: interval,
        revision_number: index + 1,
        notes: '',
        completed_date: null as string | null,
      }));
      await supabase.from('revisions').insert(revs);
    }
    // Celebrate if completed
    if (lecture.status === 'Completed') {
      triggerConfetti();
      toast.success(getCelebrationMessage());
    }
    loadAll();

  const updateLecture = useCallback(async (lecture: Lecture) => {
    if (!user) return;
    const old = data.lectures.find(l => l.id === lecture.id);
    let completedDate = lecture.completedDate;
    if (old && old.status !== 'Completed' && lecture.status === 'Completed') {
      completedDate = getToday();
    }

    await supabase.from('lectures').update({
      subject: lecture.subject,
      lecture_number: lecture.lectureNumber,
      topic: lecture.topic,
      status: lecture.status,
      difficulty: lecture.difficulty,
      pyq_solved: lecture.pyqSolved,
      revision_count: lecture.revisionCount,
      last_revision: lecture.lastRevision,
      next_revision: lecture.nextRevision,
      completed_date: completedDate,
    }).eq('id', lecture.id);

    // If just completed, create revisions
    if (old && old.status !== 'Completed' && lecture.status === 'Completed' && completedDate) {
      await supabase.from('revisions').delete().eq('lecture_id', lecture.id);
      const revs = REVISION_INTERVALS.map((interval, index) => ({
        user_id: user.id,
        lecture_id: lecture.id,
        subject: lecture.subject,
        topic: lecture.topic,
        due_date: addDays(completedDate!, interval),
        completed: false,
        status: 'Pending',
        day_interval: interval,
        revision_number: index + 1,
        notes: '',
        completed_date: null as string | null,
      }));
      await supabase.from('revisions').insert(revs);
    }
    // Celebrate if just completed
    if (old && old.status !== 'Completed' && lecture.status === 'Completed') {
      triggerConfetti();
      toast.success(getCelebrationMessage());
    }
    loadAll();
  }, [user, data.lectures, loadAll]);

  const deleteLecture = useCallback(async (id: string) => {
    await supabase.from('lectures').delete().eq('id', id);
    loadAll();
  }, [loadAll]);

  const addPYQ = useCallback(async (pyq: Omit<PYQ, 'id'>) => {
    if (!user) return;
    await supabase.from('pyqs').insert({
      user_id: user.id,
      subject: pyq.subject,
      topic: pyq.topic,
      year: pyq.year,
      solved: pyq.solved,
      revision_needed: pyq.revisionNeeded,
    });
    loadAll();
  }, [user, loadAll]);

  const updatePYQ = useCallback(async (pyq: PYQ) => {
    await supabase.from('pyqs').update({
      subject: pyq.subject,
      topic: pyq.topic,
      year: pyq.year,
      solved: pyq.solved,
      revision_needed: pyq.revisionNeeded,
    }).eq('id', pyq.id);
    loadAll();
  }, [loadAll]);

  const deletePYQ = useCallback(async (id: string) => {
    await supabase.from('pyqs').delete().eq('id', id);
    loadAll();
  }, [loadAll]);

  const addStudyLog = useCallback(async (log: Omit<StudyLog, 'id'>) => {
    if (!user) return;
    await supabase.from('study_logs').insert({
      user_id: user.id,
      date: log.date,
      subject: log.subject,
      topic: log.topic,
      hours_studied: log.hoursStudied,
      notes: log.notes,
    });

    // Update streak
    const today = getToday();
    const yesterday = addDays(today, -1);
    let streak = data.studyStreak;
    const last = data.lastStudyDate;
    if (last === today) { /* same day */ }
    else if (last === yesterday) { streak += 1; }
    else { streak = 1; }

    await supabase.from('user_streaks').upsert({
      user_id: user.id,
      study_streak: streak,
      last_study_date: today,
    });

    loadAll();
  }, [user, data.studyStreak, data.lastStudyDate, loadAll]);

  const deleteStudyLog = useCallback(async (id: string) => {
    await supabase.from('study_logs').delete().eq('id', id);
    loadAll();
  }, [loadAll]);

  const completeRevision = useCallback(async (id: string) => {
    const today = getToday();
    const rev = data.revisions.find(r => r.id === id);
    await supabase.from('revisions').update({
      completed: true,
      status: 'Completed',
      completed_date: today,
    }).eq('id', id);

    if (rev) {
      await supabase.from('lectures').update({
        revision_count: (data.lectures.find(l => l.id === rev.lectureId)?.revisionCount || 0) + 1,
        last_revision: today,
      }).eq('id', rev.lectureId);
    }
    toast.success("Revision completed! Keep up the great work! ✅");
    loadAll();
  }, [data.revisions, data.lectures, loadAll]);

  const skipRevision = useCallback(async (id: string) => {
    await supabase.from('revisions').update({
      status: 'Skipped',
      completed: true,
    }).eq('id', id);
    loadAll();
  }, [loadAll]);

  const rescheduleRevision = useCallback(async (id: string, newDate: string) => {
    await supabase.from('revisions').update({
      due_date: newDate,
      status: 'Pending',
    }).eq('id', id);
    loadAll();
  }, [loadAll]);

  const updateRevisionNotes = useCallback(async (id: string, notes: string) => {
    await supabase.from('revisions').update({ notes }).eq('id', id);
    loadAll();
  }, [loadAll]);

  const updateSettings = useCallback(async (settings: SubjectSettings[]) => {
    if (!user) return;
    const upserts = settings.map(s => ({
      user_id: user.id,
      subject: s.subject,
      total_lectures: s.totalLectures,
    }));
    // Upsert each setting
    for (const u of upserts) {
      await supabase.from('subject_settings').upsert(u, { onConflict: 'user_id,subject' });
    }
    loadAll();
  }, [user, loadAll]);

  const resetData = useCallback(async () => {
    if (!user) return;
    const uid = user.id;
    await Promise.all([
      supabase.from('revisions').delete().eq('user_id', uid),
      supabase.from('lectures').delete().eq('user_id', uid),
      supabase.from('pyqs').delete().eq('user_id', uid),
      supabase.from('study_logs').delete().eq('user_id', uid),
      supabase.from('subject_settings').delete().eq('user_id', uid),
      supabase.from('user_streaks').delete().eq('user_id', uid),
    ]);
    loadAll();
  }, [user, loadAll]);

  return (
    <DataContext.Provider value={{
      data, loading, addLecture, updateLecture, deleteLecture,
      addPYQ, updatePYQ, deletePYQ,
      addStudyLog, deleteStudyLog, completeRevision,
      skipRevision, rescheduleRevision, updateRevisionNotes,
      updateSettings, resetData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}

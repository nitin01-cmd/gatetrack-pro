import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppData, Lecture, PYQ, StudyLog, Revision, SubjectSettings, SUBJECTS } from '@/lib/types';
import { loadData, saveData, generateId, addDays, getToday, createRevisions } from '@/lib/store';
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

function persist(data: AppData) {
  saveData(data);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [loading] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    persist(data);
  }, [data]);

  const addLecture = useCallback((lecture: Omit<Lecture, 'id'>) => {
    setData(prev => {
      const newLecture: Lecture = { ...lecture, id: generateId() };
      let newRevisions = prev.revisions;
      if (newLecture.status === 'Completed' && newLecture.completedDate) {
        newRevisions = [...prev.revisions, ...createRevisions(newLecture)];
      }
      if (newLecture.status === 'Completed') {
        triggerConfetti();
        toast.success(getCelebrationMessage());
      }
      return { ...prev, lectures: [...prev.lectures, newLecture], revisions: newRevisions };
    });
  }, []);

  const updateLecture = useCallback((lecture: Lecture) => {
    setData(prev => {
      const old = prev.lectures.find(l => l.id === lecture.id);
      let completedDate = lecture.completedDate;
      if (old && old.status !== 'Completed' && lecture.status === 'Completed') {
        completedDate = getToday();
      }
      const updated = { ...lecture, completedDate };

      let newRevisions = prev.revisions;
      if (old && old.status !== 'Completed' && lecture.status === 'Completed' && completedDate) {
        newRevisions = [
          ...prev.revisions.filter(r => r.lectureId !== lecture.id),
          ...createRevisions(updated),
        ];
        triggerConfetti();
        toast.success(getCelebrationMessage());
      }

      return {
        ...prev,
        lectures: prev.lectures.map(l => l.id === lecture.id ? updated : l),
        revisions: newRevisions,
      };
    });
  }, []);

  const deleteLecture = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      lectures: prev.lectures.filter(l => l.id !== id),
      revisions: prev.revisions.filter(r => r.lectureId !== id),
    }));
  }, []);

  const addPYQ = useCallback((pyq: Omit<PYQ, 'id'>) => {
    setData(prev => ({
      ...prev,
      pyqs: [...prev.pyqs, { ...pyq, id: generateId() }],
    }));
  }, []);

  const updatePYQ = useCallback((pyq: PYQ) => {
    setData(prev => ({
      ...prev,
      pyqs: prev.pyqs.map(p => p.id === pyq.id ? pyq : p),
    }));
  }, []);

  const deletePYQ = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      pyqs: prev.pyqs.filter(p => p.id !== id),
    }));
  }, []);

  const addStudyLog = useCallback((log: Omit<StudyLog, 'id'>) => {
    setData(prev => {
      const today = getToday();
      const yesterday = addDays(today, -1);
      let streak = prev.studyStreak;
      const last = prev.lastStudyDate;
      if (last === today) { /* same day */ }
      else if (last === yesterday) { streak += 1; }
      else { streak = 1; }

      return {
        ...prev,
        studyLogs: [...prev.studyLogs, { ...log, id: generateId() }],
        studyStreak: streak,
        lastStudyDate: today,
      };
    });
  }, []);

  const deleteStudyLog = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      studyLogs: prev.studyLogs.filter(l => l.id !== id),
    }));
  }, []);

  const completeRevision = useCallback((id: string) => {
    setData(prev => {
      const today = getToday();
      const rev = prev.revisions.find(r => r.id === id);
      const newRevisions = prev.revisions.map(r =>
        r.id === id ? { ...r, completed: true, status: 'Completed' as const, completedDate: today } : r
      );
      let newLectures = prev.lectures;
      if (rev) {
        newLectures = prev.lectures.map(l =>
          l.id === rev.lectureId
            ? { ...l, revisionCount: l.revisionCount + 1, lastRevision: today }
            : l
        );
      }
      toast.success("Revision completed! Keep up the great work! ✅");
      return { ...prev, revisions: newRevisions, lectures: newLectures };
    });
  }, []);

  const skipRevision = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r =>
        r.id === id ? { ...r, status: 'Skipped' as const, completed: true } : r
      ),
    }));
  }, []);

  const rescheduleRevision = useCallback((id: string, newDate: string) => {
    setData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r =>
        r.id === id ? { ...r, dueDate: newDate, status: 'Pending' as const } : r
      ),
    }));
  }, []);

  const updateRevisionNotes = useCallback((id: string, notes: string) => {
    setData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r =>
        r.id === id ? { ...r, notes } : r
      ),
    }));
  }, []);

  const updateSettings = useCallback((settings: SubjectSettings[]) => {
    setData(prev => ({ ...prev, subjectSettings: settings }));
  }, []);

  const resetData = useCallback(() => {
    const defaultSettings = SUBJECTS.map(subject => ({ subject, totalLectures: 30 }));
    const empty: AppData = {
      lectures: [], pyqs: [], studyLogs: [], revisions: [],
      subjectSettings: defaultSettings, studyStreak: 0, lastStudyDate: null,
    };
    setData(empty);
  }, []);

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

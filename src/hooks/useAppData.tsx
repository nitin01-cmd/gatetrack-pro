import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppData, Lecture, PYQ, StudyLog, Revision, SubjectSettings } from '@/lib/types';
import { loadData, saveData, generateId, createRevisions, getToday, addDays } from '@/lib/store';

interface DataContextType {
  data: AppData;
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
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => updater(prev));
  }, []);

  const addLecture = useCallback((lecture: Omit<Lecture, 'id'>) => {
    const newLecture: Lecture = { ...lecture, id: generateId() };
    updateData(prev => {
      const lectures = [...prev.lectures, newLecture];
      let revisions = prev.revisions;
      if (newLecture.status === 'Completed' && newLecture.completedDate) {
        revisions = [...revisions, ...createRevisions(newLecture)];
      }
      return { ...prev, lectures, revisions };
    });
  }, [updateData]);

  const updateLecture = useCallback((lecture: Lecture) => {
    updateData(prev => {
      const old = prev.lectures.find(l => l.id === lecture.id);
      let revisions = prev.revisions;
      // If status changed to completed, generate revisions
      if (old && old.status !== 'Completed' && lecture.status === 'Completed') {
        lecture.completedDate = getToday();
        revisions = [...revisions.filter(r => r.lectureId !== lecture.id), ...createRevisions(lecture)];
      }
      const lectures = prev.lectures.map(l => l.id === lecture.id ? lecture : l);
      return { ...prev, lectures, revisions };
    });
  }, [updateData]);

  const deleteLecture = useCallback((id: string) => {
    updateData(prev => ({
      ...prev,
      lectures: prev.lectures.filter(l => l.id !== id),
      revisions: prev.revisions.filter(r => r.lectureId !== id),
    }));
  }, [updateData]);

  const addPYQ = useCallback((pyq: Omit<PYQ, 'id'>) => {
    updateData(prev => ({ ...prev, pyqs: [...prev.pyqs, { ...pyq, id: generateId() }] }));
  }, [updateData]);

  const updatePYQ = useCallback((pyq: PYQ) => {
    updateData(prev => ({ ...prev, pyqs: prev.pyqs.map(p => p.id === pyq.id ? pyq : p) }));
  }, [updateData]);

  const deletePYQ = useCallback((id: string) => {
    updateData(prev => ({ ...prev, pyqs: prev.pyqs.filter(p => p.id !== id) }));
  }, [updateData]);

  const addStudyLog = useCallback((log: Omit<StudyLog, 'id'>) => {
    const today = getToday();
    updateData(prev => {
      let streak = prev.studyStreak;
      const last = prev.lastStudyDate;
      if (last === today) {
        // same day, no change
      } else if (last === addDays(today, -1)) {
        streak += 1;
      } else {
        streak = 1;
      }
      return {
        ...prev,
        studyLogs: [...prev.studyLogs, { ...log, id: generateId() }],
        studyStreak: streak,
        lastStudyDate: today,
      };
    });
  }, [updateData]);

  const deleteStudyLog = useCallback((id: string) => {
    updateData(prev => ({ ...prev, studyLogs: prev.studyLogs.filter(l => l.id !== id) }));
  }, [updateData]);

  const completeRevision = useCallback((id: string) => {
    updateData(prev => {
      const rev = prev.revisions.find(r => r.id === id);
      if (!rev) return prev;
      const today = getToday();
      const revisions = prev.revisions.map(r => r.id === id ? { ...r, completed: true, status: 'Completed' as const, completedDate: today } : r);
      const lectures = prev.lectures.map(l => {
        if (l.id === rev.lectureId) {
          return { ...l, revisionCount: l.revisionCount + 1, lastRevision: today };
        }
        return l;
      });
      return { ...prev, revisions, lectures };
    });
  }, [updateData]);

  const skipRevision = useCallback((id: string) => {
    updateData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => r.id === id ? { ...r, status: 'Skipped' as const, completed: true } : r),
    }));
  }, [updateData]);

  const rescheduleRevision = useCallback((id: string, newDate: string) => {
    updateData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => r.id === id ? { ...r, dueDate: newDate, status: 'Pending' as const } : r),
    }));
  }, [updateData]);

  const updateRevisionNotes = useCallback((id: string, notes: string) => {
    updateData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => r.id === id ? { ...r, notes } : r),
    }));
  }, [updateData]);

  const updateSettings = useCallback((settings: SubjectSettings[]) => {
    updateData(prev => ({ ...prev, subjectSettings: settings }));
  }, [updateData]);

  const resetData = useCallback(() => {
    localStorage.removeItem('gatetrack-data');
    setData(loadData());
  }, []);

  return (
    <DataContext.Provider value={{
      data, addLecture, updateLecture, deleteLecture,
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

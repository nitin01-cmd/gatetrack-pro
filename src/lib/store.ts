import { AppData, Lecture, PYQ, StudyLog, Revision, SubjectSettings, SUBJECTS } from './types';

const STORAGE_KEY = 'gatetrack-data';

const REVISION_INTERVALS = [1, 7, 21, 60];

const defaultSettings: SubjectSettings[] = SUBJECTS.map(subject => ({
  subject,
  totalLectures: 30,
}));

const defaultData: AppData = {
  lectures: [],
  pyqs: [],
  studyLogs: [],
  revisions: [],
  subjectSettings: defaultSettings,
  studyStreak: 0,
  lastStudyDate: null,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure subjectSettings exists
      if (!parsed.subjectSettings) parsed.subjectSettings = defaultSettings;
      if (!parsed.revisions) parsed.revisions = [];
      return parsed;
    }
  } catch {}
  return { ...defaultData };
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function createRevisions(lecture: Lecture): Revision[] {
  if (!lecture.completedDate) return [];
  return REVISION_INTERVALS.map(interval => ({
    id: generateId(),
    lectureId: lecture.id,
    subject: lecture.subject,
    topic: lecture.topic,
    dueDate: addDays(lecture.completedDate!, interval),
    completed: false,
    dayInterval: interval,
  }));
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function calculateStreak(data: AppData): number {
  const today = getToday();
  const yesterday = addDays(today, -1);
  
  if (data.lastStudyDate === today) return data.studyStreak;
  if (data.lastStudyDate === yesterday) return data.studyStreak;
  if (data.lastStudyDate && data.lastStudyDate < yesterday) return 0;
  return data.studyStreak;
}

export function getWeakTopics(lectures: Lecture[]): Lecture[] {
  return lectures.filter(l => l.difficulty >= 4 && l.revisionCount < 2);
}

export function getTodayRevisions(revisions: Revision[]): Revision[] {
  const today = getToday();
  return revisions.filter(r => !r.completed && r.dueDate <= today);
}

export function getSubjectProgress(lectures: Lecture[], settings: SubjectSettings[]) {
  return settings.map(s => {
    const subjectLectures = lectures.filter(l => l.subject === s.subject);
    const completed = subjectLectures.filter(l => l.status === 'Completed').length;
    return {
      subject: s.subject,
      completed,
      total: s.totalLectures,
      percentage: s.totalLectures > 0 ? Math.round((completed / s.totalLectures) * 100) : 0,
    };
  });
}

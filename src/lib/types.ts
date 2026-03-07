export const SUBJECTS = [
  "Digital Logic",
  "TOC",
  "COA",
  "Computer Networks",
  "Algorithms",
  "DBMS",
  "Compiler Design",
  "Programming & Data Structures",
  "Operating Systems",
  "Discrete Mathematics",
  "Aptitude",
] as const;

export type Subject = typeof SUBJECTS[number];

export type LectureStatus = "Not Started" | "In Progress" | "Completed";

export interface Lecture {
  id: string;
  subject: Subject;
  lectureNumber: number;
  topic: string;
  status: LectureStatus;
  difficulty: number; // 1-5
  pyqSolved: boolean;
  revisionCount: number;
  lastRevision: string | null;
  nextRevision: string | null;
  completedDate: string | null;
}

export interface PYQ {
  id: string;
  subject: Subject;
  topic: string;
  year: number;
  solved: boolean;
  revisionNeeded: boolean;
}

export interface StudyLog {
  id: string;
  date: string;
  subject: Subject;
  topic: string;
  hoursStudied: number;
  notes: string;
}

export interface Revision {
  id: string;
  lectureId: string;
  subject: Subject;
  topic: string;
  dueDate: string;
  completed: boolean;
  dayInterval: number; // 1, 7, 21, 60
}

export interface SubjectSettings {
  subject: Subject;
  totalLectures: number;
}

export interface AppData {
  lectures: Lecture[];
  pyqs: PYQ[];
  studyLogs: StudyLog[];
  revisions: Revision[];
  subjectSettings: SubjectSettings[];
  studyStreak: number;
  lastStudyDate: string | null;
}

// Local Storage utilities for PWA offline support and history

export interface PracticeSession {
  id: string;
  examName: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  mode: 'exam' | 'practice';
  duration: number; // in seconds
  wrongQuestions: number[];
}

export interface SavedExam {
  id: string;
  name: string;
  data: string; // JSON stringified exam data
  savedAt: string;
}

const HISTORY_KEY = 'ace_practice_history';
const SAVED_EXAMS_KEY = 'ace_saved_exams';

// Practice History
export function getPracticeHistory(): PracticeSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePracticeSession(session: Omit<PracticeSession, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getPracticeHistory();
    const newSession: PracticeSession = {
      ...session,
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
    };
    history.unshift(newSession); // Add to beginning
    // Keep only last 50 sessions
    const trimmed = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save practice session:', e);
  }
}

export function clearPracticeHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

// Saved Exams (for quick reload)
export function getSavedExams(): SavedExam[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SAVED_EXAMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExam(name: string, data: object): void {
  if (typeof window === 'undefined') return;
  try {
    const exams = getSavedExams();
    const newExam: SavedExam = {
      id: `exam_${Date.now()}`,
      name,
      data: JSON.stringify(data),
      savedAt: new Date().toISOString(),
    };
    // Check if exam with same name exists, replace it
    const existingIndex = exams.findIndex(e => e.name === name);
    if (existingIndex >= 0) {
      exams[existingIndex] = newExam;
    } else {
      exams.unshift(newExam);
    }
    // Keep only last 20 exams
    const trimmed = exams.slice(0, 20);
    localStorage.setItem(SAVED_EXAMS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save exam:', e);
  }
}

export function deleteExam(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const exams = getSavedExams().filter(e => e.id !== id);
    localStorage.setItem(SAVED_EXAMS_KEY, JSON.stringify(exams));
  } catch (e) {
    console.error('Failed to delete exam:', e);
  }
}

export function clearSavedExams(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVED_EXAMS_KEY);
}

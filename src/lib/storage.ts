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

export interface UserStats {
  totalTestsAttempted: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalTimeSpent: number; // in seconds
  streak: number; // consecutive days
  lastActiveDate: string;
}

const HISTORY_KEY = 'ace_practice_history';
const SAVED_EXAMS_KEY = 'ace_saved_exams';
const STATS_KEY = 'ace_user_stats';

// User Stats
export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return getDefaultStats();
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

function getDefaultStats(): UserStats {
  return {
    totalTestsAttempted: 0,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalTimeSpent: 0,
    streak: 0,
    lastActiveDate: '',
  };
}

export function updateUserStats(session: { total: number; score: number; duration: number }): void {
  if (typeof window === 'undefined') return;
  try {
    const stats = getUserStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Update streak
    if (stats.lastActiveDate) {
      const lastDate = new Date(stats.lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        stats.streak += 1;
      } else if (diffDays > 1) {
        stats.streak = 1;
      }
      // If same day, streak stays the same
    } else {
      stats.streak = 1;
    }
    
    stats.totalTestsAttempted += 1;
    stats.totalQuestionsAnswered += session.total;
    stats.totalCorrect += session.score;
    stats.totalTimeSpent += session.duration;
    stats.lastActiveDate = today;
    
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to update user stats:', e);
  }
}

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
    
    // Also update user stats
    updateUserStats({
      total: session.total,
      score: session.score,
      duration: session.duration,
    });
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

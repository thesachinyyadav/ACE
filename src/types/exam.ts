export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ExamData {
  exam: string;
  timeLimitMinutes: number;
  marking: {
    correct: number;
    wrong: number;
  };
  questions: Question[];
}

export interface UserResponse {
  questionIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

export interface ExamState {
  mode: 'exam' | 'practice';
  currentQuestionIndex: number;
  responses: UserResponse[];
  startTime: number;
  timeRemaining: number;
  isSubmitted: boolean;
}

export interface ResultSummary {
  totalScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracy: number;
  timeTaken: number;
}

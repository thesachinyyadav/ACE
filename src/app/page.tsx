'use client';

import { useState } from 'react';
import SetupViewPro from '@/components/SetupViewPro';
import ExamView from '@/components/ExamView';
import { ExamData, ExamState } from '@/types/exam';

export default function Home() {
  const [view, setView] = useState<'setup' | 'exam'>('setup');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examState, setExamState] = useState<ExamState | null>(null);

  const handleStartExam = (data: ExamData, mode: 'exam' | 'practice') => {
    setExamData(data);
    setExamState({
      mode,
      currentQuestionIndex: 0,
      responses: data.questions.map(() => ({
        questionIndex: 0,
        selectedIndex: null,
        isCorrect: false,
        timeSpent: 0,
      })),
      startTime: Date.now(),
      timeRemaining: data.timeLimitMinutes * 60,
      isSubmitted: false,
    });
    setView('exam');
  };

  const handleReturnToSetup = () => {
    setView('setup');
    setExamData(null);
    setExamState(null);
  };

  return (
    <main className="min-h-screen">
      {view === 'setup' && <SetupViewPro onStartExam={handleStartExam} />}
      {view === 'exam' && examData && examState && (
        <ExamView
          examData={examData}
          examState={examState}
          setExamState={setExamState}
          onReturnToSetup={handleReturnToSetup}
          onRetake={handleStartExam}
        />
      )}
    </main>
  );
}

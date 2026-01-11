'use client';

import { useState, useEffect } from 'react';
import { ExamData, ExamState } from '@/types/exam';
import QuestionPanel from './QuestionPanel';
import ResultsView from './ResultsView';

interface ExamViewProps {
  examData: ExamData;
  examState: ExamState;
  setExamState: (state: ExamState) => void;
  onReturnToSetup: () => void;
  onRetake: (data: ExamData, mode: 'exam' | 'practice') => void;
}

export default function ExamView({ examData, examState, setExamState, onReturnToSetup, onRetake }: ExamViewProps) {
  const [showResults, setShowResults] = useState(false);

  // Timer for exam mode
  useEffect(() => {
    if (examState.mode === 'exam' && !showResults && examState.timeRemaining > 0) {
      const timer = setInterval(() => {
        setExamState({
          ...examState,
          timeRemaining: examState.timeRemaining - 1,
        });
        if (examState.timeRemaining <= 1) {
          handleSubmit();
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examState, showResults]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newResponses = [...examState.responses];
    newResponses[examState.currentQuestionIndex] = {
      ...newResponses[examState.currentQuestionIndex],
      questionIndex: examState.currentQuestionIndex,
      selectedIndex: optionIndex,
      isCorrect: optionIndex === examData.questions[examState.currentQuestionIndex].correctIndex,
    };
    setExamState({ ...examState, responses: newResponses });
  };

  const handleNext = () => {
    if (examState.currentQuestionIndex < examData.questions.length - 1) {
      setExamState({
        ...examState,
        currentQuestionIndex: examState.currentQuestionIndex + 1,
      });
    }
  };

  const handlePrevious = () => {
    if (examState.currentQuestionIndex > 0) {
      setExamState({
        ...examState,
        currentQuestionIndex: examState.currentQuestionIndex - 1,
      });
    }
  };

  const handleSubmit = () => {
    setExamState({ ...examState, isSubmitted: true });
    setShowResults(true);
  };

  const handleRestart = () => {
    setExamState({
      ...examState,
      currentQuestionIndex: 0,
      responses: examData.questions.map(() => ({
        questionIndex: 0,
        selectedIndex: null,
        isCorrect: false,
        timeSpent: 0,
      })),
      startTime: Date.now(),
      timeRemaining: examData.timeLimitMinutes * 60,
      isSubmitted: false,
    });
    setShowResults(false);
  };

  // Keyboard Navigation
  useEffect(() => {
    if (showResults) return; // Don't interfere if results are showing

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4 for options
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        // Assuming max 4 options for now, safely check if option exists
        if (index < examData.questions[examState.currentQuestionIndex].options.length) {
          handleAnswerSelect(index);
        }
      }
      
      // Right Arrow for Next
      if (e.key === 'ArrowRight') {
         handleNext();
      }

      // Left Arrow for Previous
      if (e.key === 'ArrowLeft') {
         handlePrevious();
      }

      // Enter for Submit (with confirmation maybe? or just if on last question)
      // Only submit on Enter if on last question to prevent accidental submits
      if (e.key === 'Enter' && examState.currentQuestionIndex === examData.questions.length - 1) {
         handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, examState, examData]); // Re-bind when state changes to capture correct closures

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    return (
      <ResultsView
        examData={examData}
        examState={examState}
        onRestart={handleRestart}
        onReturnToSetup={onReturnToSetup}
        onRetake={onRetake}
      />
    );
  }

  const progressPercentage = ((examState.currentQuestionIndex + 1) / examData.questions.length) * 100;
  const currentQuestion = examData.questions[examState.currentQuestionIndex];
  const selectedOption = examState.responses[examState.currentQuestionIndex]?.selectedIndex;

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090b] text-white font-sans">
      {/* Header - Fixed for iOS */}
      <nav className="border-b border-white/5 bg-[#09090b] backdrop-blur-xl fixed top-0 left-0 right-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
               <span className="font-bold text-sm">
                 {examState.currentQuestionIndex + 1}
               </span>
             </div>
             <div>
               <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Question</div>
               <div className="text-sm font-semibold text-zinc-200">
                 {examState.currentQuestionIndex + 1} <span className="text-zinc-600">/</span> {examData.questions.length}
               </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
            {examState.mode === 'exam' && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                examState.timeRemaining < 60 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-900 border-white/5 text-zinc-300'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-medium">{formatTime(examState.timeRemaining)}</span>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-0.5 w-full bg-zinc-900">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-14 safe-top"></div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <QuestionPanel
          question={currentQuestion}
          questionIndex={examState.currentQuestionIndex}
          totalQuestions={examData.questions.length}
          selectedOption={selectedOption}
          mode={examState.mode}
          onSelectOption={handleAnswerSelect}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
          canGoNext={examState.currentQuestionIndex < examData.questions.length - 1}
          canGoPrevious={examState.currentQuestionIndex > 0}
        />
      </main>
    </div>
  );
}

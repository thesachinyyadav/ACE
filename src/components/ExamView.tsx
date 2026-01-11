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
      {/* Header - Fixed for iOS - Ultra Clean */}
      <nav className="border-b border-white/5 bg-[#09090b] fixed top-0 left-0 right-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          {/* Left: Question Counter - Minimal */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tabular-nums">
              {examState.currentQuestionIndex + 1}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-sm text-zinc-500 tabular-nums">
              {examData.questions.length}
            </span>
          </div>

          {/* Center: Progress Indicator - Visual */}
          <div className="hidden sm:flex items-center gap-1 flex-1 max-w-xs mx-4">
            {examData.questions.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                  idx === examState.currentQuestionIndex 
                    ? 'bg-blue-500' 
                    : idx < examState.currentQuestionIndex 
                      ? examState.responses[idx]?.selectedIndex !== null 
                        ? 'bg-emerald-500/60' 
                        : 'bg-zinc-700'
                      : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Right: Timer + Submit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {examState.mode === 'exam' && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums ${
                examState.timeRemaining < 60 
                  ? 'bg-red-500/15 text-red-400 animate-pulse' 
                  : examState.timeRemaining < 300 
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-zinc-400'
              }`}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(examState.timeRemaining)}</span>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-900 rounded-lg transition-all active:scale-95"
            >
              Submit
            </button>
          </div>
        </div>
        {/* Progress Bar - Thinner */}
        <div className="h-[2px] w-full bg-zinc-900/50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-12 safe-top"></div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
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

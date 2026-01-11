'use client';

import { useState } from 'react';
import { Question } from '@/types/exam';

interface QuestionPanelProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedOption: number | null | undefined;
  mode: 'exam' | 'practice';
  onSelectOption: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function QuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  selectedOption,
  mode,
  onSelectOption,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext,
  canGoPrevious,
}: QuestionPanelProps) {
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);

  const showFeedback = mode === 'practice' && selectedOption !== null && selectedOption !== undefined;
  const isCorrect = selectedOption === question.correctIndex;

  const fetchAIHint = async () => {
    setLoadingHint(true);
    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.question, options: question.options }),
      });
      const data = await response.json();
      setHint(data.hint || 'Unable to generate hint at this time.');
      setShowHint(true);
    } catch (error) {
      setHint('Failed to fetch hint. Please try again.');
    } finally {
      setShowHint(true);
      setLoadingHint(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Question Card */}
      <div className="space-y-5">
         <h2 className="text-xl sm:text-2xl font-semibold text-white leading-snug tracking-tight">
          {question.question}
        </h2>

        {/* Options Grid - Compact & Touch Friendly */}
        <div className="grid gap-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = showFeedback && index === question.correctIndex;
            const showWrong = showFeedback && isSelected && !isCorrect;

            let baseClasses = "group relative w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3 outline-none active:scale-[0.98]";
            let stateClasses = "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-200";
            let indicatorClasses = "border-zinc-600 text-zinc-500 bg-zinc-800";

            if (showCorrect) {
              stateClasses = "bg-emerald-500/15 border-emerald-500/40 text-emerald-50";
              indicatorClasses = "bg-emerald-500 border-emerald-500 text-white";
            } else if (showWrong) {
              stateClasses = "bg-red-500/15 border-red-500/40 text-red-50";
              indicatorClasses = "bg-red-500 border-red-500 text-white";
            } else if (isSelected) {
              stateClasses = "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25";
              indicatorClasses = "bg-white text-blue-600 border-white";
            }

            return (
              <button
                key={index}
                onClick={() => !showFeedback && onSelectOption(index)}
                disabled={showFeedback}
                className={`${baseClasses} ${stateClasses}`}
              >
                <div className={`w-7 h-7 rounded-lg border flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${indicatorClasses}`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-base font-medium leading-snug">{option}</span>
                
                {mode === 'practice' && showFeedback && (index === question.correctIndex || (isSelected && !isCorrect)) && (
                   <div className="ml-auto flex-shrink-0">
                     {index === question.correctIndex ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                     ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                     )}
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation / Hint Area (Practice Mode) - Compact */}
      {mode === 'practice' && (
        <div className="min-h-[80px]">
           {showFeedback ? (
             <div className="bg-zinc-900/40 rounded-xl p-4 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Explanation
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm">
                  {question.explanation || "No explanation provided."}
                </p>
             </div>
           ) : (
             <div className="flex justify-start">
               {!showHint ? (
                 <button
                    onClick={fetchAIHint}
                    disabled={loadingHint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30 transition-all text-xs font-medium"
                 >
                    {loadingHint ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> 
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI Hint
                      </>
                    )}
                 </button>
               ) : (
                  <div className="w-full bg-purple-500/5 rounded-xl p-4 border border-purple-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Hint
                    </div>
                    <p className="text-zinc-400 leading-relaxed text-sm italic">
                      {hint}
                    </p>
                  </div>
               )}
             </div>
           )}
        </div>
      )}

      {/* Navigation Footer - Compact */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-0 disabled:pointer-events-none transition-all"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Keyboard hints - Desktop only */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">1-4</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">←→</kbd> Navigate</span>
        </div>
        
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2.5 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 transition-all active:scale-95 ${!canGoNext ? 'opacity-0 pointer-events-none' : ''}`}
          aria-label="Next"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

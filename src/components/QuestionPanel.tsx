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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Question Card */}
      <div className="space-y-6">
         <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight tracking-tight">
          {question.question}
        </h2>


        {/* Options Grid */}
        <div className="grid gap-3 pt-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const showCorrect = showFeedback && index === question.correctIndex;
            const showWrong = showFeedback && isSelected && !isCorrect;

            let baseClasses = "group relative w-full text-left p-5 rounded-xl border transition-all duration-200 flex items-center gap-4 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090b] focus:ring-blue-500/50";
            let stateClasses = "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300";
            let indicatorClasses = "border-zinc-700 text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-400";

            if (showCorrect) {
              stateClasses = "bg-emerald-500/10 border-emerald-500/50 text-emerald-100";
              indicatorClasses = "bg-emerald-500 border-emerald-500 text-white";
            } else if (showWrong) {
              stateClasses = "bg-red-500/10 border-red-500/50 text-red-100";
              indicatorClasses = "bg-red-500 border-red-500 text-white";
            } else if (isSelected) {
              stateClasses = "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20";
              indicatorClasses = "bg-white text-blue-600 border-white";
            }

            return (
              <button
                key={index}
                onClick={() => !showFeedback && onSelectOption(index)}
                disabled={showFeedback}
                className={`${baseClasses} ${stateClasses}`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors ${indicatorClasses}`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="text-lg font-medium">{option}</div>
                
                {mode === 'practice' && showFeedback && (index === question.correctIndex || (isSelected && !isCorrect)) && (
                   <div className="ml-auto">
                     {index === question.correctIndex ? (
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     ) : (
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     )}
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation / Hint Area (Practice Mode) */}
      {mode === 'practice' && (
        <div className="min-h-[100px]">
           {showFeedback ? (
             <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Explanation
                </div>
                <p className="text-zinc-300 leading-relaxed text-lg">
                  {question.explanation || "No explanation provided for this question."}
                </p>
             </div>
           ) : (
             <div className="flex justify-start">
               {!showHint ? (
                 <button
                    onClick={fetchAIHint}
                    disabled={loadingHint}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-sm font-medium"
                 >
                    {loadingHint ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> 
                        Generating Hint...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        Get AI Hint
                      </>
                    )}
                 </button>
               ) : (
                  <div className="w-full bg-purple-500/5 rounded-2xl p-6 border border-purple-500/20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-400 uppercase tracking-wider">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Hint
                    </div>
                    <p className="text-zinc-300 leading-relaxed italic">
                      {hint}
                    </p>
                  </div>
               )}
             </div>
           )}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-8 border-t border-white/5">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-0 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Previous
        </button>
        
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`px-6 py-3 rounded-xl font-medium bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5 ${!canGoNext ? 'opacity-0 pointer-events-none' : ''}`}
        >
          Next Question
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

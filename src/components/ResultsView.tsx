'use client';

import { useState, useEffect } from 'react';
import { ExamData, ExamState, ResultSummary } from '@/types/exam';
import { savePracticeSession } from '@/lib/storage';

interface ResultsViewProps {
  examData: ExamData;
  examState: ExamState;
  onRestart: () => void;
  onReturnToSetup: () => void;
  onRetake?: (data: ExamData, mode: 'exam' | 'practice') => void;
}

export default function ResultsView({ examData, examState, onRestart, onReturnToSetup, onRetake }: ResultsViewProps) {
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  const calculateResults = (): ResultSummary => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    examState.responses.forEach((response, index) => {
      if (response.selectedIndex === null || response.selectedIndex === undefined) {
        unansweredCount++;
      } else if (response.selectedIndex === examData.questions[index].correctIndex) {
        correctCount++;
        totalScore += examData.marking.correct;
      } else {
        incorrectCount++;
        totalScore += examData.marking.wrong;
      }
    });

    return {
      totalScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy: examData.questions.length > 0 ? (correctCount / examData.questions.length) * 100 : 0,
      timeTaken: Math.floor((Date.now() - examState.startTime) / 1000),
    };
  };

  const results = calculateResults();
  const maxPossibleScore = examData.questions.length * examData.marking.correct;
  const percentage = Math.round((results.totalScore / maxPossibleScore) * 100);

  // Save session to history on mount
  useEffect(() => {
    if (!saved) {
      const wrongIndices = examState.responses
        .map((response, index) => {
          const isWrong = response.selectedIndex !== null && 
                          response.selectedIndex !== undefined && 
                          response.selectedIndex !== examData.questions[index].correctIndex;
          return isWrong ? index : -1;
        })
        .filter(idx => idx !== -1);

      savePracticeSession({
        examName: examData.exam,
        score: results.correctCount,
        total: examData.questions.length,
        percentage: Math.round((results.correctCount / examData.questions.length) * 100),
        mode: examState.mode,
        duration: Math.floor((Date.now() - examState.startTime) / 1000),
        wrongQuestions: wrongIndices,
      });
      setSaved(true);
    }
  }, [saved, examData, examState, results]);

  const handleCopyWrong = () => {
    const wrongIndices = examState.responses
      .map((response, index) => {
        const isWrong = response.selectedIndex !== null && 
                        response.selectedIndex !== undefined && 
                        response.selectedIndex !== examData.questions[index].correctIndex;
        return isWrong ? index + 1 : null;
      })
      .filter((index) => index !== null);
    
    if (wrongIndices.length > 0) {
       navigator.clipboard.writeText(wrongIndices.join(','));
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetakeMistakes = () => {
    const wrongQuestions = examData.questions.filter((_, index) => {
        const response = examState.responses[index];
        const isWrong = response.selectedIndex !== null && 
                        response.selectedIndex !== undefined && 
                        response.selectedIndex !== examData.questions[index].correctIndex;
        return isWrong;
    });
    
    if (wrongQuestions.length > 0) {
      const newExamData: ExamData = {
        ...examData,
        exam: `${examData.exam} (Review Mistakes)`,
        questions: wrongQuestions,
        timeLimitMinutes: Math.ceil(wrongQuestions.length * 1.5) // Adjust time based on count
      };

      if (onRetake) {
         onRetake(newExamData, 'practice');
      } else {
         // Fallback for copy (previous implementation)
         navigator.clipboard.writeText(JSON.stringify(newExamData, null, 2));
         alert("Exam with only your mistakes has been copied to clipboard! \n\nGo to Setup -> Paste it to start.");
      }
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const wrongIndices = examState.responses
        .map((response, index) => {
           const isWrong = response.selectedIndex !== null && 
                          response.selectedIndex !== undefined && 
                          response.selectedIndex !== examData.questions[index].correctIndex;
           return isWrong ? index : -1;
        })
        .filter(idx => idx !== -1);

    if (wrongIndices.length === 0) {
      setAnalysis("Perfect score! No analysis needed. You are a master! 🌟");
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           questions: examData.questions,
           wrongIndices 
        })
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysis("Could not generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'r' || e.key === 'R') onRestart();
       if (e.key === 'h' || e.key === 'H') onReturnToSetup();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onReturnToSetup]);

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090b] text-white font-sans">
      {/* Navbar for Results Page - Fixed for iOS */}
      <nav className="fixed top-0 left-0 right-0 border-b border-white/5 bg-[#09090b] backdrop-blur-xl z-50 safe-top">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="ACE Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-bold text-lg tracking-tight">ACE MCQ</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={onReturnToSetup} className="text-zinc-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-14 safe-top"></div>

      <div className="max-w-4xl mx-auto space-y-8 p-6 md:p-12">
        
        {/* Results Header Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative text-center space-y-6">
            <h2 className="text-3xl font-bold">Exam Completed</h2>
            
             <div className="flex justify-center items-center py-6">
              <div className="relative">
                {/* Progress Circle SVG */}
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    className="text-zinc-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="64"
                    cx="96"
                    cy="96"
                  />
                  <circle
                    className={percentage >= 50 ? "text-indigo-500" : "text-amber-500"}
                    strokeWidth="8"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * percentage) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="64"
                    cx="96"
                    cy="96"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
                    {percentage}%
                  </span>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Score</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">{results.correctCount}</p>
                  <p className="text-xs font-medium text-emerald-500/70 uppercase tracking-wide">Correct</p>
               </div>
               <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-2xl font-bold text-rose-400">{results.incorrectCount}</p>
                  <p className="text-xs font-medium text-rose-500/70 uppercase tracking-wide">Wrong</p>
               </div>
               <div className="p-4 rounded-3xl bg-zinc-800/50 border border-white/5">
                  <p className="text-2xl font-bold text-zinc-400">{results.unansweredCount}</p>
                  <p className="text-xs font-medium text-zinc-500/70 uppercase tracking-wide">Skipped</p>
               </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
               {results.incorrectCount > 0 && (
                  <button 
                     onClick={handleCopyWrong}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 transition-colors"
                  >
                     {copied ? (
                        <>
                           <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                           <span>Copied! ({results.incorrectCount})</span>
                        </>
                     ) : (
                        <>
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                           </svg>
                           <span>Copy Numbers</span>
                        </>
                     )}
                  </button>
               )}

               <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-sm font-medium text-purple-300 transition-colors border border-purple-500/20"
               >
                  {isAnalyzing ? (
                     <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing...</span>
                     </>
                  ) : (
                     <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Analysis</span>
                     </>
                  )}
               </button>

               {results.incorrectCount > 0 && (
                  <button 
                     onClick={handleRetakeMistakes}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-sm font-medium text-blue-300 transition-colors border border-blue-500/20"
                  >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     <span>Retake Mistakes</span>
                  </button>
               )}
            </div>

            {analysis && (
               <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-left animate-in slide-in-from-bottom-2 fade-in duration-500">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="p-2 rounded-lg bg-purple-500/20">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                     </span>
                     <h3 className="text-lg font-bold text-white">AI Personal Couch</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                     <p className="whitespace-pre-wrap text-purple-200/90 leading-relaxed font-medium">
                        {analysis}
                     </p>
                  </div>
               </div>
            )}

          </div>
        </div>

        {/* Detailed Question Grid */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Question Review
          </h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {examState.responses.map((response, index) => {
               let statusColor = "bg-zinc-800 border-zinc-700 text-zinc-400"; // Skipped
               const question = examData.questions[index];
               const isCorrect = response.selectedIndex === question.correctIndex;
               
               if (response.selectedIndex !== null && response.selectedIndex !== undefined) {
                 statusColor = isCorrect 
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                    : "bg-rose-500/20 border-rose-500/50 text-rose-400";
               }

               return (
                  <button 
                    key={index}
                    className={`aspect-square rounded-2xl border flex items-center justify-center text-sm font-bold transition-transform hover:scale-105 ${statusColor}`}
                    title={`Q${index + 1}: ${response.selectedIndex === null ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}`}
                  >
                    {index + 1}
                  </button>
               );
            })}
          </div>
        </div>

        {/* Detailed Answer Key */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold px-2">Detailed Solutions</h3>
          {examData.questions.map((question, index) => {
            const response = examState.responses[index];
            const isCorrect = response.selectedIndex === question.correctIndex;
            const isSkipped = response.selectedIndex === null || response.selectedIndex === undefined;
            
            let statusClass = "border-zinc-800 bg-zinc-900/30";
            if (!isSkipped) {
               statusClass = isCorrect 
                  ? "border-emerald-500/20 bg-emerald-500/5" 
                  : "border-rose-500/20 bg-rose-500/5";
            }

            return (
               <div key={index} className={`rounded-[2rem] border p-6 ${statusClass}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                     <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                        {index + 1}
                     </span>
                     <p className="flex-1 text-zinc-200 font-medium text-lg">{question.question}</p>
                     
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isSkipped ? "bg-zinc-800 text-zinc-500" :
                        isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                     }`}>
                        {isSkipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                     </span>
                  </div>

                  <div className="grid gap-2 ml-12">
                     {question.options.map((option, optIdx) => {
                        const isSelected = response.selectedIndex === optIdx;
                        const isAnswer = question.correctIndex === optIdx;
                        
                        let optionClass = "border-zinc-800 bg-zinc-900/50 text-zinc-400";
                        if (isAnswer) optionClass = "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-medium";
                        else if (isSelected && !isCorrect) optionClass = "border-rose-500/50 bg-rose-500/20 text-rose-300";

                        return (
                           <div key={optIdx} className={`px-4 py-3 rounded-2xl border text-sm flex items-center gap-3 ${optionClass}`}>
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                                 {String.fromCharCode(65 + optIdx)}
                              </span>
                              {option}
                              {isAnswer && <svg className="w-4 h-4 ml-auto text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                              {isSelected && !isCorrect && <svg className="w-4 h-4 ml-auto text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>}
                           </div>
                        )
                     })}
                  </div>

                  {question.explanation && (
                     <div className="mt-4 ml-12 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                        <strong className="block text-blue-400 text-xs uppercase tracking-wide mb-1">Explanation</strong>
                        {question.explanation}
                     </div>
                  )}
               </div>
            )
          })}
        </div>

        <div className="flex gap-4 pt-8 pb-12">
          <button
            onClick={onRestart}
            className="flex-1 py-4 rounded-[1.5rem] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            Take Another Test
          </button>
          <button
            onClick={onReturnToSetup}
            className="px-8 py-4 rounded-[1.5rem] font-bold border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-all"
          >
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}

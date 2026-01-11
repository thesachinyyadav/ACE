'use client';

import { useState, useEffect } from 'react';
import { ExamData } from '@/types/exam';
import { getPracticeHistory, PracticeSession, getSavedExams, saveExam, SavedExam, getUserStats, UserStats } from '@/lib/storage';

interface SetupViewProProps {
  onStartExam: (data: ExamData, mode: 'exam' | 'practice') => void;
}

const SAMPLE_DATA: ExamData = {
  exam: "Sample ACE Test",
  timeLimitMinutes: 10,
  marking: { correct: 3, wrong: -1 },
  questions: [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctIndex: 2,
      explanation: "Paris is the capital and largest city of France."
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
      explanation: "Mars appears red due to iron oxide on its surface."
    }
  ]
};

export default function SetupViewPro({ onStartExam }: SetupViewProProps) {
  const [mode, setMode] = useState<'exam' | 'practice'>('exam');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'history' | 'saved'>('input');
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    setHistory(getPracticeHistory());
    setSavedExams(getSavedExams());
    setStats(getUserStats());
  }, []);

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2));
    setExamData(SAMPLE_DATA);
    setError('');
  };
 
  const handleGenerate = async () => {
     if (!genTopic.trim()) return;
     setIsGenerating(true);
     setError(''); // Clear previous errors
     try {
        const res = await fetch('/api/generate', {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ topic: genTopic, count: 5 })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
           throw new Error(data.error || 'Failed to generate questions');
        }

        if (data.questions) {
           const generatedExam: ExamData = {
              exam: `AI Generated: ${genTopic}`,
              timeLimitMinutes: 10,
              marking: { correct: 4, wrong: -1 },
              questions: data.questions
           };
           setJsonInput(JSON.stringify(generatedExam, null, 2));
           setExamData(generatedExam);
           setShowGenerator(false);
           setGenTopic(''); // Reset input
        } else {
           throw new Error('No questions returned from AI');
        }
     } catch (e: any) {
        console.error("Generator Error:", e);
        setError(e.message || 'Error connecting to AI service');
     } finally {
        setIsGenerating(false);
     }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      handleApplyJson(); // Optionally auto-apply on paste button click if we refactor logic slightly
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleApplyJson = () => {
    try {
      if (!jsonInput.trim()) return;
      
      const data = JSON.parse(jsonInput);
      if (!data.exam || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid format');
      }
      setExamData(data);
      setError('');
    } catch (err) {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const handleStart = () => {
    if (examData) {
      onStartExam(examData, mode);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar - Fixed for iOS */}
      <nav className="border-b border-white/5 bg-[#09090b] backdrop-blur-xl fixed top-0 left-0 right-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ACE Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-bold text-lg tracking-tight">ACE MCQ</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tests Attempted Badge */}
            {stats && stats.totalTestsAttempted > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold text-white tabular-nums">{stats.totalTestsAttempted}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">tests</span>
              </div>
            )}
            {/* Streak Badge */}
            {stats && stats.streak > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">{stats.streak}</span>
              </div>
            )}
            <div className="text-xs font-mono text-zinc-600 px-2 py-1 hidden sm:block">v2.0</div>
          </div>
        </div>
      </nav>
      
      {/* Spacer for fixed navbar */}
      <div className="h-14 safe-top"></div>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left Column: Intro & Mode */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">exams</span>.
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Professional testing platform with detailed analytics and AI-powered insights.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-1">Select Mode</p>
              
              <button
                onClick={() => setMode('exam')}
                className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 group ${
                  mode === 'exam'
                    ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-900/20'
                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  mode === 'exam' ? 'bg-blue-600 text-white shadow-inner shadow-blue-400/20' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className={`font-semibold text-lg ${mode === 'exam' ? 'text-white' : 'text-zinc-300'}`}>Exam Mode</div>
                  <div className="text-sm text-zinc-500">Timed • Negative Marking</div>
                </div>
                {mode === 'exam' && (
                  <div className="ml-auto text-blue-500 animate-in fade-in slide-in-from-left-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setMode('practice')}
                className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 group ${
                  mode === 'practice'
                    ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/20'
                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  mode === 'practice' ? 'bg-emerald-600 text-white shadow-inner shadow-emerald-400/20' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div className={`font-semibold text-lg ${mode === 'practice' ? 'text-white' : 'text-zinc-300'}`}>Practice Mode</div>
                  <div className="text-sm text-zinc-500">Untimed • AI Explanations</div>
                </div>
                {mode === 'practice' && (
                  <div className="ml-auto text-emerald-500 animate-in fade-in slide-in-from-left-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Tabs */}
          <div className="lg:col-span-7 space-y-6 lg:pl-12">
            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('input')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'input' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                New Exam
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                History
                {history.length > 0 && <span className="text-[10px] bg-zinc-700 px-1.5 py-0.5 rounded-full">{history.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'saved' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Saved
                {savedExams.length > 0 && <span className="text-[10px] bg-zinc-700 px-1.5 py-0.5 rounded-full">{savedExams.length}</span>}
              </button>
            </div>

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-medium">No practice history yet</p>
                    <p className="text-sm text-zinc-700">Complete an exam to see your history here</p>
                  </div>
                ) : (
                  history.slice(0, 10).map((session) => (
                    <div key={session.id} className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-sm">{session.examName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {new Date(session.date).toLocaleDateString()} • {session.mode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${session.percentage >= 70 ? 'text-emerald-400' : session.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {session.percentage}%
                          </div>
                          <div className="text-[10px] text-zinc-600">{session.score}/{session.total}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Saved Exams Tab */}
            {activeTab === 'saved' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                {savedExams.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    <p className="font-medium">No saved exams</p>
                    <p className="text-sm text-zinc-700">Apply an exam config and it will be saved here</p>
                  </div>
                ) : (
                  savedExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => {
                        setJsonInput(exam.data);
                        try {
                          setExamData(JSON.parse(exam.data));
                          setActiveTab('input');
                        } catch {}
                      }}
                      className="w-full p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-zinc-800/50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-sm">{exam.name}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            Saved {new Date(exam.savedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Input Tab */}
            {activeTab === 'input' && (
              <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Exam Configuration</h2>
                <p className="text-sm text-zinc-400">Paste your JSON configuration or load a sample.</p>
              </div>
              <button 
                onClick={handleLoadSample}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Load Sample
              </button>
            </div>

            {/* AI Generator Toggle */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setShowGenerator(!showGenerator)}
                className={`flex-1 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium transition-all flex items-center justify-center gap-2 ${showGenerator ? 'bg-purple-500/10 border-purple-500/50 text-purple-300' : 'bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400'}`}
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 {showGenerator ? 'Close AI Generator' : 'Generate with AI'}
              </button>
            </div>

            {showGenerator && (
               <div className="p-5 rounded-xl bg-purple-900/10 border border-purple-500/20 mb-6 space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Topic</label>
                     <input 
                        type="text" 
                        value={genTopic}
                        onChange={(e) => setGenTopic(e.target.value)}
                        placeholder="e.g. React Hooks, World History, Python Basics..."
                        className="w-full bg-zinc-900/80 border border-purple-500/30 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                     />
                  </div>
                  <button 
                     onClick={handleGenerate}
                     disabled={isGenerating || !genTopic.trim()}
                     className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                     {isGenerating ? (
                        <>
                           <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           Generating Exam...
                        </>
                     ) : (
                        'Create Exam'
                     )}
                  </button>
               </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pl-1">JSON Data</p>
                <button 
                  onClick={() => setJsonInput('')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your exam JSON here..."
                  className="w-full h-48 bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                />
                {!jsonInput && (
                   <button
                      onClick={handlePaste}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium rounded-lg border border-white/5 transition-colors"
                   >
                      Paste from Clipboard
                   </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="font-semibold text-red-300">Invalid Configuration</div>
                  <div className="opacity-80">{error}</div>
                </div>
              </div>
            )}

            {examData && !error && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner shadow-emerald-500/10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                         <div className="font-bold text-white text-lg">{examData.exam}</div>
                         <div className="text-sm text-emerald-400/80 font-medium">Configuration Valid</div>
                      </div>
                      <div className="text-right">
                         <div className="text-2xl font-bold text-white leading-none">{examData.questions.length}</div>
                         <div className="text-[10px] uppercase tracking-wider text-zinc-500">Questions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  if (examData) {
                    // Save exam before starting
                    saveExam(examData.exam, examData);
                    setSavedExams(getSavedExams());
                    handleStart();
                  } else {
                    handleApplyJson();
                  }
                }}
                disabled={!jsonInput.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group ${
                  examData
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800'
                }`}
              >
                 {/* Shine effect */}
                 {examData && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>}
                 
                {examData ? (
                  <>
                    Begin {mode === 'exam' ? 'Exam' : 'Practice'}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                ) : (
                  'Apply Configuration'
                )}
              </button>
            </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

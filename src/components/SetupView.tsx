'use client';

import { useState } from 'react';
import { ExamData } from '@/types/exam';

const SAMPLE_EXAM: ExamData = {
  exam: "Sample ACE Drill",
  timeLimitMinutes: 10,
  marking: { correct: 3, wrong: -1 },
  questions: [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctIndex: 1,
      explanation: "Paris is the capital and largest city of France."
    },
    {
      id: 2,
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
      explanation: "Basic arithmetic: 2 + 2 = 4"
    }
  ]
};

interface SetupViewProps {
  onStartExam: (data: ExamData, mode: 'exam' | 'practice') => void;
}

export default function SetupView({ onStartExam }: SetupViewProps) {
  const [mode, setMode] = useState<'exam' | 'practice'>('exam');
  const [jsonInput, setJsonInput] = useState('');
  const [examData, setExamData] = useState<ExamData>(SAMPLE_EXAM);
  const [error, setError] = useState('');

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_EXAM, null, 2));
    setExamData(SAMPLE_EXAM);
    setError('');
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setExamData(parsed);
      setError('');
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">ACE MCQ Tester</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mode Selection */}
        <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Mode</h2>
          <div className="grid gap-4">
            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mode === 'exam' 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}>
              <input
                type="radio"
                name="mode"
                value="exam"
                checked={mode === 'exam'}
                onChange={() => setMode('exam')}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-white">Exam Mode</div>
                <div className="text-sm text-slate-400">Timed session with negative marking and results shown at the end.</div>
              </div>
            </label>

            <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              mode === 'practice' 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}>
              <input
                type="radio"
                name="mode"
                value="practice"
                checked={mode === 'practice'}
                onChange={() => setMode('practice')}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-white">Practice Mode</div>
                <div className="text-sm text-slate-400">No timer, instant feedback with AI-powered hints.</div>
              </div>
            </label>
          </div>
        </section>

        {/* JSON Input */}
        <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Paste Question Set (JSON)</h2>
          <p className="text-sm text-slate-400 mb-4">
            Paste a JSON object that matches the sample structure.
          </p>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={JSON.stringify(SAMPLE_EXAM, null, 2)}
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Load Sample
            </button>
            <button
              onClick={handleApplyJson}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Question Set
            </button>
            <button
              onClick={() => setJsonInput('')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Summary & Start */}
        <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-300">
              <p className="text-sm">
                <span className="font-semibold text-white">{examData.questions.length}</span> questions
                {' • '}
                <span className="font-semibold text-white">{examData.timeLimitMinutes}</span> minutes
                {' • '}
                Marks: <span className="text-green-400">+{examData.marking.correct}</span> / 
                <span className="text-red-400">{examData.marking.wrong}</span>
              </p>
            </div>
            <button
              onClick={() => onStartExam(examData, mode)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Start Test
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

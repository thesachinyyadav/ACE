import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const { questions, wrongIndices } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build context on what user got wrong
    const mistakeContext = wrongIndices.map((idx: number) => {
      const q = questions[idx];
      return `- Question: "${q.question}" (Tag/Topic: General)`;
    }).join('\n');

    const prompt = `You are an expert exam analyzer. A student just finished a test and made mistakes on the following questions:

${mistakeContext}

Analyze these mistakes. 
1. Identify the common weak areas or patterns (e.g. "You seem to struggle with geography" or "Calculation errors").
2. Give 3 actionable tips to improve.
3. Keep it encouraging but professional. Max 150 words.`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Keep practicing! Focus on understanding the core concepts behind the questions you missed.";
      
    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

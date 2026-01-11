import { NextResponse } from 'next/server';

const GEN_AI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEN_AI_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { topic, difficulty = 'medium', count = 5 } = await req.json();

    if (!topic) {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `
      You are an expert exam creator. configured to output ONLY valid JSON.
      Create a strictly valid JSON array of ${count} multiple choice questions about "${topic}".
      Difficulty level: ${difficulty}.

      The output must be a raw JSON array of objects. Do not wrap it in markdown code blocks. Do not add any text before or after.
      
      Each object must follow this exact schema:
      {
        "id": number (incremental starting from 1),
        "question": "string",
        "options": ["string", "string", "string", "string"] (exactly 4 options),
        "correctIndex": number (0-3),
        "explanation": "string" (short explanation of why the answer is correct)
      }

      Example output format:
      [
        {
          "id": 1,
          "question": "Sample Question?",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 0,
          "explanation": "Explanation here."
        }
      ]
    `;

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

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Clean up potential markdown formatting
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Validate JSON
    try {
        const questions = JSON.parse(rawText);
        // Ensure IDs are unique if we were appending, but here we just return the array
        // The frontend will handle merging if needed.
        return NextResponse.json({ questions });
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return NextResponse.json({ error: 'AI generated invalid JSON. Please check your API key.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Generate Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

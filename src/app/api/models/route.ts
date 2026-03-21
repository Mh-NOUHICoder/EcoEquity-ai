import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    
    // Filter to only models that support content generation
    const models = response.data.models
      .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace('models/', ''),
        id: m.name,
        description: m.description,
        displayName: m.displayName
      }));

    return NextResponse.json({ models });
  } catch (err: any) {
    console.error('List Models Error:', err.response?.data || err.message);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

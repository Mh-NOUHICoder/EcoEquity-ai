import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  );
  const data = await res.json();

  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });

  const models = (data.models ?? []).map((m: any) => ({
    name: m.name,
    displayName: m.displayName,
    supportsGenerateContent: m.supportedGenerationMethods?.includes('generateContent'),
    supportsBidi: m.supportedGenerationMethods?.includes('bidiGenerateContent'),
  }));

  return NextResponse.json({ models, total: models.length });
}

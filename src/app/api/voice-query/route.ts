import { NextRequest } from 'next/server';
import { getVertexModel, AgentResponse, SYSTEM_INSTRUCTION, AGENT_TOOLS } from '@/lib/vertexAI';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache discovered model name to avoid repeated ListModels calls
let cachedModel: string | null = null;

/**
 * Calls ListModels to find the first model this API key can actually use.
 */
async function discoverModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`ListModels failed: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  const models: any[] = data.models ?? [];

  console.log('[EcoEquity] Available models:', models.map((m: any) => m.name));

  // Preference order — pick the best generateContent-capable model available
  const preference = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  for (const key of preference) {
    const match = models.find(
      (m: any) =>
        m.name.includes(key) &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent')
    );
    if (match) {
      cachedModel = match.name.replace('models/', '');
      console.log('[EcoEquity] Selected model:', cachedModel);
      return cachedModel as string;
    }
  }

  // Last resort: any model supporting generateContent
  const fallback = models.find(
    (m: any) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent')
  );

  if (fallback) {
    cachedModel = fallback.name.replace('models/', '');
    console.log('[EcoEquity] Fallback model:', cachedModel);
    return cachedModel as string;
  }

  throw new Error(
    `No generateContent-capable model found. Models available: ${models
      .map((m: any) => m.name)
      .join(', ')}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, imageBase64 } = body as { query: string; imageBase64?: string };

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'Invalid query.' }), { status: 400 });
    }

    // Build SSE streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const send = (data: object) =>
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

    (async () => {
      let isWriterClosed = false;
      const safeClose = async () => {
        if (!isWriterClosed) {
          try {
            isWriterClosed = true;
            await writer.close();
          } catch (e) {
            // Silence "already closed" errors
          }
        }
      };

      try {
        const result = await runAgent(query, imageBase64);
        await send({ type: 'response', ...result });
      } catch (e: any) {
        console.error('[EcoEquity] Agent execution error:', e.message);
        try {
          await send({ type: 'error', error: e.message || 'Agent error' });
        } catch (_) {}
      } finally {
        await safeClose();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[EcoEquity] POST Route error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500 }
    );
  }
}

// ── MODEL SYSTEM ──
let availableModelsCached: string[] = [];

async function getAvailableModels(apiKey: string): Promise<string[]> {
  if (availableModelsCached.length > 0) return availableModelsCached;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`);
    if (!res.ok) throw new Error('Failed to list models');
    const data = await res.json();
    const models = (data.models ?? [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));

    const preference = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-pro'];
    availableModelsCached = preference.filter(p => models.some((m: string) => m.includes(p)));
    
    // Add any remaining models that weren't in our preference list
    models.forEach((m: string) => {
      if (!availableModelsCached.includes(m)) availableModelsCached.push(m);
    });

    console.log('[EcoEquity] Master Model List Established:', availableModelsCached);
    return availableModelsCached;
  } catch (e) {
    return ['gemini-1.5-flash', 'gemini-pro']; // Hardcoded safety fallback
  }
}

// Persistant session blacklist for models that hit 429
const modelBlacklist = new Set<string>();

async function runAgent(query: string, imageBase64?: string): Promise<AgentResponse> {
  // 1. TRY VERTEX AI (Production Grade)
  const vertexModel = getVertexModel();
  if (vertexModel) {
    try {
      const parts: any[] = [{ text: query }];
      if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
      const result = await vertexModel.generateContent({ contents: [{ role: 'user', parts }] });
      const resp = result.response;
      const text = resp.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      const functionCalls: any[] = [];
      for (const part of resp.candidates?.[0]?.content?.parts ?? []) {
        if (part.functionCall) functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args });
      }
      return { text, functionCalls, model: 'vertex-gemini-1.5-flash', grounded: true };
    } catch (e: any) {
      console.warn('[EcoEquity] Vertex AI unavailable, dropping to Reservoir fallback.');
    }
  }

  // 2. THE RESERVOIR FALLBACK (Resilient Failover)
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('API Key missing.');

  const pool = await getAvailableModels(apiKey);
  
  for (const modelName of pool) {
    if (modelBlacklist.has(modelName)) continue;

    try {
      console.log(`[EcoEquity] Attempting Reservoir Model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearchRetrieval: {} }, ...AGENT_TOOLS] as any,
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      });

      const parts: any[] = [{ text: query }];
      if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });

      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const resp = result.response;
      const text = resp.text();
      const functionCalls: any[] = [];

      for (const part of resp.candidates?.[0]?.content?.parts ?? []) {
        if ((part as any).functionCall) {
          functionCalls.push({ name: (part as any).functionCall.name, args: (part as any).functionCall.args });
        }
      }

      return { text, functionCalls, model: modelName, grounded: false };
    } catch (e: any) {
      const errorMsg = e.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.error(`[EcoEquity] ${modelName} EXHAUSTED (429). Blacklisting and rotating...`);
        modelBlacklist.add(modelName);
        // Clean blacklist after 1 minute to re-test availability
        setTimeout(() => modelBlacklist.delete(modelName), 60000);
        continue;
      }
      console.error(`[EcoEquity] ${modelName} failed unexpectedly:`, errorMsg);
      continue;
    }
  }

  throw new Error('Intelligence reservoir completely exhausted. All available Gemini models have hit their free-tier limits. Please wait 60 seconds.');
}

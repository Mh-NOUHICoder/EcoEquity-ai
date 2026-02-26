import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log(
    `[API] /api/sentinel/catalog POST handler invoked at ${new Date().toISOString()}`
  );

  try {
    const body = await request.json();
    console.log('[API] Request body received:', body);

    // This is a test response to confirm the endpoint is working.
    const responsePayload = {
      ok: true,
      message: 'Sentinel catalog POST route is working correctly.',
      receivedBody: body,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[API] Error parsing JSON body:', error);
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON in request body.' },
      { status: 400 }
    );
  }
}
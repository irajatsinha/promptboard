// =============================================================================
// 8. APP/API/SUBMIT/ROUTE.TS - Submit Prompt API
// =============================================================================
// app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hashIP, getClientIP, validatePromptInput } from '@/lib/utils';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validatePromptInput(body);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 422 }
      );
    }

    const clientIP = getClientIP(req.headers);
    const hashedIP = hashIP(clientIP);

    // Check if IP is banned
    const banned = await sql`
      SELECT 1 FROM banned_ips WHERE hashed_ip = ${hashedIP}
    `;
    if (banned.length > 0) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    // Rate limiting: max 10 submissions per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await sql`
      SELECT COUNT(*) as count
      FROM ip_events
      WHERE hashed_ip = ${hashedIP}
        AND event_type = 'submit'
        AND created_at > ${oneHourAgo.toISOString()}
    `;
    
    if (Number(recentEvents[0].count) >= 10) {
      return NextResponse.json(
        { error: 'Slow down—too many submissions from your IP. Try again soon.' },
        { status: 429 }
      );
    }

    // Insert prompt
    const editToken = randomUUID();
    const result = await sql`
      INSERT INTO prompts (title, prompt_text, name, tag, edit_token)
      VALUES (
        ${body.title},
        ${body.prompt_text},
        ${body.name},
        ${body.tag || null},
        ${editToken}
      )
      RETURNING id, edit_token
    `;

    const promptId = result[0].id;

    // Log the event
    await sql`
      INSERT INTO ip_events (hashed_ip, event_type)
      VALUES (${hashedIP}, 'submit')
    `;

    // Generate edit URL
    const editURL = `${req.nextUrl.origin}/edit?token=${editToken}&id=${promptId}`;

    // Prepare response with cookie
    const response = NextResponse.json({
      success: true,
      id: promptId,
      edit_token: editToken,
      edit_url: editURL,
    });

    // Update pb_edit_tokens cookie
    const existingTokens = req.cookies.get('pb_edit_tokens')?.value || '[]';
    let tokens: string[] = [];
    try {
      tokens = JSON.parse(existingTokens);
    } catch {}
    tokens.push(editToken);
    
    response.cookies.set('pb_edit_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

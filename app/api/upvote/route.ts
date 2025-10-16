// app/api/upvote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hashIP, getClientIP, hotScore } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt_id } = body;

    if (!prompt_id) {
      return NextResponse.json(
        { error: 'prompt_id required.' },
        { status: 400 }
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

    // Check for duplicate vote
    const existing = await sql`
      SELECT 1 FROM votes
      WHERE prompt_id = ${prompt_id} AND hashed_ip = ${hashedIP}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Upvote already counted from your network for this prompt.' },
        { status: 409 }
      );
    }

    // Insert vote
    await sql`
      INSERT INTO votes (prompt_id, hashed_ip)
      VALUES (${prompt_id}, ${hashedIP})
    `;

    // Update votes_count and score_cached
    const promptData = await sql`
      SELECT votes_count, created_at
      FROM prompts
      WHERE id = ${prompt_id}
    `;

    const newVotesCount = promptData[0].votes_count + 1;
    const newScore = hotScore(newVotesCount, promptData[0].created_at);

    await sql`
      UPDATE prompts
      SET votes_count = ${newVotesCount},
          score_cached = ${newScore}
      WHERE id = ${prompt_id}
    `;

    // Set upvote cookie
    const response = NextResponse.json({
      success: true,
      votes_count: newVotesCount,
    });

    const existingUpvotes = req.cookies.get('pb_upvotes')?.value || '[]';
    let upvotes: string[] = [];
    try {
      upvotes = JSON.parse(existingUpvotes);
    } catch {}
    upvotes.push(prompt_id);

    response.cookies.set('pb_upvotes', JSON.stringify(upvotes), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Upvote error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
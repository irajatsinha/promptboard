// app/api/admin/wipe_votes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hotScore } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id } = body;

    // Delete all votes for this prompt
    await sql`
      DELETE FROM votes WHERE prompt_id = ${id}
    `;

    // Reset votes_count and score
    const promptData = await sql`
      SELECT created_at FROM prompts WHERE id = ${id}
    `;

    const newScore = hotScore(0, promptData[0].created_at);

    await sql`
      UPDATE prompts
      SET votes_count = 0,
          score_cached = ${newScore}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin wipe votes error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
// app/api/admin/recompute_hot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hotScore } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // Get all non-deleted prompts
    const prompts = await sql`
      SELECT id, votes_count, created_at
      FROM prompts
      WHERE is_deleted = false
    `;

    // Recompute scores
    for (const prompt of prompts) {
      const newScore = hotScore(prompt.votes_count, prompt.created_at);
      await sql`
        UPDATE prompts
        SET score_cached = ${newScore}
        WHERE id = ${prompt.id}
      `;
    }

    return NextResponse.json({
      success: true,
      updated: prompts.length,
    });
  } catch (error: any) {
    console.error('Recompute hot error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
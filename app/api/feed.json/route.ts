// app/api/feed.json/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const prompts = await sql`
      SELECT 
        id, title, prompt_text, name, tag,
        votes_count, created_at
      FROM prompts
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ prompts });
  } catch (error: any) {
    console.error('Feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
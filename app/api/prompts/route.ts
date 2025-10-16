// app/api/prompts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'hot';
    const range = searchParams.get('range') || 'all';
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;

    let orderBy = 'score_cached DESC';
    let dateFilter = sql``;

    if (sort === 'new') {
      orderBy = 'created_at DESC';
    } else if (sort === 'top') {
      orderBy = 'votes_count DESC';
      
      if (range === '7d') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = sql`AND created_at > ${sevenDaysAgo.toISOString()}`;
      } else if (range === '24h') {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        dateFilter = sql`AND created_at > ${oneDayAgo.toISOString()}`;
      }
    }

    const prompts = await sql`
      SELECT 
        id, title, prompt_text, name, tag, 
        votes_count, created_at, updated_at, edit_token
      FROM prompts
      WHERE is_deleted = false ${dateFilter}
      ORDER BY ${sql.unsafe(orderBy)}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get user's edit tokens from cookie
    const cookieTokens = req.cookies.get('pb_edit_tokens')?.value || '[]';
    let userTokens: string[] = [];
    try {
      userTokens = JSON.parse(cookieTokens);
    } catch {}

    // Get user's upvotes
    const cookieUpvotes = req.cookies.get('pb_upvotes')?.value || '[]';
    let userUpvotes: string[] = [];
    try {
      userUpvotes = JSON.parse(cookieUpvotes);
    } catch {}

    // Add ownership and upvote flags
    const enrichedPrompts = prompts.map(p => ({
      id: p.id,
      title: p.title,
      prompt_text: p.prompt_text,
      name: p.name,
      tag: p.tag,
      votes_count: p.votes_count,
      created_at: p.created_at,
      updated_at: p.updated_at,
      is_owner: userTokens.includes(p.edit_token),
      has_upvoted: userUpvotes.includes(p.id),
    }));

    return NextResponse.json({
      prompts: enrichedPrompts,
      hasMore: prompts.length === limit,
    });
  } catch (error: any) {
    console.error('Get prompts error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
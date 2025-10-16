import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const { hashed_ip, reason } = body;

    await sql`
      INSERT INTO banned_ips (hashed_ip, reason)
      VALUES (${hashed_ip}, ${reason || ''})
      ON CONFLICT (hashed_ip) DO UPDATE
      SET reason = ${reason || ''}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin ban error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
// app/api/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validatePromptInput } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, edit_token, title, prompt_text, name, tag } = body;

    if (!id || !edit_token) {
      return NextResponse.json(
        { error: 'id and edit_token required.' },
        { status: 400 }
      );
    }

    // Verify edit token
    const prompt = await sql`
      SELECT edit_token FROM prompts WHERE id = ${id}
    `;

    if (prompt.length === 0 || prompt[0].edit_token !== edit_token) {
      return NextResponse.json(
        { error: 'Edit link invalid. If you just posted, use the link we showed you.' },
        { status: 403 }
      );
    }

    // Validate new data
    const validation = validatePromptInput({
      title: title || '',
      prompt_text: prompt_text || '',
      name: name || '',
      tag: tag || '',
      honeypot: '',
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 422 }
      );
    }

    // Update prompt
    await sql`
      UPDATE prompts
      SET title = ${title},
          prompt_text = ${prompt_text},
          name = ${name},
          tag = ${tag || null},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
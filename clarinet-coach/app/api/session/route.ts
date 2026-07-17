// app/api/session/route.ts
// Save and retrieve practice sessions. Requires auth via Supabase JWT.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';
import type { PracticeSession } from '../../../lib/types';

export async function POST(req: NextRequest) {
  const supabase = createServerClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session: Omit<PracticeSession, 'id' | 'userId' | 'createdAt'> = await req.json();

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: user.id,
      duration_seconds: session.durationSeconds,
      score_title: session.scoreTitle,
      effective_bpm: session.effectiveBpm,
      feedback: session.feedback,
      event_log: session.eventLog,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// lib/supabase/server.ts — Server client (uses service role for API routes)
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export function createServerClient(_req: NextRequest) {
  // Service role bypasses RLS — only use in API routes, never expose to client
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

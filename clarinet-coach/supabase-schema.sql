-- Run this in the Supabase dashboard SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Practice sessions table
create table if not exists practice_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  created_at       timestamptz default now() not null,
  duration_seconds integer not null default 0,
  score_title      text,
  effective_bpm    integer not null default 80,
  feedback         jsonb not null default '{}',
  event_log        jsonb not null default '[]'
);

-- Row-level security: users can only see their own sessions
alter table practice_sessions enable row level security;

create policy "users_own_sessions" on practice_sessions
  for all using (auth.uid() = user_id);

-- Index for fast user history queries
create index if not exists idx_practice_sessions_user_id
  on practice_sessions(user_id, created_at desc);

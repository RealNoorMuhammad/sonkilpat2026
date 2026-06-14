-- =============================================================================
-- Stickman Fighter — online PvP room registry
-- =============================================================================
-- Run this in the Supabase dashboard:  SQL Editor → New query → paste → Run.
--
-- This table is OPTIONAL. The realtime fight itself uses Supabase Realtime
-- Broadcast + Presence (no table needed). This registry adds:
--   * "Room not found" / "Room expired" validation when joining
--   * automatic cleanup of stale rooms
--
-- The game client (net/multiplayerManager.js) uses this table when it exists
-- and silently falls back to channel-only mode if it does not.
-- =============================================================================

create table if not exists public.stickman_rooms (
    code        text primary key,                                   -- 6-char room code (channel name)
    host_id     text not null,                                      -- creator's client id
    host_name   text,                                               -- creator's display name
    guest_name  text,                                               -- joiner's display name
    status      text not null default 'waiting',                    -- waiting | in_progress | finished
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null default now() + interval '30 minutes'
);

-- For tables created before names were added — safe to run repeatedly.
alter table public.stickman_rooms add column if not exists host_name  text;
alter table public.stickman_rooms add column if not exists guest_name text;

-- Speeds up the cleanup query below.
create index if not exists stickman_rooms_expires_idx
    on public.stickman_rooms (expires_at);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- This is a casual game that connects with the public anon key and no user
-- login, so all operations are open. Tighten these later if you add auth.
alter table public.stickman_rooms enable row level security;

drop policy if exists "stickman_rooms_select" on public.stickman_rooms;
drop policy if exists "stickman_rooms_insert" on public.stickman_rooms;
drop policy if exists "stickman_rooms_update" on public.stickman_rooms;
drop policy if exists "stickman_rooms_delete" on public.stickman_rooms;

create policy "stickman_rooms_select"
    on public.stickman_rooms for select
    using (true);

create policy "stickman_rooms_insert"
    on public.stickman_rooms for insert
    with check (true);

create policy "stickman_rooms_update"
    on public.stickman_rooms for update
    using (true) with check (true);

create policy "stickman_rooms_delete"
    on public.stickman_rooms for delete
    using (true);

-- =============================================================================
-- OPTIONAL: automatic cleanup of expired rooms (every 10 minutes)
-- -----------------------------------------------------------------------------
-- Requires the pg_cron extension. Enable it once under:
--   Database → Extensions → search "pg_cron" → enable.
-- Then uncomment and run the block below.
-- =============================================================================
-- create extension if not exists pg_cron;
--
-- select cron.schedule(
--     'stickman-rooms-cleanup',
--     '*/10 * * * *',
--     $$ delete from public.stickman_rooms where expires_at < now(); $$
-- );

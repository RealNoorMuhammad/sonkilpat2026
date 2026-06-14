-- =============================================================================
-- Stickman Fighter — player accounts + leaderboard
-- =============================================================================
-- Run this in the Supabase dashboard:  SQL Editor → New query → paste → Run.
--
-- Each player is identified by their Phantom (Solana) wallet address. A player
-- picks a display name once; names are unique (case-insensitive). round_wins is
-- the running total of rounds the player has won, used for the leaderboard.
-- =============================================================================

create table if not exists public.stickman_players (
    address     text primary key,                  -- Phantom / Solana wallet address
    name        text not null,                      -- chosen display name (unique)
    round_wins  integer not null default 0,         -- total rounds won (leaderboard score)
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Case-insensitive unique names ("Son" and "son" collide).
create unique index if not exists stickman_players_name_key
    on public.stickman_players (lower(name));

-- Leaderboard ordering.
create index if not exists stickman_players_wins_idx
    on public.stickman_players (round_wins desc);

-- -----------------------------------------------------------------------------
-- Atomic round-win increment (avoids read-modify-write races between clients).
-- -----------------------------------------------------------------------------
create or replace function public.increment_round_wins(p_address text, p_delta integer)
returns void
language sql
as $$
    update public.stickman_players
       set round_wins = round_wins + greatest(p_delta, 0),
           updated_at = now()
     where address = p_address;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- Casual game, connects with the public anon key and no server-side auth, so
-- operations are open. Tighten later (e.g. verify a signed message) if needed.
alter table public.stickman_players enable row level security;

drop policy if exists "stickman_players_select" on public.stickman_players;
drop policy if exists "stickman_players_insert" on public.stickman_players;
drop policy if exists "stickman_players_update" on public.stickman_players;

create policy "stickman_players_select"
    on public.stickman_players for select
    using (true);

create policy "stickman_players_insert"
    on public.stickman_players for insert
    with check (true);

create policy "stickman_players_update"
    on public.stickman_players for update
    using (true) with check (true);

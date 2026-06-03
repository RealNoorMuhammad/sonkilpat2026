-- Run after meme_feature.sql
-- Adds comments table + one-upload-per-wallet constraint

create table if not exists public.meme_comments (
  id uuid primary key default gen_random_uuid(),
  meme_id uuid not null references public.memes(id) on delete cascade,
  wallet_address text not null check (char_length(trim(wallet_address)) between 32 and 64),
  comment_text text not null check (char_length(trim(comment_text)) between 1 and 280),
  created_at timestamptz not null default now(),
  unique (meme_id, wallet_address)
);

create index if not exists idx_meme_comments_meme_id on public.meme_comments (meme_id);
create index if not exists idx_meme_comments_created_at on public.meme_comments (created_at desc);

-- One Solana address can upload only once
create unique index if not exists idx_memes_author_wallet_unique
on public.memes (author_wallet);

alter table public.meme_comments enable row level security;

drop policy if exists meme_comments_select_public on public.meme_comments;
create policy meme_comments_select_public
on public.meme_comments
for select
to anon, authenticated
using (true);

drop policy if exists meme_comments_insert_public on public.meme_comments;
create policy meme_comments_insert_public
on public.meme_comments
for insert
to anon, authenticated
with check (
  char_length(trim(wallet_address)) between 32 and 64
  and char_length(trim(comment_text)) between 1 and 280
);

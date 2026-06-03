-- Meme upload + likes + leaderboard schema
-- Run in Supabase SQL editor or migration runner.

create extension if not exists pgcrypto;

create table if not exists public.memes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 80),
  author_wallet text not null check (char_length(trim(author_wallet)) between 32 and 64),
  image_path text not null,
  image_url text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.meme_likes (
  id uuid primary key default gen_random_uuid(),
  meme_id uuid not null references public.memes(id) on delete cascade,
  wallet_address text not null check (char_length(trim(wallet_address)) between 32 and 64),
  created_at timestamptz not null default now(),
  unique (meme_id, wallet_address)
);

create index if not exists idx_memes_created_at on public.memes (created_at desc);
create index if not exists idx_memes_likes_count on public.memes (likes_count desc, created_at desc);
create index if not exists idx_meme_likes_meme_id on public.meme_likes (meme_id);
create index if not exists idx_meme_likes_wallet on public.meme_likes (wallet_address);

create or replace function public.sync_meme_likes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.memes
    set likes_count = likes_count + 1
    where id = new.meme_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.memes
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.meme_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_meme_likes_count on public.meme_likes;
create trigger trg_sync_meme_likes_count
after insert or delete on public.meme_likes
for each row
execute function public.sync_meme_likes_count();

alter table public.memes enable row level security;
alter table public.meme_likes enable row level security;

drop policy if exists memes_select_public on public.memes;
create policy memes_select_public
on public.memes
for select
to anon, authenticated
using (true);

drop policy if exists memes_insert_public on public.memes;
create policy memes_insert_public
on public.memes
for insert
to anon, authenticated
with check (
  char_length(trim(title)) between 2 and 80
  and char_length(trim(author_wallet)) between 32 and 64
);

drop policy if exists meme_likes_select_public on public.meme_likes;
create policy meme_likes_select_public
on public.meme_likes
for select
to anon, authenticated
using (true);

drop policy if exists meme_likes_insert_public on public.meme_likes;
create policy meme_likes_insert_public
on public.meme_likes
for insert
to anon, authenticated
with check (char_length(trim(wallet_address)) between 32 and 64);

-- Optional unlike support from client:
drop policy if exists meme_likes_delete_public on public.meme_likes;
create policy meme_likes_delete_public
on public.meme_likes
for delete
to anon, authenticated
using (char_length(trim(wallet_address)) between 32 and 64);

-- Storage bucket setup (run once).
insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do nothing;

drop policy if exists memes_bucket_public_read on storage.objects;
create policy memes_bucket_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'memes');

drop policy if exists memes_bucket_public_insert on storage.objects;
create policy memes_bucket_public_insert
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'memes');

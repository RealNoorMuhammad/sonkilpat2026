-- Resync memes.likes_count with actual meme_likes rows.
-- Run this if leaderboard order doesn't match displayed like counts.

update public.memes m
set likes_count = coalesce(
  (
    select count(*)::integer
    from public.meme_likes ml
    where ml.meme_id = m.id
  ),
  0
);

-- Ensure trigger keeps likes_count in sync going forward
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

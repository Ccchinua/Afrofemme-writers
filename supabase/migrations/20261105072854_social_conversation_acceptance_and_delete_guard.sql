revoke delete on public.conversations from authenticated;
drop policy if exists "Creators remove empty conversations" on public.conversations;

drop policy if exists "Members read reposts" on public.circle_reposts;
create policy "Members read reposts" on public.circle_reposts
for select to authenticated
using (
  exists (
    select 1 from public.circle_posts p
    where p.id = post_id and p.is_hidden = false
  )
);

create or replace function private.guard_conversation_member_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requester_id uuid;
begin
  if new.conversation_id <> old.conversation_id or new.user_id <> old.user_id then
    raise exception 'Conversation membership identity cannot be changed.';
  end if;
  if new.accepted_at is distinct from old.accepted_at then
    if old.accepted_at is not null then
      raise exception 'Conversation acceptance cannot be reversed.';
    end if;
    select c.created_by into requester_id
    from public.conversations c where c.id = old.conversation_id;
    if new.accepted_at is not null and requester_id = old.user_id then
      raise exception 'The original requester cannot accept on behalf of the recipient.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_conversation_member_update() from public, anon, authenticated;
drop trigger if exists guard_conversation_member_update on public.conversation_members;
create trigger guard_conversation_member_update
before update on public.conversation_members
for each row execute function private.guard_conversation_member_update();
create or replace function private.is_conversation_blocked(target_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = target_conversation
      and private.is_blocked_between(c.participant_one,c.participant_two)
  );
$$;
revoke all on function private.is_conversation_blocked(uuid) from public, anon;
grant execute on function private.is_conversation_blocked(uuid) to authenticated;

drop policy if exists "Participants read allowed messages" on public.messages;
create policy "Participants read allowed messages" on public.messages
for select to authenticated
using (
  private.is_conversation_member(conversation_id)
  and not private.is_conversation_blocked(conversation_id)
  and (sender_id = (select auth.uid()) or private.conversation_is_accepted(conversation_id))
);

drop policy if exists "Participants read membership in their conversations" on public.conversation_members;
create policy "Participants read membership in their conversations" on public.conversation_members
for select to authenticated
using (
  private.is_conversation_member(conversation_id)
  and not private.is_conversation_blocked(conversation_id)
);
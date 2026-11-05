drop policy if exists "Members read their own conversation membership" on public.conversation_members;
create policy "Participants read membership in their conversations" on public.conversation_members
for select to authenticated
using (private.is_conversation_member(conversation_id));
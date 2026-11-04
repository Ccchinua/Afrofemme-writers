drop policy if exists "Community challenge entries are readable" on public.challenge_entries;
create policy "Public community challenge entries are readable" on public.challenge_entries
for select to anon using (visibility = 'community');
create policy "Members read community and own challenge entries" on public.challenge_entries
for select to authenticated
using (
  visibility = 'community'
  or author_id = (select auth.uid())
  or (select private.has_role('admin'::app_role))
  or (select private.has_role('super_admin'::app_role))
);

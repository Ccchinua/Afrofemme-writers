-- Let members publish their own stories immediately. Editorial review is optional.
begin;
drop policy if exists "Authors create own draft stories" on public.stories;
create policy "Authors create own stories" on public.stories
for insert to authenticated
with check (auth.uid() = author_id and status in ('draft'::public.story_status, 'published'::public.story_status));

drop policy if exists "Authors update own drafts" on public.stories;
create policy "Authors update own stories" on public.stories
for update to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id and status in ('draft'::public.story_status, 'published'::public.story_status));
commit;

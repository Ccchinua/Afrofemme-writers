create policy "Authors resubmit requested revisions" on public.editorial_submissions
for update to authenticated
using (author_id = (select auth.uid()) and status = 'revision_requested')
with check (author_id = (select auth.uid()) and status = 'submitted');
create policy "Editors can read stories under review" on public.stories
for select to authenticated
using (private.has_role('admin') or private.has_role('super_admin'));
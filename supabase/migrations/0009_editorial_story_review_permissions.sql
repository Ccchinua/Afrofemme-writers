create policy "Editors can update stories during review" on public.stories
for update to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));
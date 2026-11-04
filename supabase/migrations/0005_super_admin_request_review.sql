-- Allow only the protected Super Admin to review admin access requests.
drop policy if exists "Super admins review admin requests" on public.admin_requests;
create policy "Super admins review admin requests" on public.admin_requests
for select to authenticated using (private.has_role('super_admin'));
drop policy if exists "Super admins decide admin requests" on public.admin_requests;
create policy "Super admins decide admin requests" on public.admin_requests
for update to authenticated using (private.has_role('super_admin'))
with check (private.has_role('super_admin'));

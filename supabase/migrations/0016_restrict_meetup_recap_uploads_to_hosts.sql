drop policy if exists "Hosts upload meetup recap photos" on storage.objects;
create policy "Hosts upload meetup recap photos" on storage.objects for insert to authenticated
with check (
 bucket_id='meetup-recaps'
 and (storage.foldername(name))[1]=auth.uid()::text
 and exists (
   select 1 from public.literary_events e
   where e.id=(storage.foldername(name))[2]::uuid
   and (e.host_id=auth.uid() or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role))
 )
);
drop policy if exists "Hosts update own meetup recap photos" on storage.objects;
create policy "Hosts update own meetup recap photos" on storage.objects for update to authenticated
using (
 bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text
 and exists (select 1 from public.literary_events e where e.id=(storage.foldername(name))[2]::uuid and (e.host_id=auth.uid() or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role)))
)
with check (
 bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text
 and exists (select 1 from public.literary_events e where e.id=(storage.foldername(name))[2]::uuid and (e.host_id=auth.uid() or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role)))
);
drop policy if exists "Hosts delete own meetup recap photos" on storage.objects;
create policy "Hosts delete own meetup recap photos" on storage.objects for delete to authenticated
using (
 bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text
 and exists (select 1 from public.literary_events e where e.id=(storage.foldername(name))[2]::uuid and (e.host_id=auth.uid() or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role)))
);
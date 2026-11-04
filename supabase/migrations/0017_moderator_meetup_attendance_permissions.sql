alter table private.event_reminder_deliveries disable row level security;
grant select, update on public.event_registrations to authenticated;
drop policy if exists "Moderators manage meetup attendance" on public.event_registrations;
create policy "Moderators manage meetup attendance" on public.event_registrations
for all to authenticated
using (
 private.has_role('admin'::public.app_role)
 or private.has_role('super_admin'::public.app_role)
)
with check (
 private.has_role('admin'::public.app_role)
 or private.has_role('super_admin'::public.app_role)
);
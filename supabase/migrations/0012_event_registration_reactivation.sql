drop policy if exists "Members cancel own registrations" on public.event_registrations;
create policy "Members manage own event registrations" on public.event_registrations
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and attendance_status in ('registered','cancelled'));
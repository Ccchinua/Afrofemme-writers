create or replace function private.register_for_event_impl(p_event_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_capacity integer; v_start timestamptz; v_published boolean; v_count integer; v_status text;
begin
 if v_user is null then raise exception 'Sign in to register.'; end if;
 select e.capacity,e.starts_at,e.is_published into v_capacity,v_start,v_published from public.literary_events e where e.id=p_event_id for update;
 if not found or not v_published then raise exception 'This event is not available for registration.'; end if;
 if v_start <= pg_catalog.now() then raise exception 'Registration for this event has closed.'; end if;
 select r.attendance_status into v_status from public.event_registrations r where r.event_id=p_event_id and r.user_id=v_user;
 if v_status in ('registered','waitlisted') then return v_status; end if;
 select count(*)::integer into v_count from public.event_registrations r where r.event_id=p_event_id and r.attendance_status='registered';
 v_status := case when v_capacity is not null and v_count >= v_capacity then 'waitlisted' else 'registered' end;
 insert into public.event_registrations(event_id,user_id,attendance_status,registered_at) values(p_event_id,v_user,v_status,pg_catalog.now())
 on conflict(event_id,user_id) do update set attendance_status=excluded.attendance_status,registered_at=excluded.registered_at;
 return v_status;
end; $$;
create or replace function private.cancel_event_registration_impl(p_event_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_old text; v_capacity integer; v_count integer; v_promoted uuid;
begin
 if v_user is null then raise exception 'Sign in to manage your registration.'; end if;
 select r.attendance_status into v_old from public.event_registrations r where r.event_id=p_event_id and r.user_id=v_user for update;
 if v_old is null or v_old='cancelled' then return 'cancelled'; end if;
 update public.event_registrations set attendance_status='cancelled' where event_id=p_event_id and user_id=v_user;
 if v_old='registered' then
  select e.capacity into v_capacity from public.literary_events e where e.id=p_event_id for update;
  if v_capacity is not null then
   select count(*)::integer into v_count from public.event_registrations r where r.event_id=p_event_id and r.attendance_status='registered';
   if v_count < v_capacity then
    select r.user_id into v_promoted from public.event_registrations r where r.event_id=p_event_id and r.attendance_status='waitlisted' order by r.registered_at asc limit 1 for update;
    if v_promoted is not null then
     update public.event_registrations set attendance_status='registered' where event_id=p_event_id and user_id=v_promoted;
     insert into public.member_notifications(user_id,kind,title,body,href) values(v_promoted,'event_waitlist_promoted','A place opened up','You have been moved from the waiting list into this event.','/events');
    end if;
   end if;
  end if;
 end if;
 return 'cancelled';
end; $$;
revoke all on function private.register_for_event_impl(uuid) from public,anon;
revoke all on function private.cancel_event_registration_impl(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.register_for_event_impl(uuid) to authenticated;
grant execute on function private.cancel_event_registration_impl(uuid) to authenticated;
create or replace function public.register_for_event(p_event_id uuid)
returns text language sql security invoker set search_path = '' as $$ select private.register_for_event_impl(p_event_id); $$;
create or replace function public.cancel_event_registration(p_event_id uuid)
returns text language sql security invoker set search_path = '' as $$ select private.cancel_event_registration_impl(p_event_id); $$;
revoke all on function public.register_for_event(uuid) from public,anon;
revoke all on function public.cancel_event_registration(uuid) from public,anon;
grant execute on function public.register_for_event(uuid) to authenticated;
grant execute on function public.cancel_event_registration(uuid) to authenticated;
create table if not exists private.event_reminder_deliveries (
 event_id uuid not null references public.literary_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 sent_at timestamptz not null default now(),
 primary key(event_id,user_id)
);
alter table private.event_reminder_deliveries disable row level security;
revoke all on private.event_reminder_deliveries from anon,authenticated;
create or replace function private.dispatch_event_reminders()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
 with upcoming as (
  select r.event_id,r.user_id,e.title,e.starts_at
  from public.event_registrations r join public.literary_events e on e.id=r.event_id
  where r.attendance_status='registered' and e.is_published=true
    and e.starts_at > pg_catalog.now() + interval '23 hours'
    and e.starts_at <= pg_catalog.now() + interval '24 hours'
 ), inserted as (
  insert into private.event_reminder_deliveries(event_id,user_id)
  select event_id,user_id from upcoming on conflict(event_id,user_id) do nothing returning event_id,user_id
 )
 insert into public.member_notifications(user_id,kind,title,body,href)
 select u.user_id,'event_reminder','Your Afrofemme gathering is tomorrow',
        'A reminder: ' || u.title || ' starts tomorrow. We look forward to seeing you.','/gatherings'
 from upcoming u join inserted i on i.event_id=u.event_id and i.user_id=u.user_id;
 get diagnostics v_count = row_count;
 return v_count;
end; $$;
revoke all on function private.dispatch_event_reminders() from public,anon,authenticated;
grant execute on function private.dispatch_event_reminders() to postgres;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('afrofemme-event-reminders','0 * * * *','select private.dispatch_event_reminders();');
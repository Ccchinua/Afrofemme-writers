alter table public.literary_events
  add column if not exists event_type text not null default 'literary_event',
  add column if not exists capacity integer,
  add column if not exists host_id uuid references auth.users(id) on delete set null,
  add column if not exists is_meetup boolean not null default false;
alter table public.literary_events drop constraint if exists literary_events_capacity_check;
alter table public.literary_events add constraint literary_events_capacity_check check (capacity is null or capacity > 0);
alter table public.literary_events drop constraint if exists literary_events_event_type_check;
alter table public.literary_events add constraint literary_events_event_type_check check (event_type in ('meetup','workshop','book_club','poetry','open_mic','literary_event'));
alter table public.event_registrations drop constraint if exists event_registrations_attendance_status_check;
alter table public.event_registrations add constraint event_registrations_attendance_status_check check (attendance_status in ('registered','waitlisted','attended','cancelled'));
create table if not exists public.meetup_proposals (id uuid primary key default gen_random_uuid(), proposer_id uuid not null references auth.users(id) on delete cascade, title text not null check (char_length(title) between 5 and 120), description text not null check (char_length(description) between 20 and 3000), event_type text not null default 'meetup' check (event_type in ('meetup','workshop','book_club','poetry','open_mic')), county text not null, venue text, proposed_at timestamptz not null, capacity integer check (capacity is null or capacity between 2 and 500), host_name text, contact_note text, status text not null default 'pending' check (status in ('pending','approved','declined')), admin_note text, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, published_event_id uuid references public.literary_events(id) on delete set null, created_at timestamptz not null default now());
alter table public.meetup_proposals enable row level security;
drop policy if exists "Members propose meetups" on public.meetup_proposals;
create policy "Members propose meetups" on public.meetup_proposals for insert to authenticated with check (proposer_id = (select auth.uid()) and status = 'pending' and reviewed_by is null);
drop policy if exists "Members read own meetup proposals" on public.meetup_proposals;
create policy "Members read own meetup proposals" on public.meetup_proposals for select to authenticated using (proposer_id = (select auth.uid()));
drop policy if exists "Moderators manage meetup proposals" on public.meetup_proposals;
create policy "Moderators manage meetup proposals" on public.meetup_proposals for all to authenticated using (private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role)) with check (private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role));
grant select, insert on public.meetup_proposals to authenticated;
create table if not exists public.meetup_gallery (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.literary_events(id) on delete cascade, uploaded_by uuid not null references auth.users(id) on delete cascade, image_url text not null, caption text check (caption is null or char_length(caption) <= 240), created_at timestamptz not null default now());
alter table public.meetup_gallery enable row level security;
drop policy if exists "Public read published meetup galleries" on public.meetup_gallery;
create policy "Public read published meetup galleries" on public.meetup_gallery for select to anon, authenticated using (exists (select 1 from public.literary_events e where e.id = event_id and e.is_published = true));
drop policy if exists "Hosts and moderators add meetup photos" on public.meetup_gallery;
create policy "Hosts and moderators add meetup photos" on public.meetup_gallery for insert to authenticated with check (uploaded_by = (select auth.uid()) and exists (select 1 from public.literary_events e where e.id = event_id and (e.host_id = (select auth.uid()) or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role))));
drop policy if exists "Uploader or moderators remove meetup photos" on public.meetup_gallery;
create policy "Uploader or moderators remove meetup photos" on public.meetup_gallery for delete to authenticated using (uploaded_by = (select auth.uid()) or private.has_role('admin'::public.app_role) or private.has_role('super_admin'::public.app_role));
grant select, insert, delete on public.meetup_gallery to anon, authenticated;
create or replace function public.register_for_event(p_event_id uuid) returns text language plpgsql security definer set search_path = '' as $$
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
insert into public.event_registrations(event_id,user_id,attendance_status,registered_at) values(p_event_id,v_user,v_status,pg_catalog.now()) on conflict(event_id,user_id) do update set attendance_status=excluded.attendance_status,registered_at=excluded.registered_at;
return v_status; end; $$;
revoke all on function public.register_for_event(uuid) from public,anon;
grant execute on function public.register_for_event(uuid) to authenticated;
create or replace function public.cancel_event_registration(p_event_id uuid) returns text language plpgsql security definer set search_path = '' as $$
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
end if; end if; end if; end if; return 'cancelled'; end; $$;
revoke all on function public.cancel_event_registration(uuid) from public,anon;
grant execute on function public.cancel_event_registration(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('meetup-recaps','meetup-recaps',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
drop policy if exists "Public read meetup recap photos" on storage.objects;
create policy "Public read meetup recap photos" on storage.objects for select to anon,authenticated using(bucket_id='meetup-recaps');
drop policy if exists "Hosts upload meetup recap photos" on storage.objects;
create policy "Hosts upload meetup recap photos" on storage.objects for insert to authenticated with check(bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Hosts update own meetup recap photos" on storage.objects;
create policy "Hosts update own meetup recap photos" on storage.objects for update to authenticated using(bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Hosts delete own meetup recap photos" on storage.objects;
create policy "Hosts delete own meetup recap photos" on storage.objects for delete to authenticated using(bucket_id='meetup-recaps' and (storage.foldername(name))[1]=auth.uid()::text);
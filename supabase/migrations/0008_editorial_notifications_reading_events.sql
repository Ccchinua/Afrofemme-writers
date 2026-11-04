-- Afrofemme Writers: editorial workflow, member notifications, reading history and event RSVPs.
create table if not exists public.editorial_submissions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','in_review','revision_requested','accepted','declined')),
  author_note text not null default '' check (char_length(author_note) <= 2000),
  editor_note text not null default '' check (char_length(editor_note) <= 4000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique(story_id)
);
create index if not exists editorial_submissions_status_date_idx on public.editorial_submissions(status, submitted_at desc);
create index if not exists editorial_submissions_author_idx on public.editorial_submissions(author_id, submitted_at desc);

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('new_follower','story_like','story_comment','editorial_update','event_reminder','community_reply')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 500),
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_notifications_inbox_idx on public.member_notifications(user_id, created_at desc);
create index if not exists member_notifications_unread_idx on public.member_notifications(user_id) where read_at is null;

create table if not exists public.reading_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  primary key(user_id, story_id)
);
create index if not exists reading_history_recent_idx on public.reading_history(user_id, last_read_at desc);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.literary_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  attendance_status text not null default 'registered' check (attendance_status in ('registered','attended','cancelled')),
  unique(event_id,user_id)
);
create index if not exists event_registrations_event_idx on public.event_registrations(event_id);

alter table public.editorial_submissions enable row level security;
alter table public.member_notifications enable row level security;
alter table public.reading_history enable row level security;
alter table public.event_registrations enable row level security;

create policy "Authors and editors read submissions" on public.editorial_submissions
for select to authenticated
using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Authors submit own stories for review" on public.editorial_submissions
for insert to authenticated
with check (author_id = (select auth.uid()) and exists (
  select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid()) and s.status = 'draft'
));
create policy "Editors update submissions" on public.editorial_submissions
for update to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));

create policy "Members read own notifications" on public.member_notifications
for select to authenticated using (user_id = (select auth.uid()));
create policy "Members mark own notifications read" on public.member_notifications
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Members delete own notifications" on public.member_notifications
for delete to authenticated using (user_id = (select auth.uid()));

create policy "Members manage own reading history" on public.reading_history
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Members read own event registrations" on public.event_registrations
for select to authenticated using (user_id = (select auth.uid()));
create policy "Members register themselves" on public.event_registrations
for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.literary_events e where e.id = event_id and e.is_published = true
  )
);
create policy "Members cancel own registrations" on public.event_registrations
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and attendance_status = 'cancelled');

create or replace function private.notify_new_follower()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.followed_id <> new.follower_id then
    insert into public.member_notifications(user_id,actor_id,kind,title,body,href)
    values(new.followed_id,new.follower_id,'new_follower','You have a new follower','Someone started following your writing.','/writers');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_new_follower() from public, anon, authenticated;
drop trigger if exists notify_new_follower on public.follows;
create trigger notify_new_follower after insert on public.follows
for each row execute function private.notify_new_follower();

create or replace function private.notify_story_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare story_author uuid;
begin
  select author_id into story_author from public.stories where id = new.story_id;
  if story_author is not null and story_author <> new.user_id then
    insert into public.member_notifications(user_id,actor_id,kind,title,body,href)
    values(story_author,new.user_id,'story_like','Someone appreciated your story','Your story received a new like.','/stories');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_story_activity() from public, anon, authenticated;
drop trigger if exists notify_story_like on public.story_likes;
create trigger notify_story_like after insert on public.story_likes
for each row execute function private.notify_story_activity();

create or replace function private.notify_story_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare story_author uuid;
begin
  select author_id into story_author from public.stories where id = new.story_id;
  if story_author is not null and story_author <> new.author_id then
    insert into public.member_notifications(user_id,actor_id,kind,title,body,href)
    values(story_author,new.author_id,'story_comment','New conversation on your story',left(new.body,180),'/stories');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_story_comment() from public, anon, authenticated;
drop trigger if exists notify_story_comment on public.comments;
create trigger notify_story_comment after insert on public.comments
for each row execute function private.notify_story_comment();

create or replace function private.notify_editorial_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.member_notifications(user_id,actor_id,kind,title,body,href)
    values(new.author_id,new.reviewed_by,'editorial_update','Your submission has an update',
      case new.status
        when 'in_review' then 'An editor has started reviewing your work.'
        when 'revision_requested' then 'The editorial team has requested a revision.'
        when 'accepted' then 'Your work has been accepted for publication.'
        when 'declined' then 'The editorial team has made a decision on your submission.'
        else 'Your submission status has changed.'
      end,'/dashboard');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_editorial_update() from public, anon, authenticated;
drop trigger if exists notify_editorial_update on public.editorial_submissions;
create trigger notify_editorial_update after update on public.editorial_submissions
for each row execute function private.notify_editorial_update();

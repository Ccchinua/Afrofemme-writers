-- Afrofemme Writers platform expansion.
-- Adds real community, editorial, events, audio, moderation and achievement data.
create schema if not exists private;

create or replace function private.has_role(target_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_roles r
    where r.user_id = (select auth.uid()) and r.role = target_role
  );
$$;
revoke all on function private.has_role(public.app_role) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;

create or replace function private.enforce_role_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_total integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'super_admin' then
      raise exception 'The Super Admin role cannot be removed through the application.';
    end if;
    if not private.has_role('super_admin') then
      raise exception 'Only the Super Admin can change administrator roles.';
    end if;
    return old;
  end if;

  if new.role = 'super_admin' then
    raise exception 'The initial Super Admin must be bootstrapped securely by the project owner.';
  end if;
  if not private.has_role('super_admin') then
    raise exception 'Only the Super Admin can grant administrator access.';
  end if;
  select count(*) into admin_total from public.app_roles where role = 'admin'
    and user_id <> new.user_id;
  if admin_total >= 4 then
    raise exception 'The platform allows a maximum of four administrators.';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_role_limits() from public, anon, authenticated;
drop trigger if exists enforce_role_limits on public.app_roles;
create trigger enforce_role_limits before insert or update or delete on public.app_roles
for each row execute function private.enforce_role_limits();

create table if not exists public.circle_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 180),
  body text not null check (length(trim(body)) between 1 and 8000),
  topic text not null default 'General',
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.writing_prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  category text not null default 'Open prompt',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.prompt_entries (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.writing_prompts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null check (length(trim(body)) between 1 and 12000),
  visibility text not null default 'community' check (visibility in ('private','community')),
  created_at timestamptz not null default now(),
  unique(prompt_id, author_id)
);
create table if not exists public.literary_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  venue text,
  county text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  registration_url text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.writer_spotlights (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references auth.users(id) on delete cascade,
  headline text not null,
  story text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.audio_readings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  audio_url text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('story','comment','circle_post','profile','audio')),
  target_id uuid not null,
  reason text not null check (length(trim(reason)) between 3 and 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  moderator_id uuid references auth.users(id),
  moderator_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create table if not exists public.achievement_definitions (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null default 'star'
);
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key(user_id, achievement_id)
);

insert into public.achievement_definitions(id,title,description,icon) values
 ('first_story','First page','Published your first story','book-open'),
 ('five_stories','Finding your voice','Published five stories','feather'),
 ('first_comment','In conversation','Joined a story conversation','message-circle'),
 ('community_voice','Community voice','Shared your first Circle post','users')
on conflict (id) do nothing;

alter table public.circle_posts enable row level security;
alter table public.writing_prompts enable row level security;
alter table public.prompt_entries enable row level security;
alter table public.literary_events enable row level security;
alter table public.writer_spotlights enable row level security;
alter table public.audio_readings enable row level security;
alter table public.content_reports enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;

create policy "Published circle posts are readable" on public.circle_posts for select to authenticated
using (is_hidden = false or author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Members create own circle posts" on public.circle_posts for insert to authenticated
with check (author_id = (select auth.uid()));
create policy "Authors or moderators update circle posts" on public.circle_posts for update to authenticated
using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'))
with check (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Authors or moderators delete circle posts" on public.circle_posts for delete to authenticated
using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));

create policy "Active prompts are readable" on public.writing_prompts for select to authenticated
using (is_active or private.has_role('admin') or private.has_role('super_admin'));
create policy "Moderators manage prompts" on public.writing_prompts for all to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));

create policy "Community entries or own private entries readable" on public.prompt_entries for select to authenticated
using (visibility = 'community' or author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Members submit own prompt entries" on public.prompt_entries for insert to authenticated
with check (author_id = (select auth.uid()));
create policy "Authors update own prompt entries" on public.prompt_entries for update to authenticated
using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "Authors delete own prompt entries" on public.prompt_entries for delete to authenticated
using (author_id = (select auth.uid()));

create policy "Published events are readable" on public.literary_events for select to authenticated
using (is_published or private.has_role('admin') or private.has_role('super_admin'));
create policy "Moderators manage events" on public.literary_events for all to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));

create policy "Published spotlights are readable" on public.writer_spotlights for select to authenticated
using (is_published or private.has_role('admin') or private.has_role('super_admin'));
create policy "Moderators manage spotlights" on public.writer_spotlights for all to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));

create policy "Published audio is readable" on public.audio_readings for select to authenticated
using (is_published or author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Authors submit own audio" on public.audio_readings for insert to authenticated
with check (author_id = (select auth.uid()));
create policy "Authors or moderators update audio" on public.audio_readings for update to authenticated
using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'))
with check (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Authors or moderators delete audio" on public.audio_readings for delete to authenticated
using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));

create policy "Members submit reports" on public.content_reports for insert to authenticated
with check (reporter_id = (select auth.uid()));
create policy "Reporters and moderators read reports" on public.content_reports for select to authenticated
using (reporter_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin'));
create policy "Moderators review reports" on public.content_reports for update to authenticated
using (private.has_role('admin') or private.has_role('super_admin'))
with check (private.has_role('admin') or private.has_role('super_admin'));

create policy "Achievement definitions are readable" on public.achievement_definitions for select to authenticated using (true);
create policy "Users read own achievements" on public.user_achievements for select to authenticated
using (user_id = (select auth.uid()));
create policy "Moderators award achievements" on public.user_achievements for insert to authenticated
with check (private.has_role('admin') or private.has_role('super_admin'));

create index if not exists circle_posts_created_idx on public.circle_posts(created_at desc) where is_hidden = false;
create index if not exists prompt_entries_prompt_idx on public.prompt_entries(prompt_id,created_at desc);
create index if not exists literary_events_date_idx on public.literary_events(starts_at) where is_published = true;
create index if not exists writer_spotlights_date_idx on public.writer_spotlights(published_at desc) where is_published = true;
create index if not exists audio_readings_author_idx on public.audio_readings(author_id,created_at desc);
create index if not exists content_reports_status_idx on public.content_reports(status,created_at desc);
create index if not exists admin_requests_requester_idx on public.admin_requests(requester_id);
create index if not exists admin_requests_reviewer_idx on public.admin_requests(reviewed_by);
create index if not exists app_roles_granted_by_idx on public.app_roles(granted_by);
create index if not exists bookmarks_story_idx on public.bookmarks(story_id);
create index if not exists comments_author_idx on public.comments(author_id);
create index if not exists comments_parent_idx on public.comments(parent_id);
create index if not exists comments_story_idx on public.comments(story_id);
create index if not exists follows_followed_idx on public.follows(followed_id);
create index if not exists story_likes_story_idx on public.story_likes(story_id);

-- Existing role rows remain unchanged. The project owner must bootstrap the one Super Admin explicitly.

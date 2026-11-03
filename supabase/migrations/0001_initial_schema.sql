-- Afrofemme Writers initial database schema.
-- Apply in the Supabase SQL Editor after creating a Supabase project.
-- Bootstrap the owner role manually only after the owner's auth account exists.

create extension if not exists pgcrypto;
create type public.story_status as enum ('draft','scheduled','published','archived');
create type public.app_role as enum ('super_admin','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  country text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table public.app_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id),
  primary key(user_id,role)
);
create unique index one_super_admin_only on public.app_roles(role) where role='super_admin';

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  body jsonb not null default '{}'::jsonb,
  cover_image_url text,
  category text not null default 'Essay',
  country text,
  status public.story_status not null default 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint title_not_blank check(length(trim(title))>0)
);
create index stories_published_idx on public.stories(published_at desc) where status='published';
create index stories_author_idx on public.stories(author_id,updated_at desc);

create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id,followed_id),
  constraint cannot_follow_self check(follower_id<>followed_id)
);
create table public.story_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,story_id)
);
create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.stories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,story_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint comment_not_blank check(length(trim(body))>0 and length(body)<=4000)
);
create table public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger stories_updated_at before update on public.stories
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 insert into public.profiles(id,display_name)
 values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''));
 return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_roles enable row level security;
alter table public.stories enable row level security;
alter table public.follows enable row level security;
alter table public.story_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.admin_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "Profiles are readable" on public.profiles for select using(true);
create policy "Users update own profile" on public.profiles for update
using(auth.uid()=id) with check(auth.uid()=id);
create policy "Users read own roles" on public.app_roles for select
using(auth.uid()=user_id);

create policy "Published stories or own stories are readable" on public.stories for select
using(status='published' or auth.uid()=author_id);
create policy "Authors create own stories" on public.stories for insert
with check(auth.uid()=author_id and status in ('draft','scheduled','published'));
create policy "Authors update own stories" on public.stories for update
using(auth.uid()=author_id) with check(auth.uid()=author_id);
create policy "Authors delete own stories" on public.stories for delete
using(auth.uid()=author_id);

create policy "Follows are readable" on public.follows for select using(true);
create policy "Follow as self" on public.follows for insert with check(auth.uid()=follower_id);
create policy "Unfollow as self" on public.follows for delete using(auth.uid()=follower_id);
create policy "Likes are readable" on public.story_likes for select using(true);
create policy "Like as self" on public.story_likes for insert with check(auth.uid()=user_id);
create policy "Remove own like" on public.story_likes for delete using(auth.uid()=user_id);
create policy "Read own bookmarks" on public.bookmarks for select using(auth.uid()=user_id);
create policy "Create own bookmarks" on public.bookmarks for insert with check(auth.uid()=user_id);
create policy "Delete own bookmarks" on public.bookmarks for delete using(auth.uid()=user_id);

create policy "Visible comments on published stories" on public.comments for select
using((is_hidden=false and exists(select 1 from public.stories s where s.id=story_id and s.status='published')) or auth.uid()=author_id);
create policy "Comment as self on published story" on public.comments for insert
with check(auth.uid()=author_id and exists(select 1 from public.stories s where s.id=story_id and s.status='published'));
create policy "Delete own comments" on public.comments for delete using(auth.uid()=author_id);

create policy "Read own admin requests" on public.admin_requests for select using(auth.uid()=requester_id);
create policy "Submit own pending admin request" on public.admin_requests for insert
with check(auth.uid()=requester_id and status='pending' and reviewed_by is null and reviewed_at is null);

-- No client-side write policy is intentionally provided for app_roles or newsletter_subscribers.
-- Admin approval, admin-count limits, and newsletter consent/unsubscribe must use trusted server endpoints.
-- Bootstrap the owner once, from the Supabase SQL editor, replacing the UUID:
-- insert into public.app_roles(user_id,role) values ('OWNER-AUTH-USER-UUID','super_admin');
-- Never put a service-role key in browser code.

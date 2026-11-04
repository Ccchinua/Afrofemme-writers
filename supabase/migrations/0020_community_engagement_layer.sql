-- Add conversation, reaction and challenge participation primitives.
create table if not exists public.circle_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.circle_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 3000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists circle_replies_post_created_idx on public.circle_replies(post_id, created_at);
create index if not exists circle_replies_author_idx on public.circle_replies(author_id);

create table if not exists public.circle_reactions (
  post_id uuid not null references public.circle_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'heart' check (reaction in ('heart','celebrate','insightful')),
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);

create table if not exists public.community_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 160),
  slug text not null unique,
  description text not null default '',
  prompt text not null check (length(btrim(prompt)) between 10 and 3000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists community_challenges_status_dates_idx on public.community_challenges(status, starts_at, ends_at);

create table if not exists public.challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.community_challenges(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 3 and 180),
  body text not null check (length(btrim(body)) between 1 and 12000),
  visibility text not null default 'community' check (visibility in ('private','community')),
  created_at timestamptz not null default now(),
  unique (challenge_id,author_id)
);
create index if not exists challenge_entries_challenge_created_idx on public.challenge_entries(challenge_id, created_at desc);
create index if not exists challenge_entries_author_idx on public.challenge_entries(author_id);

alter table public.circle_replies enable row level security;
alter table public.circle_reactions enable row level security;
alter table public.community_challenges enable row level security;
alter table public.challenge_entries enable row level security;

grant select, insert, update, delete on public.circle_replies to authenticated;
grant select, insert, delete on public.circle_reactions to authenticated;
grant select on public.community_challenges to anon, authenticated;
grant insert, update, delete on public.community_challenges to authenticated;
grant select, insert, update, delete on public.challenge_entries to authenticated;
grant select on public.challenge_entries to anon;

create policy "Visible circle replies are readable" on public.circle_replies
for select to authenticated
using (
  (is_hidden = false and exists (select 1 from public.circle_posts p where p.id = post_id and p.is_hidden = false))
  or author_id = (select auth.uid())
  or (select private.has_role('admin'::app_role))
  or (select private.has_role('super_admin'::app_role))
);
create policy "Members reply as themselves" on public.circle_replies
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.circle_posts p where p.id = post_id and p.is_hidden = false)
);
create policy "Authors update own circle replies" on public.circle_replies
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
create policy "Authors or moderators delete circle replies" on public.circle_replies
for delete to authenticated
using (author_id = (select auth.uid()) or (select private.has_role('admin'::app_role)) or (select private.has_role('super_admin'::app_role)));

create policy "Members read circle reactions" on public.circle_reactions
for select to authenticated using (true);
create policy "Members react as themselves" on public.circle_reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.circle_posts p where p.id = post_id and p.is_hidden = false)
);
create policy "Members remove own reactions" on public.circle_reactions
for delete to authenticated using (user_id = (select auth.uid()));

create policy "Published challenges are readable" on public.community_challenges
for select to anon, authenticated using (status in ('open','closed'));
create policy "Moderators manage challenges" on public.community_challenges
for all to authenticated
using ((select private.has_role('admin'::app_role)) or (select private.has_role('super_admin'::app_role)))
with check ((select private.has_role('admin'::app_role)) or (select private.has_role('super_admin'::app_role)));

create policy "Community challenge entries are readable" on public.challenge_entries
for select to anon, authenticated
using (
  visibility = 'community'
  or author_id = (select auth.uid())
  or (select private.has_role('admin'::app_role))
  or (select private.has_role('super_admin'::app_role))
);
create policy "Members enter open challenges as themselves" on public.challenge_entries
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.community_challenges c
    where c.id = challenge_id and c.status = 'open'
      and now() >= c.starts_at and now() < c.ends_at
  )
);
create policy "Authors update own challenge entries" on public.challenge_entries
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
create policy "Authors delete own challenge entries" on public.challenge_entries
for delete to authenticated using (author_id = (select auth.uid()));

insert into public.community_challenges (title,slug,description,prompt,starts_at,ends_at,status)
values (
  'The Words We Carry',
  'the-words-we-carry',
  'A seven-day writing invitation about memory, belonging and the stories that travel with us.',
  'Write about a phrase, memory, object or small moment you carry from the women who shaped you. It can be a poem, a letter, a scene or a short reflection. Begin wherever the truth feels easiest to tell.',
  now() - interval '1 minute',
  now() + interval '7 days',
  'open'
)
on conflict (slug) do nothing;

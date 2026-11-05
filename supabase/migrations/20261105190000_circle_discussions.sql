-- Member-only discussions inside each creative circle.
create table if not exists public.creative_circle_posts(
 id uuid primary key default gen_random_uuid(),
 circle_id uuid not null references public.creative_circles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 2 and 1600),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists creative_circle_posts_recent_idx on public.creative_circle_posts(circle_id,created_at desc);
alter table public.creative_circle_posts enable row level security;
grant select,insert,update,delete on public.creative_circle_posts to authenticated;
create policy "Circle members can read discussions" on public.creative_circle_posts for select to authenticated
using(exists(select 1 from public.creative_circle_members m where m.circle_id=creative_circle_posts.circle_id and m.user_id=(select auth.uid())));
create policy "Circle members can start discussions" on public.creative_circle_posts for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.creative_circle_members m where m.circle_id=creative_circle_posts.circle_id and m.user_id=(select auth.uid())));
create policy "Authors edit their circle posts" on public.creative_circle_posts for update to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.creative_circle_members m where m.circle_id=creative_circle_posts.circle_id and m.user_id=(select auth.uid())))
with check(user_id=(select auth.uid()) and exists(select 1 from public.creative_circle_members m where m.circle_id=creative_circle_posts.circle_id and m.user_id=(select auth.uid())));
create policy "Authors remove their circle posts" on public.creative_circle_posts for delete to authenticated
using(user_id=(select auth.uid()));

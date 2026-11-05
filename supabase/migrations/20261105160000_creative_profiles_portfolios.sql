-- Expand member identities into creative portfolios while preserving existing writer profiles.
alter table public.profiles
  add column if not exists creative_tagline text not null default '',
  add column if not exists creative_disciplines text[] not null default '{}',
  add column if not exists creative_skills text[] not null default '{}',
  add column if not exists collaboration_interests text[] not null default '{}',
  add column if not exists open_to_collaborations boolean not null default false;

alter table public.profiles
  add constraint profiles_creative_tagline_length check (char_length(creative_tagline) <= 120),
  add constraint profiles_creative_disciplines_count check (cardinality(creative_disciplines) <= 8),
  add constraint profiles_creative_skills_count check (cardinality(creative_skills) <= 20),
  add constraint profiles_collaboration_interests_count check (cardinality(collaboration_interests) <= 12);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 600),
  discipline text not null default 'Other' check (char_length(discipline) between 2 and 40),
  image_url text,
  project_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_item_has_media check (image_url is not null or project_url is not null)
);
create index if not exists portfolio_items_user_order_idx on public.portfolio_items(user_id, is_featured desc, sort_order, created_at desc);
create index if not exists profiles_creative_disciplines_gin_idx on public.profiles using gin (creative_disciplines);
alter table public.portfolio_items enable row level security;
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;
create policy "Portfolio work is publicly viewable" on public.portfolio_items for select to anon, authenticated using (true);
create policy "Members add work to their own portfolio" on public.portfolio_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Members update their own portfolio work" on public.portfolio_items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Members remove their own portfolio work" on public.portfolio_items for delete to authenticated using (user_id = (select auth.uid()));
create trigger portfolio_items_updated_at before update on public.portfolio_items for each row execute function public.set_updated_at();

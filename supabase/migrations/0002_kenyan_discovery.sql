-- Kenyan literary discovery fields and safer story metadata.
alter table public.profiles add column if not exists county text;
alter table public.profiles add column if not exists preferred_language text not null default 'English';
alter table public.stories add column if not exists county text;
alter table public.stories add column if not exists language text not null default 'English';
create index if not exists profiles_county_idx on public.profiles(county);
create index if not exists stories_county_published_idx on public.stories(county,published_at desc) where status='published';
create index if not exists stories_category_published_idx on public.stories(category,published_at desc) where status='published';

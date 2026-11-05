-- Creative Marketplace: creator-owned services, commissions, digital work and opportunities.
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 4 and 100),
  description text not null check (char_length(btrim(description)) between 20 and 1600),
  listing_type text not null check (listing_type in ('service','digital_product','commission','opportunity')),
  discipline text not null default 'Other' check (char_length(discipline) between 2 and 40),
  price_amount numeric(12,2) check (price_amount is null or price_amount >= 0),
  currency text not null default 'KES' check (currency in ('KES','USD','NGN','GHS','ZAR','UGX','TZS')),
  location text not null default '' check (char_length(location) <= 80),
  delivery_note text not null default '' check (char_length(delivery_note) <= 180),
  image_url text,
  external_url text,
  status text not null default 'published' check (status in ('published','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_listings_public_idx on public.marketplace_listings(listing_type, created_at desc) where status='published';
create index if not exists marketplace_listings_owner_idx on public.marketplace_listings(owner_id, updated_at desc);
create index if not exists marketplace_listings_discipline_idx on public.marketplace_listings(discipline) where status='published';
alter table public.marketplace_listings enable row level security;
grant select on public.marketplace_listings to anon, authenticated;
grant insert, update, delete on public.marketplace_listings to authenticated;
create policy "Published marketplace listings are public" on public.marketplace_listings
 for select to anon, authenticated using (status='published');
create policy "Creators can read all their own listings" on public.marketplace_listings
 for select to authenticated using (owner_id=(select auth.uid()));
create policy "Creators publish their own listings" on public.marketplace_listings
 for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "Creators update their own listings" on public.marketplace_listings
 for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "Creators remove their own listings" on public.marketplace_listings
 for delete to authenticated using (owner_id=(select auth.uid()));
create trigger marketplace_listings_updated_at before update on public.marketplace_listings
 for each row execute function public.set_updated_at();

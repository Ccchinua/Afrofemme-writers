-- Afrofemme daily participation, creative identity, circles and collaboration foundation.
create table if not exists public.daily_drops (
 id uuid primary key default gen_random_uuid(),
 drop_date date not null unique,
 title text not null check(char_length(btrim(title)) between 3 and 120),
 prompt text not null check(char_length(btrim(prompt)) between 10 and 1200),
 discipline text not null default 'All creatives',
 created_at timestamptz not null default now()
);
create table if not exists public.daily_drop_entries (
 id uuid primary key default gen_random_uuid(),
 drop_id uuid not null references public.daily_drops(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 response text not null check(char_length(btrim(response)) between 10 and 1800),
 visibility text not null default 'community' check(visibility in ('community','private')),
 created_at timestamptz not null default now(),
 unique(drop_id,user_id)
);
create index if not exists daily_drop_entries_recent_idx on public.daily_drop_entries(created_at desc);
alter table public.daily_drops enable row level security;
alter table public.daily_drop_entries enable row level security;
grant select on public.daily_drops to anon,authenticated;
grant select,insert,update,delete on public.daily_drop_entries to authenticated;
create policy "Daily drops are public" on public.daily_drops for select to anon,authenticated using(drop_date <= current_date);
create policy "Community daily drop entries are visible" on public.daily_drop_entries for select to authenticated using(visibility='community' or user_id=(select auth.uid()));
create policy "Members submit their own daily drop" on public.daily_drop_entries for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Members edit their own daily drop" on public.daily_drop_entries for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Members remove their own daily drop" on public.daily_drop_entries for delete to authenticated using(user_id=(select auth.uid()));

create table if not exists public.creative_streaks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 current_days integer not null default 0 check(current_days >= 0),
 longest_days integer not null default 0 check(longest_days >= 0),
 last_activity_date date,
 updated_at timestamptz not null default now()
);
alter table public.creative_streaks enable row level security;
grant select on public.creative_streaks to authenticated;
create policy "Members view their own creative streak" on public.creative_streaks for select to authenticated using(user_id=(select auth.uid()));

create table if not exists public.creative_passport_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null check(event_type in ('publication','collaboration','competition','showcase','milestone','marketplace')),
 title text not null check(char_length(btrim(title)) between 3 and 120),
 description text not null default '' check(char_length(description)<=400),
 href text,
 created_at timestamptz not null default now()
);
create index if not exists creative_passport_user_recent_idx on public.creative_passport_events(user_id,created_at desc);
alter table public.creative_passport_events enable row level security;
grant select,insert on public.creative_passport_events to authenticated;
create policy "Passport events are publicly readable" on public.creative_passport_events for select to authenticated using(true);
create policy "Members add events to their own passport" on public.creative_passport_events for insert to authenticated with check(user_id=(select auth.uid()));

create table if not exists public.creative_collaborations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 5 and 120),
 description text not null check(char_length(btrim(description)) between 20 and 1600),
 discipline text not null default 'Other' check(char_length(discipline)<=50),
 looking_for text not null default '' check(char_length(looking_for)<=240),
 location text not null default 'Remote' check(char_length(location)<=100),
 status text not null default 'open' check(status in ('open','filled','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists creative_collaborations_open_idx on public.creative_collaborations(created_at desc) where status='open';
alter table public.creative_collaborations enable row level security;
grant select,insert,update,delete on public.creative_collaborations to authenticated;
create policy "Open collaborations are discoverable" on public.creative_collaborations for select to authenticated using(status='open' or owner_id=(select auth.uid()));
create policy "Members post collaborations as themselves" on public.creative_collaborations for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Owners update collaborations" on public.creative_collaborations for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Owners delete collaborations" on public.creative_collaborations for delete to authenticated using(owner_id=(select auth.uid()));

create table if not exists public.creative_circles (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text not null,
 discipline text not null default 'Community',
 created_at timestamptz not null default now()
);
create table if not exists public.creative_circle_members (
 circle_id uuid not null references public.creative_circles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(circle_id,user_id)
);
alter table public.creative_circles enable row level security;
alter table public.creative_circle_members enable row level security;
grant select on public.creative_circles to anon,authenticated;
grant select,insert,delete on public.creative_circle_members to authenticated;
create policy "Creative circles are discoverable" on public.creative_circles for select to anon,authenticated using(true);
create policy "Circle memberships are visible to members" on public.creative_circle_members for select to authenticated using(true);
create policy "Members join circles as themselves" on public.creative_circle_members for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Members leave circles themselves" on public.creative_circle_members for delete to authenticated using(user_id=(select auth.uid()));

insert into public.creative_circles(slug,name,description,discipline) values
 ('poetry-room','The Poetry Room','A home for poems, spoken word, line edits and the small details that make language sing.','Poetry'),
 ('african-women-in-film','African Women in Film','For filmmakers, actors, editors, producers and storytellers shaping African cinema.','Film & video'),
 ('visual-storytellers','Visual Storytellers','Photography, illustration, design and visual experiments from across the continent.','Visual arts'),
 ('creative-entrepreneurs','Creative Entrepreneurs','Share practical lessons, find collaborators and grow sustainable creative work.','Business'),
 ('fiction-club','The Fiction Club','Build worlds, exchange feedback and write fiction together.','Fiction'),
 ('music-makers','Music Makers','A circle for composers, vocalists, producers and independent music creatives.','Music')
on conflict(slug) do nothing;

insert into public.daily_drops(drop_date,title,prompt,discipline)
values(current_date,'The place that made you','Create something about a place that shaped who you are. It can be a poem, photograph, short reflection, sketch or voice performance. Show us one detail that still lives with you.','All creatives')
on conflict(drop_date) do nothing;

create or replace function private.record_creative_activity()
returns trigger language plpgsql security definer set search_path=''
as $$
declare uid uuid; today date; prior date; current_count integer; longest_count integer;
begin
 if tg_table_name='stories' then
   if new.status<>'published' or (tg_op='UPDATE' and old.status='published') then return new; end if;
   uid:=new.author_id;
 elsif tg_table_name='circle_posts' then uid:=new.author_id;
 elsif tg_table_name='daily_drop_entries' then uid:=new.user_id;
 else return new;
 end if;
 today:=(now() at time zone 'Africa/Nairobi')::date;
 insert into public.creative_streaks(user_id,current_days,longest_days,last_activity_date)
 values(uid,1,1,today) on conflict(user_id) do nothing;
 select last_activity_date,current_days,longest_days into prior,current_count,longest_count from public.creative_streaks where user_id=uid for update;
 if prior is null or prior<today-1 then current_count:=1;
 elsif prior=today-1 then current_count:=current_count+1;
 end if;
 longest_count:=greatest(longest_count,current_count);
 update public.creative_streaks set current_days=current_count,longest_days=longest_count,last_activity_date=greatest(coalesce(prior,today),today),updated_at=now() where user_id=uid;
 return new;
end;
$$;
revoke all on function private.record_creative_activity() from public,anon,authenticated;
drop trigger if exists creative_streak_story on public.stories;
create trigger creative_streak_story after insert or update of status on public.stories for each row execute function private.record_creative_activity();
drop trigger if exists creative_streak_circle_post on public.circle_posts;
create trigger creative_streak_circle_post after insert on public.circle_posts for each row execute function private.record_creative_activity();
drop trigger if exists creative_streak_daily_drop on public.daily_drop_entries;
create trigger creative_streak_daily_drop after insert on public.daily_drop_entries for each row execute function private.record_creative_activity();

insert into public.daily_drops(drop_date,title,prompt,discipline)
select current_date + n,
 (array['The place that made you','A voice you remember','Small acts of courage','The colour of belonging','A letter to tomorrow','The story in an object','What home sounds like'])[1+(n%7)],
 (array[
 'Create something about a place that shaped who you are. Show us one detail that still lives with you.',
 'Write, photograph or record a voice that has stayed with you. What did it teach you?',
 'Make a small work about an ordinary act of courage that deserves to be noticed.',
 'Explore the colours, textures or symbols that make you feel that you belong.',
 'Create a letter, poem, sketch or voice note addressed to your future self.',
 'Choose an everyday object and reveal the memory or story hidden inside it.',
 'Describe home through sound, rhythm, silence or a familiar voice.'
 ])[1+(n%7)],
 'All creatives'
from generate_series(0,30) as n
on conflict(drop_date) do nothing;

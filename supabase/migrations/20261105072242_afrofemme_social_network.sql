-- Afrofemme Social: public member posts, media, reposts, private one-to-one inbox and notifications.
alter table public.circle_posts
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists hashtags text[] not null default '{}';

alter table public.circle_posts
  drop constraint if exists circle_posts_media_type_check,
  add constraint circle_posts_media_type_check
    check (media_type is null or media_type in ('image','video')),
  drop constraint if exists circle_posts_media_pair_check,
  add constraint circle_posts_media_pair_check
    check ((media_url is null and media_type is null) or (media_url is not null and media_type is not null));

create index if not exists circle_posts_hashtags_gin_idx on public.circle_posts using gin (hashtags);
create index if not exists circle_posts_created_social_idx on public.circle_posts(created_at desc) where is_hidden = false;

create table if not exists public.circle_reposts (
  post_id uuid not null references public.circle_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
alter table public.circle_reposts enable row level security;
grant select, insert, delete on public.circle_reposts to authenticated;
create policy "Members read reposts" on public.circle_reposts for select to authenticated using (true);
create policy "Members repost as themselves" on public.circle_reposts for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.circle_posts p where p.id = post_id and p.is_hidden = false)
);
create policy "Members remove own reposts" on public.circle_reposts for delete to authenticated using (user_id = (select auth.uid()));

create table if not exists public.member_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  constraint member_blocks_no_self check (blocker_id <> blocked_id)
);
alter table public.member_blocks enable row level security;
grant select, insert, delete on public.member_blocks to authenticated;
create policy "Members view their own blocks" on public.member_blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "Members block as themselves" on public.member_blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "Members unblock as themselves" on public.member_blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references auth.users(id) on delete cascade,
  participant_two uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_two_distinct_members check (participant_one < participant_two),
  constraint conversations_creator_is_member check (created_by = participant_one or created_by = participant_two),
  unique (participant_one,participant_two)
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  last_read_at timestamptz,
  primary key (conversation_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists conversations_participant_one_idx on public.conversations(participant_one,created_at desc);
create index if not exists conversations_participant_two_idx on public.conversations(participant_two,created_at desc);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id,conversation_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function private.is_conversation_member(target_conversation uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.conversation_members cm where cm.conversation_id = target_conversation and cm.user_id = (select auth.uid()));
$$;
revoke all on function private.is_conversation_member(uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid) to authenticated;

create or replace function private.conversation_is_accepted(target_conversation uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select count(*) = 2 and bool_and(cm.accepted_at is not null)
  from public.conversation_members cm where cm.conversation_id = target_conversation;
$$;
revoke all on function private.conversation_is_accepted(uuid) from public, anon;
grant execute on function private.conversation_is_accepted(uuid) to authenticated;

create or replace function private.is_blocked_between(user_a uuid, user_b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.member_blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a));
$$;
revoke all on function private.is_blocked_between(uuid,uuid) from public, anon;
grant execute on function private.is_blocked_between(uuid,uuid) to authenticated;

create or replace function private.create_conversation_members()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.conversation_members(conversation_id,user_id,accepted_at)
  values
    (new.id,new.participant_one,case when new.created_by = new.participant_one then now() else null end),
    (new.id,new.participant_two,case when new.created_by = new.participant_two then now() else null end);
  return new;
end;
$$;
revoke all on function private.create_conversation_members() from public, anon, authenticated;
drop trigger if exists create_conversation_members on public.conversations;
create trigger create_conversation_members after insert on public.conversations for each row execute function private.create_conversation_members();

grant select, insert, delete on public.conversations to authenticated;
grant select, update on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;

create policy "Participants read their conversations" on public.conversations for select to authenticated
using (private.is_conversation_member(id) and not private.is_blocked_between(participant_one,participant_two));
create policy "Members start conversations" on public.conversations for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (participant_one = (select auth.uid()) or participant_two = (select auth.uid()))
  and exists (select 1 from public.profiles p where p.id = case when participant_one = (select auth.uid()) then participant_two else participant_one end)
  and not private.is_blocked_between(participant_one,participant_two)
);
create policy "Creators remove empty conversations" on public.conversations for delete to authenticated
using (created_by = (select auth.uid()) and not exists (select 1 from public.messages m where m.conversation_id = id));

create policy "Members read their own conversation membership" on public.conversation_members for select to authenticated
using (user_id = (select auth.uid()));
create policy "Members update their own acceptance and read state" on public.conversation_members for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Participants read allowed messages" on public.messages for select to authenticated
using (
  private.is_conversation_member(conversation_id)
  and not exists (select 1 from public.conversations c where c.id = conversation_id and private.is_blocked_between(c.participant_one,c.participant_two))
  and (sender_id = (select auth.uid()) or private.conversation_is_accepted(conversation_id))
);
create policy "Participants send first request or accepted messages" on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and private.is_conversation_member(conversation_id)
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and not private.is_blocked_between(c.participant_one,c.participant_two)
      and (private.conversation_is_accepted(conversation_id)
        or (c.created_by = (select auth.uid()) and not exists (select 1 from public.messages m where m.conversation_id = c.id)))
  )
);

alter table public.member_notifications drop constraint if exists member_notifications_kind_check;
alter table public.member_notifications add constraint member_notifications_kind_check
check (kind in ('new_follower','story_like','story_comment','editorial_update','event_reminder','community_reply','social_like','social_comment','social_repost','direct_message'));

create or replace function private.notify_social_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare recipient_id uuid; actor_id uuid; notification_kind text; notification_title text; notification_body text; notification_href text;
begin
  if tg_table_name = 'circle_reactions' then
    actor_id := new.user_id; notification_kind := 'social_like'; notification_title := 'Someone appreciated your post'; notification_body := 'Your community post received a new reaction.';
    select p.author_id into recipient_id from public.circle_posts p where p.id = new.post_id; notification_href := '/community';
  elsif tg_table_name = 'circle_replies' then
    actor_id := new.author_id; notification_kind := 'social_comment'; notification_title := 'Someone replied to your post'; notification_body := left(new.body,180);
    select p.author_id into recipient_id from public.circle_posts p where p.id = new.post_id; notification_href := '/community';
  elsif tg_table_name = 'circle_reposts' then
    actor_id := new.user_id; notification_kind := 'social_repost'; notification_title := 'Your post was shared'; notification_body := 'A member shared your community post.';
    select p.author_id into recipient_id from public.circle_posts p where p.id = new.post_id; notification_href := '/community';
  elsif tg_table_name = 'messages' then
    actor_id := new.sender_id; notification_kind := 'direct_message'; notification_title := 'You have a new message'; notification_body := 'Open your Afrofemme Inbox to read it.';
    select case when c.participant_one = new.sender_id then c.participant_two else c.participant_one end into recipient_id
    from public.conversations c where c.id = new.conversation_id;
    notification_href := '/inbox/' || new.conversation_id::text;
  end if;
  if recipient_id is not null and actor_id is not null and recipient_id <> actor_id then
    insert into public.member_notifications(user_id,actor_id,kind,title,body,href)
    values(recipient_id,actor_id,notification_kind,notification_title,notification_body,notification_href);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_social_activity() from public, anon, authenticated;
drop trigger if exists notify_circle_reaction on public.circle_reactions;
create trigger notify_circle_reaction after insert on public.circle_reactions for each row execute function private.notify_social_activity();
drop trigger if exists notify_circle_reply on public.circle_replies;
create trigger notify_circle_reply after insert on public.circle_replies for each row execute function private.notify_social_activity();
drop trigger if exists notify_circle_repost on public.circle_reposts;
create trigger notify_circle_repost after insert on public.circle_reposts for each row execute function private.notify_social_activity();
drop trigger if exists notify_direct_message on public.messages;
create trigger notify_direct_message after insert on public.messages for each row execute function private.notify_social_activity();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('social-media','social-media',true,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public social media is readable" on storage.objects for select to anon, authenticated using (bucket_id = 'social-media');
create policy "Members upload own social media" on storage.objects for insert to authenticated
with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members delete own social media" on storage.objects for delete to authenticated
using (bucket_id = 'social-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='member_notifications') then alter publication supabase_realtime add table public.member_notifications; end if;
  end if;
end $$;

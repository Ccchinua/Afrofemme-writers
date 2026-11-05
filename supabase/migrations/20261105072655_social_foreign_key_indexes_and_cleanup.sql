create index if not exists circle_reposts_user_id_idx on public.circle_reposts(user_id);
create index if not exists conversations_created_by_idx on public.conversations(created_by);
create index if not exists member_blocks_blocked_id_idx on public.member_blocks(blocked_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
drop index if exists public.circle_posts_created_social_idx;
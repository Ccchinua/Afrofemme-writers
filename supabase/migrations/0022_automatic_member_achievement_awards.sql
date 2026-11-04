insert into public.achievement_definitions (id,title,description,icon)
values
 ('prompt_explorer','Prompt Explorer','Answered your first creative prompt','feather'),
 ('challenge_participant','Brave Beginnings','Shared your first writing challenge entry','sparkles')
on conflict (id) do nothing;

create or replace function private.award_member_activity_achievement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_awards text[] := array[]::text[];
  v_achievement text;
  v_title text;
  v_description text;
  v_published_count integer;
begin
  v_user := new.author_id;

  if tg_table_name = 'stories' then
    if tg_op <> 'UPDATE' or new.status <> 'published' or old.status = 'published' then
      return new;
    end if;
    select count(*) into v_published_count
    from public.stories
    where author_id = v_user and status = 'published';
    if v_published_count = 1 then
      v_awards := array_append(v_awards, 'first_story');
    end if;
    if v_published_count = 5 then
      v_awards := array_append(v_awards, 'five_stories');
    end if;
  elsif tg_table_name = 'circle_posts' then
    v_awards := array['community_voice'];
  elsif tg_table_name = 'comments' then
    v_awards := array['first_comment'];
  elsif tg_table_name = 'prompt_entries' then
    v_awards := array['prompt_explorer'];
  elsif tg_table_name = 'challenge_entries' then
    v_awards := array['challenge_participant'];
  end if;

  foreach v_achievement in array v_awards loop
    insert into public.user_achievements(user_id, achievement_id)
    values (v_user, v_achievement)
    on conflict (user_id, achievement_id) do nothing;
    if found then
      select title, description into v_title, v_description
      from public.achievement_definitions where id = v_achievement;
      insert into public.member_notifications(user_id, kind, title, body, href)
      values (
        v_user,
        'achievement',
        'A new milestone: ' || coalesce(v_title, 'Achievement unlocked'),
        coalesce(v_description, 'You reached a new milestone in your writing journey.'),
        '/journey'
      );
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function private.award_member_activity_achievement() from public, anon, authenticated;

drop trigger if exists award_circle_voice on public.circle_posts;
create trigger award_circle_voice after insert on public.circle_posts
for each row execute function private.award_member_activity_achievement();

drop trigger if exists award_first_comment on public.comments;
create trigger award_first_comment after insert on public.comments
for each row execute function private.award_member_activity_achievement();

drop trigger if exists award_prompt_explorer on public.prompt_entries;
create trigger award_prompt_explorer after insert on public.prompt_entries
for each row execute function private.award_member_activity_achievement();

drop trigger if exists award_challenge_participant on public.challenge_entries;
create trigger award_challenge_participant after insert on public.challenge_entries
for each row execute function private.award_member_activity_achievement();

drop trigger if exists award_published_story_milestones on public.stories;
create trigger award_published_story_milestones after update of status on public.stories
for each row execute function private.award_member_activity_achievement();

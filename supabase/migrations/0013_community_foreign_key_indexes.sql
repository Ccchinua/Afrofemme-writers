-- Cover foreign-key lookups identified by the Supabase performance advisor.
create index if not exists circle_posts_author_fk_idx on public.circle_posts(author_id);
create index if not exists content_reports_moderator_fk_idx on public.content_reports(moderator_id);
create index if not exists content_reports_reporter_fk_idx on public.content_reports(reporter_id);
create index if not exists editorial_submissions_reviewer_fk_idx on public.editorial_submissions(reviewed_by);
create index if not exists event_registrations_user_fk_idx on public.event_registrations(user_id);
create index if not exists literary_events_creator_fk_idx on public.literary_events(created_by);
create index if not exists member_notifications_actor_fk_idx on public.member_notifications(actor_id);
create index if not exists prompt_entries_author_fk_idx on public.prompt_entries(author_id);
create index if not exists reading_history_story_fk_idx on public.reading_history(story_id);
create index if not exists user_achievements_definition_fk_idx on public.user_achievements(achievement_id);
create index if not exists writer_spotlights_creator_fk_idx on public.writer_spotlights(created_by);
create index if not exists writer_spotlights_writer_fk_idx on public.writer_spotlights(writer_id);
create index if not exists writing_prompts_creator_fk_idx on public.writing_prompts(created_by);
create index if not exists event_reminder_deliveries_user_id_idx on private.event_reminder_deliveries(user_id);
create index if not exists literary_events_host_id_idx on public.literary_events(host_id);
create index if not exists meetup_gallery_event_id_idx on public.meetup_gallery(event_id);
create index if not exists meetup_gallery_uploaded_by_idx on public.meetup_gallery(uploaded_by);
create index if not exists meetup_proposals_proposer_id_idx on public.meetup_proposals(proposer_id);
create index if not exists meetup_proposals_published_event_id_idx on public.meetup_proposals(published_event_id);
create index if not exists meetup_proposals_reviewed_by_idx on public.meetup_proposals(reviewed_by);

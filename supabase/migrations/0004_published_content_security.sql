-- Public access for published editorial content and server-controlled audio publication.
drop policy if exists "Published events are readable" on public.literary_events;
create policy "Published events are readable" on public.literary_events for select to anon, authenticated using (is_published = true);
drop policy if exists "Published spotlights are readable" on public.writer_spotlights;
create policy "Published spotlights are readable" on public.writer_spotlights for select to anon, authenticated using (is_published = true);
drop policy if exists "Active prompts are readable" on public.writing_prompts;
create policy "Active prompts are readable" on public.writing_prompts for select to anon, authenticated using (is_active = true);
drop policy if exists "Published audio is readable" on public.audio_readings;
create policy "Published audio is readable" on public.audio_readings for select to anon, authenticated using (is_published = true);
drop policy if exists "Authors submit own audio" on public.audio_readings;
create policy "Authors submit own audio" on public.audio_readings for insert to authenticated with check (author_id = (select auth.uid()) and is_published = false);
drop policy if exists "Authors or moderators update audio" on public.audio_readings;
create policy "Authors or moderators update audio" on public.audio_readings for update to authenticated using (author_id = (select auth.uid()) or private.has_role('admin') or private.has_role('super_admin')) with check ((author_id = (select auth.uid()) and is_published = false) or private.has_role('admin') or private.has_role('super_admin'));
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

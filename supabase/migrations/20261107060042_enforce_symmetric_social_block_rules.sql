-- Enforce block relationships at the database boundary as well as in UI filters.
-- A member cannot follow, reply to, react to, or repost a blocked member's content.
-- Blocked members' posts and interactions are hidden in both directions.

DROP POLICY IF EXISTS "Follow as self" ON public.follows;
CREATE POLICY "Follow as self"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND NOT private.is_blocked_between(follower_id, followed_id)
  );

DROP POLICY IF EXISTS "Published circle posts are readable" ON public.circle_posts;
CREATE POLICY "Published circle posts are readable"
  ON public.circle_posts
  FOR SELECT
  TO authenticated
  USING (
    (
      is_hidden = false
      AND NOT private.is_blocked_between((SELECT auth.uid()), author_id)
    )
    OR author_id = (SELECT auth.uid())
    OR private.has_role('admin'::app_role)
    OR private.has_role('super_admin'::app_role)
  );

DROP POLICY IF EXISTS "Visible circle replies are readable" ON public.circle_replies;
CREATE POLICY "Visible circle replies are readable"
  ON public.circle_replies
  FOR SELECT
  TO authenticated
  USING (
    (
      is_hidden = false
      AND NOT private.is_blocked_between((SELECT auth.uid()), author_id)
      AND EXISTS (
        SELECT 1
        FROM public.circle_posts p
        WHERE p.id = circle_replies.post_id
          AND p.is_hidden = false
      )
    )
    OR author_id = (SELECT auth.uid())
    OR private.has_role('admin'::app_role)
    OR private.has_role('super_admin'::app_role)
  );

DROP POLICY IF EXISTS "Members reply as themselves" ON public.circle_replies;
CREATE POLICY "Members reply as themselves"
  ON public.circle_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.circle_posts p
      WHERE p.id = circle_replies.post_id
        AND p.is_hidden = false
        AND NOT private.is_blocked_between((SELECT auth.uid()), p.author_id)
    )
  );

DROP POLICY IF EXISTS "Members read circle reactions" ON public.circle_reactions;
CREATE POLICY "Members read circle reactions"
  ON public.circle_reactions
  FOR SELECT
  TO authenticated
  USING (
    NOT private.is_blocked_between((SELECT auth.uid()), user_id)
    AND EXISTS (
      SELECT 1
      FROM public.circle_posts p
      WHERE p.id = circle_reactions.post_id
        AND p.is_hidden = false
    )
  );

DROP POLICY IF EXISTS "Members react as themselves" ON public.circle_reactions;
CREATE POLICY "Members react as themselves"
  ON public.circle_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.circle_posts p
      WHERE p.id = circle_reactions.post_id
        AND p.is_hidden = false
        AND NOT private.is_blocked_between((SELECT auth.uid()), p.author_id)
    )
  );

DROP POLICY IF EXISTS "Members read reposts" ON public.circle_reposts;
CREATE POLICY "Members read reposts"
  ON public.circle_reposts
  FOR SELECT
  TO authenticated
  USING (
    NOT private.is_blocked_between((SELECT auth.uid()), user_id)
    AND EXISTS (
      SELECT 1
      FROM public.circle_posts p
      WHERE p.id = circle_reposts.post_id
        AND p.is_hidden = false
    )
  );

DROP POLICY IF EXISTS "Members repost as themselves" ON public.circle_reposts;
CREATE POLICY "Members repost as themselves"
  ON public.circle_reposts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.circle_posts p
      WHERE p.id = circle_reposts.post_id
        AND p.is_hidden = false
        AND NOT private.is_blocked_between((SELECT auth.uid()), p.author_id)
    )
  );

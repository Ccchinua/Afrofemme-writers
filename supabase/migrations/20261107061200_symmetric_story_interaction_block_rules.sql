-- Apply mutual block rules to public story comments and appreciation reactions.
-- Anonymous readers still see public interactions; authenticated members do not
-- see or interact with members who have blocked them or whom they have blocked.

DROP POLICY IF EXISTS "Like as self" ON public.story_likes;
CREATE POLICY "Like as self"
  ON public.story_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.stories s
      WHERE s.id = story_likes.story_id
        AND s.status = 'published'::story_status
        AND NOT private.is_blocked_between(auth.uid(), s.author_id)
    )
  );

DROP POLICY IF EXISTS "Likes are readable" ON public.story_likes;
CREATE POLICY "Likes are readable"
  ON public.story_likes
  FOR SELECT
  TO public
  USING (
    CASE
      WHEN auth.uid() IS NULL THEN true
      ELSE NOT private.is_blocked_between(auth.uid(), user_id)
    END
  );

DROP POLICY IF EXISTS "Comment as self on published story" ON public.comments;
CREATE POLICY "Comment as self on published story"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM public.stories s
      WHERE s.id = comments.story_id
        AND s.status = 'published'::story_status
        AND NOT private.is_blocked_between(auth.uid(), s.author_id)
    )
  );

DROP POLICY IF EXISTS "Visible comments on published stories" ON public.comments;
CREATE POLICY "Visible comments on published stories"
  ON public.comments
  FOR SELECT
  TO public
  USING (
    (
      is_hidden = false
      AND EXISTS (
        SELECT 1
        FROM public.stories s
        WHERE s.id = comments.story_id
          AND s.status = 'published'::story_status
      )
      AND CASE
        WHEN auth.uid() IS NULL THEN true
        ELSE NOT private.is_blocked_between(auth.uid(), author_id)
      END
    )
    OR auth.uid() = author_id
  );

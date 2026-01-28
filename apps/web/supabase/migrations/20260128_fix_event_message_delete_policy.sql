-- ============================================================================
-- Fix Event Message Delete Policy
-- ============================================================================
-- The delete policy only allowed admins, but the UI allows message authors
-- to delete their own messages. This updates the policy to match.
-- ============================================================================

DROP POLICY IF EXISTS "em: delete admin" ON event_messages;

CREATE POLICY "em: delete own or admin" ON event_messages FOR DELETE
USING (
  -- Author can delete their own message
  (user_id = (select auth.uid()))
  OR
  -- Admin can delete any message in their band's events
  (EXISTS (
    SELECT 1 FROM events e
    JOIN band_members m ON m.band_id = e.band_id
    WHERE e.id = event_messages.event_id
      AND m.user_id = (select auth.uid())
      AND m.role = 'admin'
  ))
);

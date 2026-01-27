-- Fix: Allow band members to RSVP to events (insert/update their own row)
-- The previous migration dropped "Members can insert their own event row" and
-- "Members can update their own event status" but didn't recreate them.

-- Allow band members to insert their own event_members row (for RSVP)
CREATE POLICY "event_members: members can insert own row" ON event_members FOR INSERT
WITH CHECK (
  (user_id = (select auth.uid()))
  AND EXISTS (
    SELECT 1 FROM events e
    JOIN band_members bm ON bm.band_id = e.band_id
    WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid())
  )
);

-- Allow band members to update their own event_members row (for RSVP changes)
CREATE POLICY "event_members: members can update own row" ON event_members FOR UPDATE
USING (
  (user_id = (select auth.uid()))
  AND EXISTS (
    SELECT 1 FROM events e
    JOIN band_members bm ON bm.band_id = e.band_id
    WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid())
  )
)
WITH CHECK (
  (user_id = (select auth.uid()))
  AND EXISTS (
    SELECT 1 FROM events e
    JOIN band_members bm ON bm.band_id = e.band_id
    WHERE e.id = event_members.event_id AND bm.user_id = (select auth.uid())
  )
);

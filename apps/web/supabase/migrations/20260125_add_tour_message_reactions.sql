-- Tour message reactions table
-- Mirrors event_message_reactions structure for tour chat

CREATE TABLE IF NOT EXISTS public.tour_message_reactions (
  message_id UUID NOT NULL REFERENCES public.tour_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tour_message_reactions_message
  ON public.tour_message_reactions(message_id);

-- Enable RLS
ALTER TABLE public.tour_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Tour members can read reactions
CREATE POLICY "tmr: select tour member" ON public.tour_message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tour_messages tm
    JOIN tours t ON t.id = tm.tour_id
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE tm.id = tour_message_reactions.message_id
      AND bm.user_id = (SELECT auth.uid())
  )
);

-- INSERT: Tour members can add reactions
CREATE POLICY "tmr: insert tour member" ON public.tour_message_reactions
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM tour_messages tm
    JOIN tours t ON t.id = tm.tour_id
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE tm.id = tour_message_reactions.message_id
      AND bm.user_id = (SELECT auth.uid())
  )
);

-- DELETE: User can delete own reaction OR admin can delete any
CREATE POLICY "tmr: delete own or admin" ON public.tour_message_reactions
FOR DELETE USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM tour_messages tm
    JOIN tours t ON t.id = tm.tour_id
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE tm.id = tour_message_reactions.message_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
);

-- Update tour_messages policies to allow edit/delete by owner or admin

-- UPDATE: User is author OR admin
DROP POLICY IF EXISTS "tm: update own or admin" ON public.tour_messages;
CREATE POLICY "tm: update own or admin" ON public.tour_messages
FOR UPDATE USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM tours t
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE t.id = tour_messages.tour_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
) WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM tours t
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE t.id = tour_messages.tour_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
);

-- DELETE: Owner can delete own message, admin can delete any
DROP POLICY IF EXISTS "tm: delete own or admin" ON public.tour_messages;
CREATE POLICY "tm: delete own or admin" ON public.tour_messages
FOR DELETE USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM tours t
    JOIN band_members bm ON bm.band_id = t.band_id
    WHERE t.id = tour_messages.tour_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
);

-- Enable realtime for reactions
ALTER TABLE public.tour_message_reactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'tour_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_message_reactions;
  END IF;
END $$;

COMMENT ON TABLE public.tour_message_reactions IS 'Emoji reactions on tour chat messages';

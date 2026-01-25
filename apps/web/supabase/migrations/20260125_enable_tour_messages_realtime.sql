-- Enable realtime for tour_messages table
-- This allows the postgres_changes subscription to work for tour chat

-- Set REPLICA IDENTITY to FULL so DELETE events include the old row data
ALTER TABLE public.tour_messages REPLICA IDENTITY FULL;

-- Enable realtime publication for tour_messages
-- First check if the table is already in the publication
DO $$
BEGIN
  -- Add tour_messages to the supabase_realtime publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'tour_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_messages;
  END IF;
END $$;

COMMENT ON TABLE public.tour_messages IS 'Chat messages for tour communication - realtime enabled';

-- Add updated_at column to tour_messages for tracking edits
ALTER TABLE public.tour_messages
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create trigger to auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_tour_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tour_messages_updated_at ON public.tour_messages;
CREATE TRIGGER tour_messages_updated_at
  BEFORE UPDATE ON public.tour_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tour_message_timestamp();

COMMENT ON COLUMN public.tour_messages.updated_at IS 'Timestamp of last edit - used to show edited indicator';

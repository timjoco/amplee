-- Add setlist_id to tour_stops for assigning a setlist to a stop
ALTER TABLE public.tour_stops
ADD COLUMN IF NOT EXISTS setlist_id UUID REFERENCES public.setlist_templates(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tour_stops_setlist
  ON public.tour_stops(setlist_id);

COMMENT ON COLUMN public.tour_stops.setlist_id IS 'Optional setlist assigned to this tour stop';

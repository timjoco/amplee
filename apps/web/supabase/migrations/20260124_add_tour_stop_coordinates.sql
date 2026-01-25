-- Add coordinate and distance fields to tour_stops for route planning
-- These enable mileage tracking and map visualization

-- Add coordinate columns
ALTER TABLE public.tour_stops
ADD COLUMN IF NOT EXISTS venue_lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS venue_lng DECIMAL(10, 7);

-- Add cached distance/time to next stop (for performance)
ALTER TABLE public.tour_stops
ADD COLUMN IF NOT EXISTS distance_to_next_miles DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS drive_time_to_next_minutes INTEGER;

-- Add index for coordinate lookups
CREATE INDEX IF NOT EXISTS idx_tour_stops_coordinates
ON public.tour_stops (venue_lat, venue_lng)
WHERE venue_lat IS NOT NULL AND venue_lng IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.tour_stops.venue_lat IS 'Latitude coordinate from geocoding venue address';
COMMENT ON COLUMN public.tour_stops.venue_lng IS 'Longitude coordinate from geocoding venue address';
COMMENT ON COLUMN public.tour_stops.distance_to_next_miles IS 'Driving distance to the next chronological stop in miles';
COMMENT ON COLUMN public.tour_stops.drive_time_to_next_minutes IS 'Estimated driving time to the next stop in minutes';

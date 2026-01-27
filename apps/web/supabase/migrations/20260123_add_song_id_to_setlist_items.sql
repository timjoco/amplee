-- Add song_id CASCADE delete to setlist tables
-- When a song is deleted, all setlist items referencing it are automatically removed

-- ============================================================
-- PART 1: setlist_template_items
-- ============================================================

-- 1a. Add the song_id column if it doesn't exist
ALTER TABLE setlist_template_items
ADD COLUMN IF NOT EXISTS song_id UUID;

-- 1b. Drop existing foreign key constraint (may not have CASCADE)
ALTER TABLE setlist_template_items
DROP CONSTRAINT IF EXISTS setlist_template_items_song_id_fkey;

-- 1c. Re-add foreign key with CASCADE delete
ALTER TABLE setlist_template_items
ADD CONSTRAINT setlist_template_items_song_id_fkey
FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;

-- 1d. Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_setlist_template_items_song_id
ON setlist_template_items(song_id);

-- 1c. Backfill existing items by matching title within the same band
UPDATE setlist_template_items sti
SET song_id = s.id
FROM setlist_templates st, songs s
WHERE sti.template_id = st.id
  AND st.band_id = s.band_id
  AND LOWER(TRIM(sti.title)) = LOWER(TRIM(s.title))
  AND sti.song_id IS NULL;


-- ============================================================
-- PART 2: event_setlist_items (already has song_id, add CASCADE)
-- ============================================================

-- 2a. Drop existing foreign key constraint if any (to recreate with CASCADE)
ALTER TABLE event_setlist_items
DROP CONSTRAINT IF EXISTS event_setlist_items_song_id_fkey;

-- 2b. Add foreign key with CASCADE delete
ALTER TABLE event_setlist_items
ADD CONSTRAINT event_setlist_items_song_id_fkey
FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;

-- 2c. Create index if not exists
CREATE INDEX IF NOT EXISTS idx_event_setlist_items_song_id
ON event_setlist_items(song_id);

-- 2d. Backfill existing event items by matching title within the same band
UPDATE event_setlist_items esi
SET song_id = s.id
FROM events e, songs s
WHERE esi.event_id = e.id
  AND e.band_id = s.band_id
  AND LOWER(TRIM(esi.title)) = LOWER(TRIM(s.title))
  AND esi.song_id IS NULL;


-- Note: Items that don't match any song will have song_id = NULL
-- These are either orphaned (song was deleted) or have modified titles
-- They can still be manually removed by admins

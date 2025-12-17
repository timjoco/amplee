// ---------- Core row types from Supabase ----------

export type SetlistTemplateRow = {
  id: string;
  band_id: string;
  name: string;
  created_at: string | null;
};

export type SetlistTemplateItemRow = {
  id: string;
  template_id: string;
  order_index: number;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
  duration_seconds: number | null;
};

export type SetlistTemplateLinkRow = {
  id: string;
  template_id: string;
  url: string;
  label: string | null;
  created_at: string | null;
};

export type SongOption = {
  id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
  duration: number | null; // seconds
  origin: 'original' | 'cover' | null;
  original_artist: string | null;
};

// ---------- Link helpers ----------

export type LinkProvider =
  | 'spotify'
  | 'apple'
  | 'tidal'
  | 'youtube'
  | 'soundcloud'
  | 'deezer'
  | 'generic';

export type DetectedLinkType = {
  kind: LinkProvider;
  label: string;
};

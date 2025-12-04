// src/types/db.ts
export type MembershipRole = 'admin' | 'member';

export type Band = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type BandMembershipRow = {
  band_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
};

export type BandMediaItem = {
  id: string;
  type: 'photo' | 'video';
  thumbnailUrl: string; // photo itself, or video thumb
  title?: string; // “Live at recordBar”, etc.
  tag?: string; // “Live”, “Promo”, “Behind the scenes”
  href?: string; // full image or external video URL
};

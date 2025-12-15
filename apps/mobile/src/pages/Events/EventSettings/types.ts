export type EventType = 'show' | 'practice';

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'show', label: 'Show' },
  { value: 'practice', label: 'Practice' },
];

export type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: EventType | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  is_public: boolean;
  is_cancelled: boolean;
  is_booked: boolean;
};

export type InviteStatus = 'pending' | 'accepted' | 'declined';

export type InvitedMemberRow = {
  user_id: string;
  status: InviteStatus;
  updated_at?: string | null;
  invited_at?: string | null;
  needs_sub: boolean;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type BandMemberOption = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

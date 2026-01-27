export type MembershipRole = 'admin' | 'member';

export type NextEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  type: string | null;
};

export type RosterMember = {
  id: string;
  display_name: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
};

export type RouteParams = {
  bandId?: string;
  id?: string;
};

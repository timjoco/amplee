export type Option = {
  id: string;
  starts_at: string;
  yes: number;
  no: number;
  myVote?: 'yes' | 'no';
};

export type Proposal = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
  created_by: string | null;
  options: Option[];
};

export type RouteParams = {
  bandId: string;
  proposalId: string;
};

export type AvailabilityForOption = {
  conflicts: { user_id: string; name: string }[];
  conflictCount: number;
};

export type BandWithRole = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatar_url: string | null;
  updated_at: string | null;
};

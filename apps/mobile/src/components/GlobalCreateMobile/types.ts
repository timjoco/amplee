// GlobalCreateMobile/types.ts

/**
 * Props for the GlobalCreateMobile modal. Supports controlled and uncontrolled open state.
 * `onBandCreated` is used for optimistic UI updates after a band is created.
 */
export type GlobalCreateMobileProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBandCreated?: (band: BandLite) => void;
};

export type StepTitleMap = Record<Step, string>;

/**
 * High-level "screen" within the modal. Controls which form/menu is visible.
 */
export type Step = 'menu' | 'newBand' | 'newEvent' | 'newSong' | 'newProposal';

/**
 * One animated background orb used for the modal's ambient visual effect.
 * These are randomly generated and rendered as floating radial gradients.
 */
export interface Orb {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

/**
 * Lightweight representation of an existing event on the same day as the event being created.
 * Used for warning UI (same-day collisions).
 */
export type SameDayEvent = {
  id: string;
  title: string;
  type?: string;
};

/**
 * How invitees are determined when creating an event.
 * - `full`: invite the entire band membership list
 * - `roster`: invite members based on a saved roster selection
 */
export type InviteMode = 'full' | 'roster';

/**
 * Lightweight roster model used for the "Invite via roster" dropdown.
 */
export type RosterLite = {
  id: string;
  name: string;
};

/**
 * Lightweight band member model used for invite resolution / display.
 * `user_id` is the profile/user identifier in Supabase auth.
 */
export type MemberLite = {
  user_id: string;
  name: string;
  role: string;
};

/**
 * Minimal band model used throughout the global create modal (dropdowns, optimistic updates).
 */
export type BandLite = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

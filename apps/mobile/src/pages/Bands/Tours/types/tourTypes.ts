// ---------- Core row types from Supabase ----------

export type TourStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type TourStopStatus = 'tentative' | 'confirmed' | 'cancelled';
export type TravelMethod = 'van' | 'bus' | 'flight' | 'train' | 'other';
export type FileCategory = 'contract' | 'rider' | 'map' | 'itinerary' | 'receipt' | 'other';

export type TourRow = {
  id: string;
  band_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TourStatus;
  currency: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TourStopRow = {
  id: string;
  tour_id: string;

  // Date/times
  date: string;
  load_in_time: string | null;
  sound_check_time: string | null;
  doors_time: string | null;
  set_time: string | null;
  curfew_time: string | null;

  // Venue info
  venue_name: string;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_capacity: number | null;
  venue_phone: string | null;
  venue_website: string | null;

  // Promoter contact
  promoter_name: string | null;
  promoter_email: string | null;
  promoter_phone: string | null;

  // Production contact
  production_contact_name: string | null;
  production_contact_email: string | null;
  production_contact_phone: string | null;

  // Lodging
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_confirmation: string | null;
  hotel_check_in: string | null;
  hotel_check_out: string | null;

  // Travel
  travel_departure_location: string | null;
  travel_departure_time: string | null;
  travel_method: TravelMethod | null;
  travel_notes: string | null;

  // Hospitality
  backline_provided: boolean | null;
  catering_notes: string | null;
  green_room_notes: string | null;

  // General
  notes: string | null;
  status: TourStopStatus;
  order_index: number;

  // Coordinates & Route Planning
  venue_lat: number | null;
  venue_lng: number | null;
  distance_to_next_miles: number | null;
  drive_time_to_next_minutes: number | null;

  created_at: string | null;
  updated_at: string | null;
};

export type TourStopFinancialsRow = {
  id: string;
  tour_stop_id: string;

  // Income
  guarantee_amount: number | null;
  door_deal_percentage: number | null;
  merch_sales: number | null;
  other_income: number | null;
  other_income_notes: string | null;

  // Expenses
  hotel_cost: number | null;
  travel_cost: number | null;
  food_per_diem: number | null;
  equipment_rental: number | null;
  parking_tolls: number | null;
  other_expenses: number | null;
  other_expenses_notes: string | null;

  // Settlement
  actual_payout: number | null;
  is_settled: boolean | null;
  settlement_notes: string | null;

  created_at: string | null;
  updated_at: string | null;
};

export type TourFileRow = {
  id: string;
  tour_id: string;
  tour_stop_id: string | null;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  category: FileCategory;
  uploaded_by: string | null;
  created_at: string | null;
};

export type TourMemberRow = {
  id: string;
  tour_id: string;
  user_id: string;
  created_at: string | null;
};

export type TourMessageRow = {
  id: string;
  tour_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
};

// Extended types with user info
export type TourMemberWithUser = TourMemberRow & {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    updated_at: string | null;
  } | null;
  bandRole: 'admin' | 'member' | null;
};

export type TourMessageWithUser = TourMessageRow & {
  user: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    updated_at?: string | null;
  } | null;
  status?: 'sending' | 'sent' | 'failed';
};

// ---------- Computed/derived types ----------

export type TourWithStats = TourRow & {
  stop_count: number;
  confirmed_count: number;
};

export type TourStopWithFinancials = TourStopRow & {
  financials: TourStopFinancialsRow | null;
};

// ---------- Status helpers ----------

export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TOUR_STATUS_COLORS: Record<TourStatus, string> = {
  planning: '#f59e0b', // amber
  confirmed: '#10b981', // emerald
  in_progress: '#3b82f6', // blue
  completed: '#6b7280', // gray
  cancelled: '#ef4444', // red
};

export const TOUR_STOP_STATUS_LABELS: Record<TourStopStatus, string> = {
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export const TRAVEL_METHOD_LABELS: Record<TravelMethod, string> = {
  van: 'Van',
  bus: 'Tour Bus',
  flight: 'Flight',
  train: 'Train',
  other: 'Other',
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  contract: 'Contract',
  rider: 'Rider',
  map: 'Map',
  itinerary: 'Itinerary',
  receipt: 'Receipt',
  other: 'Other',
};

export type RouteParams = {
  eventId: string;
};

export type EventFile = {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

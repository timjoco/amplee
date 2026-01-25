# Amplee Changelog (Internal)

## 1.2.0 (In Progress)

### New Features
- **Tour Manager** — Plan and manage tours with stops, logistics, and financials
  - Tour list and editor pages
  - Tour stops with venue, lodging, travel, and contact details
  - Tour chat with reactions, edit, delete, copy messages
  - Route map with Mapbox integration
  - Address autocomplete using Mapbox Search Box API
  - Financial tracking per stop

---

## 1.1.0 (January 2026)

### New Features
- **Push Notifications** — Get notified for new chat messages and event invites
- **Redesigned Event Page** — New left-side navigation with tabs for Chat, Details, Roll Call, Setlist, Notes, and Files
- **Message Read Tracking** — See when messages have been read in event chats

### Improvements
- Chat is now the default tab when opening an event
- Event details consolidated into a cleaner card layout
- Added quick action tiles on event dashboard

### Bug Fixes
- Fixed RSVP confirmation popups being cut off by nav bar on iOS
- Fixed safe area handling on Android devices

### Infrastructure
- Added Supabase Edge Functions for push notification delivery
- Added database triggers for chat and event notifications

---

## 1.0.0 (Initial Release)

- Band creation and member invites
- Event creation (shows and practices)
- Event chat
- Roll call / RSVP system
- Setlist management
- File uploads
- Event notes
- User profiles and availability

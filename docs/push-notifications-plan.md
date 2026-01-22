# Push Notifications Implementation Plan

## Overview
Implement push notifications for the Amplee mobile app to keep band members informed of important activity.

---

## User Stories

### 1. Event Chat Messages
**As a** band member
**I want to** receive a push notification when someone sends a message in an event chat
**So that** I can stay informed and respond quickly to band discussions

**Acceptance Criteria:**
- Notification shows sender name and message preview
- Tapping notification opens the specific event chat
- User does NOT receive notification for their own messages
- Notifications respect user's device settings (Do Not Disturb, etc.)

### 2. New Event Created
**As a** band member
**I want to** receive a push notification when a new event is created for my band
**So that** I can see new gigs/practices and update my availability

**Acceptance Criteria:**
- Notification shows event title, type (show/practice), and date
- Tapping notification opens the event details
- All band members receive the notification (except the creator)
- Works for both shows and practices

---

## Use Cases

### UC1: Chat Message Notification
```
Actor: Band Member (recipient)
Trigger: Another member sends a message in event chat
Preconditions:
  - Recipient has the app installed
  - Recipient has granted notification permissions
  - Recipient has notifications enabled for this band/event
  - Recipient is a member of the event's band

Flow:
  1. Sender posts message to event chat
  2. System identifies all band members except sender
  3. System retrieves push tokens for those members
  4. System sends push notification with:
     - Title: "{Sender Name} in {Event Title}"
     - Body: "{Message preview...}" (truncated to ~100 chars)
     - Data: { eventId, bandId, type: "chat_message" }
  5. Recipient receives notification
  6. Recipient taps notification
  7. App opens directly to that event's chat tab

Edge Cases:
  - User has multiple devices → send to all registered devices
  - User has app open to that chat → don't send notification (or send silent)
  - Message is edited → no new notification
  - Message is deleted → no notification
```

### UC2: New Event Notification
```
Actor: Band Member (recipient)
Trigger: Admin creates a new event for the band
Preconditions:
  - Recipient has the app installed
  - Recipient has granted notification permissions
  - Recipient is a member of the band

Flow:
  1. Admin creates new event (show or practice)
  2. System identifies all band members except creator
  3. System retrieves push tokens for those members
  4. System sends push notification with:
     - Title: "New {Event Type} for {Band Name}"
     - Body: "{Event Title} - {Date/Time}"
     - Data: { eventId, bandId, type: "new_event" }
  5. Recipient receives notification
  6. Recipient taps notification
  7. App opens directly to that event's details

Edge Cases:
  - Event is created then immediately deleted → user may still see notification
  - Event date is in the past → still send (edge case, shouldn't happen)
  - User is member of multiple bands → clearly identify which band
```

---

## Technical Architecture

### Components Needed

#### 1. Database Schema
```sql
-- Store device push tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT, -- optional device identifier
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Notification preferences (future)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  chat_messages BOOLEAN DEFAULT true,
  new_events BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, band_id)
);
```

#### 2. Supabase Edge Functions
- `send-push-notification` - Generic function to send via FCM/APNs
- Database webhooks/triggers to call the function on:
  - `INSERT` on `event_messages` → chat notification
  - `INSERT` on `events` → new event notification

#### 3. Mobile App Changes
- Register for push notifications on app launch
- Store push token in database
- Handle notification tap → deep link to correct screen
- Request notification permissions (iOS requires explicit ask)

#### 4. Push Service Integration
- **Firebase Cloud Messaging (FCM)** - for Android and can proxy to APNs
- **Apple Push Notification Service (APNs)** - for iOS (via FCM or direct)

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create database tables for push tokens
- [ ] Add RLS policies for push_tokens table
- [ ] Mobile: Add push notification permissions request
- [ ] Mobile: Register and store push token on login

### Phase 2: Chat Notifications
- [ ] Create Edge Function to send notifications
- [ ] Create database trigger for event_messages INSERT
- [ ] Mobile: Handle chat notification tap → open event chat
- [ ] Test end-to-end flow

### Phase 3: New Event Notifications
- [ ] Create database trigger for events INSERT
- [ ] Mobile: Handle event notification tap → open event
- [ ] Test end-to-end flow

### Phase 4: Polish & Preferences (Future)
- [ ] Add notification preferences UI
- [ ] Implement quiet hours
- [ ] Add per-band notification settings
- [ ] Badge count management

---

## Open Questions

1. **FCM vs Direct APNs?**
   - FCM is simpler (one API for both platforms)
   - Direct APNs gives more control for iOS

2. **Notification grouping?**
   - Should multiple chat messages be grouped?
   - Collapse into "X new messages in Event Name"?

3. **Web push notifications?**
   - Support browser notifications for web app?
   - Lower priority than mobile

4. **Rate limiting?**
   - Prevent spam if someone sends many messages quickly
   - Batch notifications? (e.g., "3 new messages")

---

## Dependencies

- Firebase project setup (for FCM)
- Apple Developer account (for APNs certificates)
- Capacitor Push Notifications plugin (@capacitor/push-notifications)

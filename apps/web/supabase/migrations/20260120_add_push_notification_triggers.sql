-- ============================================================================
-- Push Notification Triggers
-- ============================================================================
-- These functions are called via database webhooks to send push notifications
-- when certain events occur (new chat message, new event created).
-- ============================================================================

-- 1. Function to notify band members of a new chat message
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event RECORD;
  v_sender RECORD;
  v_band_id UUID;
  v_message_preview TEXT;
BEGIN
  -- Get event details
  SELECT e.id, e.title, e.band_id
  INTO v_event
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_band_id := v_event.band_id;

  -- Get sender name
  SELECT p.display_name, p.first_name
  INTO v_sender
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  -- Truncate message for preview
  v_message_preview := LEFT(NEW.body, 100);
  IF LENGTH(NEW.body) > 100 THEN
    v_message_preview := v_message_preview || '...';
  END IF;

  -- Queue notification via pg_net (async HTTP call to Edge Function)
  -- Note: pg_net must be enabled in your Supabase project
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'band_id', v_band_id,
      'exclude_user_id', NEW.user_id,
      'title', COALESCE(v_sender.display_name, v_sender.first_name, 'Someone') || ' in ' || v_event.title,
      'body', v_message_preview,
      'data', jsonb_build_object(
        'type', 'chat_message',
        'event_id', NEW.event_id::text,
        'band_id', v_band_id::text,
        'message_id', NEW.id::text
      )
    )::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'notify_new_chat_message failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Function to notify band members of a new event
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_band RECORD;
  v_creator RECORD;
  v_event_type TEXT;
  v_event_date TEXT;
BEGIN
  -- Get band name
  SELECT b.name
  INTO v_band
  FROM public.bands b
  WHERE b.id = NEW.band_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Format event type
  v_event_type := CASE NEW.type
    WHEN 'show' THEN 'Show'
    WHEN 'practice' THEN 'Practice'
    ELSE 'Event'
  END;

  -- Format date
  IF NEW.starts_at IS NOT NULL THEN
    v_event_date := to_char(NEW.starts_at AT TIME ZONE 'UTC', 'Mon DD, YYYY');
  ELSE
    v_event_date := 'Date TBD';
  END IF;

  -- Queue notification via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'band_id', NEW.band_id,
      'exclude_user_id', NEW.created_by,
      'title', 'New ' || v_event_type || ' for ' || v_band.name,
      'body', NEW.title || ' - ' || v_event_date,
      'data', jsonb_build_object(
        'type', 'new_event',
        'event_id', NEW.id::text,
        'band_id', NEW.band_id::text
      )
    )::jsonb
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'notify_new_event failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- NOTE: The triggers below use pg_net which requires:
-- 1. pg_net extension enabled (Supabase Dashboard > Database > Extensions)
-- 2. App settings configured for supabase_url and service_role_key
--
-- If pg_net is not available, you can use Supabase Database Webhooks instead:
-- Dashboard > Database > Webhooks > Create webhook
-- ============================================================================

-- Uncomment these triggers once pg_net is enabled:

-- CREATE TRIGGER on_new_chat_message
--   AFTER INSERT ON public.event_messages
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_new_chat_message();

-- CREATE TRIGGER on_new_event
--   AFTER INSERT ON public.events
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_new_event();

-- ============================================================================
-- Alternative: Use Supabase Database Webhooks (recommended for simplicity)
-- ============================================================================
-- Instead of pg_net triggers, configure webhooks in the Supabase Dashboard:
--
-- Webhook 1: Chat Message Notifications
-- - Table: event_messages
-- - Events: INSERT
-- - URL: https://<project>.supabase.co/functions/v1/notify-chat-message
-- - Headers: Authorization: Bearer <service_role_key>
--
-- Webhook 2: New Event Notifications
-- - Table: events
-- - Events: INSERT
-- - URL: https://<project>.supabase.co/functions/v1/notify-new-event
-- - Headers: Authorization: Bearer <service_role_key>
-- ============================================================================

COMMENT ON FUNCTION public.notify_new_chat_message IS 'Sends push notification when a new chat message is posted';
COMMENT ON FUNCTION public.notify_new_event IS 'Sends push notification when a new event is created';

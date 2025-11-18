// src/utils/exportEventToCalendar.ts
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ExportEventOptions = {
  title: string;
  startsAt: string; // ISO string
  location?: string | null;
  notes?: string | null;
  durationMinutes?: number; // used for end time
};

type CalendarProvider = 'ics' | 'google';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatIcsDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function buildIcs({
  title,
  startsAt,
  location,
  notes,
  durationMinutes = 120,
}: ExportEventOptions) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const dtStartUtc = formatIcsDate(start);
  const dtEndUtc = formatIcsDate(end);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amplee//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@amplee.app`,
    `DTSTAMP:${dtStartUtc}`,
    `DTSTART:${dtStartUtc}`,
    `DTEND:${dtEndUtc}`,
    `SUMMARY:${(title || 'Event').replace(/\r?\n/g, ' ')}`,
    location ? `LOCATION:${location.replace(/\r?\n/g, ' ')}` : '',
    notes ? `DESCRIPTION:${notes.replace(/\r?\n/g, ' ')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

function formatGoogleDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function buildGoogleCalendarUrl(opts: ExportEventOptions) {
  const start = new Date(opts.startsAt);
  const duration = opts.durationMinutes ?? 120;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title || 'Event',
    dates,
    location: opts.location || '',
    details: opts.notes || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Deployed web base URL – set this in your mobile env, e.g. https://amplee.app
const ICS_BASE_URL =
  (import.meta as any).env?.VITE_WEB_BASE_URL ??
  (typeof window !== 'undefined' ? window.location.origin : '');

// Still exported in case you want it elsewhere on web
export function buildAppleCalendarLink(
  opts: ExportEventOptions
): string | null {
  if (!ICS_BASE_URL) return null;

  const params = new URLSearchParams({
    title: opts.title || 'Event',
    startsAt: opts.startsAt,
    durationMinutes: String(opts.durationMinutes ?? 120),
  });

  if (opts.location) params.set('location', opts.location);
  if (opts.notes) params.set('notes', opts.notes);

  return `${ICS_BASE_URL}/api/events/ics?${params.toString()}`;
}

export async function exportEventToCalendar(
  opts: ExportEventOptions,
  provider: CalendarProvider = 'ics'
) {
  const platform = Capacitor.getPlatform();
  const isNative = platform === 'ios' || platform === 'android';

  // ---- GOOGLE CALENDAR ----
  if (provider === 'google') {
    const url = buildGoogleCalendarUrl(opts);
    window.open(url, '_blank');
    return;
  }

  // ---- ICS / APPLE CALENDAR (native) ----
  if (provider === 'ics' && isNative) {
    try {
      const ics = buildIcs(opts);
      const safeName =
        (opts.title || 'event').replace(/[^\w\d]+/g, '-') + '.ics';
      const path = `calendar/${safeName}`;

      // 1) Write file to cache dir
      await Filesystem.writeFile({
        path,
        data: ics,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // 2) Get native URI for the file
      const { uri } = await Filesystem.getUri({
        path,
        directory: Directory.Cache,
      });

      // 3) Share it as a file (Calendar should show up as a target on iOS)
      await Share.share({
        title: 'Add to Calendar',
        text: `Add "${opts.title}" to your calendar`,
        files: [uri],
        dialogTitle: 'Add to Calendar',
      });

      return;
    } catch (err) {
      console.error(
        'Native ICS share failed – falling back to web download',
        err
      );
      // fall through to web-style fallback
    }
  }

  // ---- WEB / FALLBACK: direct ICS download in browser ----
  const ics = buildIcs(opts);
  const blob = new Blob([ics], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  // iOS Safari is weird with downloads; forcing navigation sometimes works better
  if (
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  ) {
    window.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(opts.title || 'event').replace(/[^\w\d]+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

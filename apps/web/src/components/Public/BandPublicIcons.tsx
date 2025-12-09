'use client';

export type IconProps = {
  platform: string;
  size?: number;
};

// ---------- STREAMING ICONS (Music platforms) ----------
export function StreamingIcon({ platform, size = 20 }: IconProps) {
  const key = platform.toLowerCase();

  // ───── YouTube Music (circle) ─────
  if (
    key === 'youtubemusic' ||
    key === 'youtube-music' ||
    key === 'youtube music'
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        {/* Outer red circle */}
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        {/* Inner ring */}
        <circle
          cx="12"
          cy="12"
          r="5.5"
          fill="none"
          stroke="white"
          strokeWidth="1.6"
        />
        {/* Play triangle */}
        <path d="M11 9.5L15 12L11 14.5V9.5Z" fill="white" />
      </svg>
    );
  }

  // ───── YouTube (rounded rectangle) ─────
  if (key === 'youtube') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        {/* Red rounded rect */}
        <rect
          x="2.5"
          y="6"
          width="19"
          height="12"
          rx="3"
          ry="3"
          fill="currentColor"
        />
        {/* Play triangle */}
        <path d="M11 9L15 12L11 15V9Z" fill="white" />
      </svg>
    );
  }

  // ───── Spotify ─────
  if (key === 'spotify') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        <path
          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
          fill="currentColor"
        />
      </svg>
    );
  }

  // ───── Apple Music (simple note in circle) ─────
  if (key === 'apple' || key === 'apple-music' || key === 'apple music') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M14.5 7.5v6.4a2.3 2.3 0 1 1-1.2-2.02V9.1L10 9.8v4.1a2.3 2.3 0 1 1-1.2-2.02V8.4l5.7-0.9Z"
          fill="white"
        />
      </svg>
    );
  }

  // ───── Generic circle for anything else ─────
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M10 9.5h1.2l2.3 2.1-2.3 2.1H10l2-2.1-2-2.1Z" fill="white" />
    </svg>
  );
}

// ---------- SOCIAL ICONS (for Follow Us) ----------
export function SocialIcon({ platform, size = 20 }: IconProps) {
  const key = platform.toLowerCase();

  // We can keep this simple; you already style the button color.
  if (key === 'instagram') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          ry="5"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="4.2" fill="white" />
        <circle cx="17" cy="7" r="1.2" fill="white" />
      </svg>
    );
  }

  if (key === 'facebook') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M13.2 8.2H14.8V6H13.2C11.4 6 10 7.3 10 9.5V11H8.5V13.2H10V18H12.2V13.2H13.8L14.3 11H12.2V9.5C12.2 8.7 12.6 8.2 13.2 8.2Z"
          fill="white"
        />
      </svg>
    );
  }

  if (key === 'x' || key === 'twitter') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ display: 'block' }}
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path
          d="M9.1 7.5H7.5L10.8 11.6 7.6 16.5H9.3L11.6 13.1L14 16.5H15.6L12.2 12.3L15.2 7.5H13.5L11.3 10.7L9.1 7.5Z"
          fill="white"
        />
      </svg>
    );
  }

  // Fallback: simple circle + link-ish bar
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M8.5 12H15.5V13.4H8.5V12Z" fill="white" />
    </svg>
  );
}

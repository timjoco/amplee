'use client';

import React, { useState } from 'react';

interface StreamingLink {
  id: string;
  platform_type: string;
  url: string;
  label?: string;
}

interface StreamingButtonsProps {
  links: StreamingLink[];
}

const brandColors: Record<string, string> = {
  spotify: '#1DB954',
  apple: '#FA243C',
  youtube: '#FF0000',
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  soundcloud: '#FF5500',
  bandcamp: '#629AA9',
};

const icons: Record<string, React.ReactNode> = {
  spotify: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

const defaultIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

const labels: Record<string, string> = {
  spotify: 'Play on Spotify',
  apple: 'Apple Music',
  youtube: 'Watch on YouTube',
  instagram: 'Follow on Instagram',
  facebook: 'Like on Facebook',
  twitter: 'Follow on Twitter',
  tiktok: 'Follow on TikTok',
  soundcloud: 'Listen on SoundCloud',
  bandcamp: 'Support on Bandcamp',
};

export default function StreamingButtons({ links }: StreamingButtonsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const getLabel = (link: StreamingLink) => {
    const type = link.platform_type?.toLowerCase() || '';
    return link.label || labels[type] || 'Visit';
  };

  if (!links || links.length === 0) return null;

  return (
    <div className="px-6 mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[2px] text-white/40 mb-4 text-center">
        Listen & Follow
      </p>
      <div className="flex flex-col gap-3">
        {links.map((link, idx) => {
          const type = link.platform_type?.toLowerCase() || 'generic';
          const bg = brandColors[type] || 'rgba(255,255,255,0.1)';
          const icon = icons[type] || defaultIcon;

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-4 py-3.5 px-5 rounded-xl text-white no-underline transition-all duration-300"
              style={{
                background: bg,
                transform:
                  hovered === idx ? 'translateY(-2px) scale(1.02)' : 'none',
                boxShadow:
                  hovered === idx
                    ? `0 10px 30px ${bg}60`
                    : '0 4px 15px rgba(0,0,0,0.2)',
              }}
            >
              <span className="text-white flex">{icon}</span>
              <span className="text-[15px] font-bold text-white flex-1">
                {getLabel(link)}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="rgba(255,255,255,0.7)"
                width="20"
                height="20"
                className="transition-transform duration-300"
                style={{
                  transform: hovered === idx ? 'translateX(4px)' : 'none',
                }}
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}

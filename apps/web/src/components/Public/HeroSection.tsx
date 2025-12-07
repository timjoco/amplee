'use client';

import { useEffect, useState } from 'react';

interface Band {
  name: string;
  bio?: string;
  location?: string;
  genres?: string[];
}

interface HeroSectionProps {
  band: Band;
  memberCount: number;
}

export default function HeroSection({ band, memberCount }: HeroSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [fansListening] = useState(Math.floor(Math.random() * 50 + 10));

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const genreColors = [
    {
      bg: 'rgba(139, 92, 246, 0.2)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#a78bfa',
    },
    {
      bg: 'rgba(236, 72, 153, 0.2)',
      border: 'rgba(236, 72, 153, 0.3)',
      text: '#f472b6',
    },
    {
      bg: 'rgba(6, 182, 212, 0.2)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: '#22d3ee',
    },
  ];

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const genres = band.genres || [];

  return (
    <div className="pt-12 pb-6 px-6 text-center relative">
      {/* Animated Avatar */}
      <div
        className="relative w-[140px] h-[140px] mx-auto mb-6 transition-all duration-[600ms]"
        style={{
          transform: isLoaded ? 'scale(1)' : 'scale(0.8)',
          opacity: isLoaded ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="absolute -inset-2 rounded-full opacity-80 blur-lg animate-spin"
          style={{
            background:
              'conic-gradient(from 0deg, #8b5cf6, #ec4899, #06b6d4, #10b981, #8b5cf6)',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute -inset-1 rounded-full animate-[spin_3s_linear_infinite_reverse]"
          style={{
            background:
              'conic-gradient(from 180deg, #8b5cf6, #ec4899, #06b6d4, #8b5cf6)',
          }}
        />
        <div className="absolute inset-1 rounded-full bg-[#0a0a0f] flex items-center justify-center">
          <span className="text-[44px] font-black bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {getInitials(band.name)}
          </span>
        </div>
        {/* Verified Badge */}
        <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-400 border-[3px] border-[#0a0a0f] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
          <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      </div>

      {/* Band Name */}
      <h1
        className="text-4xl font-black text-white tracking-tight mb-3 transition-all duration-[600ms] delay-200"
        style={{
          textShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          opacity: isLoaded ? 1 : 0,
        }}
      >
        {band.name}
      </h1>

      {/* Location */}
      {band.location && (
        <div
          className="inline-flex items-center gap-1 mb-4 transition-all duration-[600ms] delay-300"
          style={{
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            opacity: isLoaded ? 1 : 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="rgba(255,255,255,0.5)"
            width="16"
            height="16"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm text-white/50 font-medium">
            {band.location}
          </span>
        </div>
      )}

      {/* Genres */}
      {genres.length > 0 && (
        <div
          className="flex justify-center flex-wrap gap-2 mb-5 transition-all duration-[600ms] delay-[400ms]"
          style={{
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            opacity: isLoaded ? 1 : 0,
          }}
        >
          {genres.slice(0, 3).map((genre, idx) => (
            <span
              key={genre}
              className="px-3 py-1 rounded-2xl text-[11px] font-bold uppercase tracking-wide"
              style={{
                background: genreColors[idx % genreColors.length].bg,
                border: `1px solid ${
                  genreColors[idx % genreColors.length].border
                }`,
                color: genreColors[idx % genreColors.length].text,
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {band.bio && (
        <p
          className="text-[15px] text-white/70 leading-relaxed max-w-[320px] mx-auto transition-all duration-[600ms] delay-500"
          style={{
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
            opacity: isLoaded ? 1 : 0,
          }}
        >
          {band.bio}
        </p>
      )}

      {/* Live Indicator */}
      <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-3xl bg-white/5 border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-[pulse_1.5s_ease-in-out_infinite]" />
        <span className="text-xs text-white/60 font-semibold">
          {memberCount} {memberCount === 1 ? 'member' : 'members'} •{' '}
          {fansListening} fans listening
        </span>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

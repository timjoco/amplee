'use client';

import { useEffect, useState } from 'react';

interface Show {
  id: string;
  title: string;
  starts_at: string;
  location: string;
  ticket_url?: string;
}

interface NextShowCountdownProps {
  show: Show;
}

export default function NextShowCountdown({ show }: NextShowCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(show.starts_at).getTime() - new Date().getTime();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [show.starts_at]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[52px]">
      <div className="w-[52px] h-[60px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <span className="text-[26px] font-extrabold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mt-1.5">
        {label}
      </span>
    </div>
  );

  return (
    <div className="mx-6 mb-5 p-5 rounded-[20px] bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/20 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-[pulseRed_1s_ease-in-out_infinite]" />
        <span className="text-[11px] font-bold uppercase tracking-[2px] text-white/60">
          Next Show
        </span>
      </div>
      <h3 className="text-lg font-extrabold text-white mb-1">{show.title}</h3>
      <p className="text-[13px] text-white/50 mb-5 flex items-center gap-1">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        {show.location}
      </p>
      <div className="flex justify-center gap-3 mb-5">
        <TimeBlock value={timeLeft.days} label="Days" />
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <TimeBlock value={timeLeft.seconds} label="Secs" />
      </div>
      {show.ticket_url && (
        <a
          href={show.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold no-underline"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
          </svg>
          Get Tickets
        </a>
      )}
      <style jsx>{`
        @keyframes pulseRed {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

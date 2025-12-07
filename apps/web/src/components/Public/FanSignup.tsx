'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import React, { useState } from 'react';

interface FanSignupProps {
  bandId: string;
}

export default function FanSignup({ bandId }: FanSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.from('band_fans').insert({
        band_id: bandId,
        email: email.toLowerCase().trim(),
        subscribed_at: new Date().toISOString(),
      });

      if (error) throw error;
      setStatus('success');
    } catch (error) {
      console.error('Fan signup error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'success') {
    return (
      <div className="mx-6 mb-5 p-6 rounded-[20px] bg-gradient-to-br from-green-500/15 to-green-400/10 border border-green-500/30 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-400 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="#fff" width="28" height="28">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-white mb-1">
          You're In! 🎉
        </h3>
        <p className="text-sm text-white/60">
          You'll be the first to know about new releases and shows.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-5 p-6 rounded-[20px] bg-white/[0.03] border border-white/[0.08] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
      <div className="text-center mb-5">
        <h3 className="text-xl font-extrabold text-white mb-1">
          Join the Fan List
        </h3>
        <p className="text-sm text-white/50">
          Get notified about new music, shows & exclusive content
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 py-3 px-4 rounded-[10px] bg-white/5 text-white text-[15px] outline-none transition-all duration-200"
          style={{
            border: `2px solid ${
              focused ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)'
            }`,
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 rounded-[10px] bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white text-sm font-bold cursor-pointer min-w-[80px] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? '...' : 'Join'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center mt-3 mb-0">
          Something went wrong. Please try again.
        </p>
      )}
      <p className="text-[11px] text-white/30 text-center mt-4 mb-0">
        No spam, unsubscribe anytime
      </p>
    </div>
  );
}

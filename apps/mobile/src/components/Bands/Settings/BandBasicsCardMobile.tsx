/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Props = {
  bandId: string;
  initialName: string;
};

export default function BandBasicsCardMobile({ bandId, initialName }: Props) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSave() {
    const next = name.trim();
    if (!next) {
      setErr('Name cannot be empty.');
      setOk(null);
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const { error } = await supabase
        .from('bands')
        .update({ name: next })
        .eq('id', bandId);

      if (error) throw new Error(error.message);

      setOk('Band name updated.');
    } catch (e: any) {
      setErr(e?.message || 'Failed to update band name');
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim() && name.trim() !== initialName.trim() && !saving;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'rgba(196,181,253,0.9)',
          }}
        >
          Update your band name{' '}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErr(null);
            setOk(null);
          }}
          maxLength={100}
          placeholder="Band name"
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.7)',
            backgroundColor: '#050509',
            color: '#E5E7EB',
            fontSize: 14,
            outline: 'none',
          }}
        />

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.2,
            cursor: canSave ? 'pointer' : 'default',
            background: canSave
              ? 'linear-gradient(135deg, rgba(147,51,234,0.98), rgba(107,58,157,0.98))'
              : 'rgba(31,41,55,0.9)',
            color: canSave ? '#F5F3FF' : 'rgba(156,163,175,0.9)',
            opacity: saving ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {err && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: '#FCA5A5',
          }}
        >
          {err}
        </p>
      )}
      {ok && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: '#BBF7D0',
          }}
        >
          {ok}
        </p>
      )}
    </div>
  );
}

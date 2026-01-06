/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import { supabase } from '../../../../lib/supabase';
import type { InviteMode } from '../types';
import { useBandId } from './useBandId';

export function useInviteBand() {
  const bandId = useBandId();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [bandName, setBandName] = React.useState<string>('Band');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<InviteMode>('email');
  const [emailInput, setEmailInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showSentToast, setShowSentToast] = React.useState(false);

  // Generate invite link (creates DB record)
  const generateInviteLink = React.useCallback(
    async (inviterId?: string) => {
      if (!bandId) return;

      try {
        setGeneratingLink(true);
        setErr(null);

        const inviterUserId = inviterId || userId;
        if (!inviterUserId) {
          console.error('[InviteBand] No user ID available');
          setErr('Not signed in');
          return;
        }

        const { error: ensureErr } = await supabase.rpc('ensure_profile');
        if (ensureErr) {
          console.error('[InviteBand] ensure_profile error:', ensureErr);
        }

        const { data: invite, error } = await supabase
          .from('band_invitations')
          .insert({
            band_id: bandId,
            invited_by: inviterUserId,
            email: null,
            role: 'member',
            status: 'pending',
          })
          .select('token')
          .single();

        if (error) {
          console.error('[InviteBand] Failed to create invite:', error);
          setErr('Failed to generate invite link');
          return;
        }

        const link = `https://amplee.app/invite/${invite.token}`;
        setInviteLink(link);
      } catch (e: any) {
        console.error('[InviteBand] generateInviteLink error:', e);
        setErr(e?.message || 'Failed to generate link');
      } finally {
        setGeneratingLink(false);
      }
    },
    [bandId, userId]
  );

  // Load band + role
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bandId) {
        setErr('Missing band id.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userErr) throw userErr;
        if (!user) throw new Error('You must be signed in.');

        setUserId(user.id);

        const { error: ensureErr } = await supabase.rpc('ensure_profile');
        if (cancelled) return;
        if (ensureErr) {
          console.error('[InviteBand] ensure_profile error', ensureErr);
        }

        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (memErr) throw memErr;
        if (!mem) {
          throw new Error('You are not a member of this band.');
        }

        const admin = mem.role === 'admin';
        if (!admin) {
          throw new Error('Only band admins can create invites.');
        }

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('name')
          .eq('id', bandId)
          .maybeSingle();

        if (cancelled) return;
        if (bandErr) throw bandErr;
        if (!band) throw new Error('Band not found.');

        setBandName(band.name || 'Band');
        setIsAdmin(true);

        await generateInviteLink(user.id);
      } catch (e: any) {
        if (cancelled) return;
        console.error('[InviteBand] load error', e);
        setErr(e?.message || 'Failed to load invite info.');
        setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bandId, generateInviteLink]);

  // Email helpers
  function addEmailFromInput() {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (emails.includes(trimmed)) {
      setEmailInput('');
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput('');
  }

  function removeEmail(emailToRemove: string) {
    setEmails((prev) => prev.filter((e) => e !== emailToRemove));
  }

  async function sendEmailInvites() {
    if (!bandId || !isAdmin || emails.length === 0 || sendingInvites) return;

    try {
      setSendingInvites(true);
      setErr(null);

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      if (!session) throw new Error('Not signed in');

      const role: 'member' = 'member';
      const base = 'https://amplee.app';

      for (const em of emails) {
        const res = await fetch(`${base}/api/bands/${bandId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: em,
            role,
            bandName,
          }),
        });

        if (!res.ok) {
          const ct = res.headers.get('content-type') || '';
          const payload = ct.includes('application/json')
            ? await res.json()
            : await res.text();
          const msg =
            typeof payload === 'string'
              ? payload
              : payload?.error || 'Invite failed';
          throw new Error(msg);
        }
      }

      setEmails([]);
      setShowSentToast(true);
    } catch (e: any) {
      console.error('[InviteBand] sendEmailInvites error', e);
      setErr(e?.message || 'Failed to send email invites.');
    } finally {
      setSendingInvites(false);
    }
  }

  // SMS via native app
  function openNativeTexting() {
    if (!inviteLink) return;

    const message = `Join ${bandName} on Amplee! ${inviteLink}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;

    window.location.href = smsUrl;
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }

  return {
    bandId,
    loading,
    err,
    bandName,
    isAdmin,
    mode,
    setMode,
    emailInput,
    setEmailInput,
    emails,
    sendingInvites,
    inviteLink,
    generatingLink,
    copied,
    showSentToast,
    setShowSentToast,
    generateInviteLink,
    addEmailFromInput,
    removeEmail,
    sendEmailInvites,
    openNativeTexting,
    copyInviteLink,
  };
}

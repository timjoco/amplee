/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  checkmarkCircle,
  closeOutline,
  mapOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { supabase } from '../../../../lib/supabase';
import { glassCard, TEAL } from '../lib/styles';
import type { TourRow } from '../types/tourTypes';

type RosterMember = {
  user_id: string;
  role: 'admin' | 'member';
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

type Props = {
  bandId: string;
  onClose: () => void;
  onCreated: (tour: TourRow) => void;
};

export function CreateTourModal({ bandId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Roster state
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // Load band roster
  useEffect(() => {
    if (!bandId) return;

    setLoadingRoster(true);
    supabase
      .from('band_members')
      .select(`
        user_id,
        role,
        profiles (
          id, first_name, last_name, display_name, avatar_url, updated_at
        )
      `)
      .eq('band_id', bandId)
      .then(({ data, error: err }) => {
        if (err) {
          console.error('Failed to load roster:', err);
          setLoadingRoster(false);
          return;
        }

        const members: RosterMember[] = (data || []).map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          first_name: m.profiles?.first_name || null,
          last_name: m.profiles?.last_name || null,
          display_name: m.profiles?.display_name || null,
          avatar_url: m.profiles?.avatar_url || null,
          updated_at: m.profiles?.updated_at || null,
        }));

        setRoster(members);
        // Select all members by default
        setSelectedMembers(new Set(members.map((m) => m.user_id)));
        setLoadingRoster(false);
      });
  }, [bandId]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedMembers(new Set(roster.map((m) => m.user_id)));
  };

  const selectNone = () => {
    setSelectedMembers(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a tour name');
      return;
    }

    if (selectedMembers.size === 0) {
      setError('Please select at least one tour member');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // 1. Create the tour
      const { data, error: insertError } = await supabase
        .from('tours')
        .insert({
          band_id: bandId,
          name: name.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          status: 'planning',
          created_by: userId,
        } as any)
        .select('*')
        .single();

      if (insertError) {
        console.error('[CreateTourModal] insert error', insertError);
        setError('Failed to create tour. Please try again.');
        return;
      }

      const tourId = data.id;

      // 2. Add tour members
      const memberInserts = Array.from(selectedMembers).map((uid) => ({
        tour_id: tourId,
        user_id: uid,
      }));

      const { error: membersError } = await supabase
        .from('tour_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('[CreateTourModal] members insert error', membersError);
        // Tour was created but members failed - still notify success
        // but log the error
      }

      onCreated(data as TourRow);
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (member: RosterMember) => {
    const fullName = [member.first_name, member.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return member.display_name || fullName || 'Unknown';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          ...glassCard,
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          maxHeight: '85vh',
          padding: 0,
          overflow: 'hidden',
          border: `1px solid ${TEAL.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: TEAL.subtle,
                border: `1px solid ${TEAL.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={mapOutline}
                style={{ fontSize: 18, color: TEAL.light }}
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              New Tour
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 20,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Tour Name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 8,
              }}
            >
              Tour Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer 2026 West Coast Tour"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {/* Date Range */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 8,
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: 8,
                }}
              >
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Tour Members */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                }}
              >
                Tour Members *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    color: TEAL.light,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  None
                </button>
              </div>
            </div>

            {loadingRoster ? (
              <div
                style={{
                  padding: 20,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <IonSpinner style={{ '--color': TEAL.light }} />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {roster.map((member) => {
                  const isSelected = selectedMembers.has(member.user_id);
                  return (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => toggleMember(member.user_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: isSelected
                          ? TEAL.subtle
                          : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${
                          isSelected ? TEAL.border : 'rgba(255, 255, 255, 0.06)'
                        }`,
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Avatar */}
                      <AvatarImageMobile
                        name={getDisplayName(member)}
                        bucket="profile-avatars"
                        avatarPath={member.avatar_url ?? undefined}
                        updatedAt={member.updated_at ?? undefined}
                        size={36}
                        style={{ borderRadius: 10, flexShrink: 0 }}
                      />

                      {/* Name & Role */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#f9fafb',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getDisplayName(member)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: member.role === 'admin' ? TEAL.light : '#6b7280',
                            textTransform: 'capitalize',
                          }}
                        >
                          {member.role}
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: isSelected
                            ? TEAL.primary
                            : 'rgba(255, 255, 255, 0.06)',
                          border: isSelected
                            ? 'none'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && (
                          <IonIcon
                            icon={checkmarkCircle}
                            style={{ fontSize: 16, color: '#fff' }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              {selectedMembers.size} of {roster.length} members selected
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || selectedMembers.size === 0}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: TEAL.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 4px 14px ${TEAL.glow}`,
                opacity:
                  saving || !name.trim() || selectedMembers.size === 0 ? 0.6 : 1,
              }}
            >
              {saving ? (
                <>
                  <IonSpinner
                    style={{ '--color': '#fff', width: 16, height: 16 }}
                  />
                  Creating...
                </>
              ) : (
                'Create Tour'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

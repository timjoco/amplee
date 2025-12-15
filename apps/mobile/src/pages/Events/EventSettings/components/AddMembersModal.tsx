import { IonIcon, IonSpinner } from '@ionic/react';
import { checkmarkOutline, peopleOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { supabase } from '../../../../lib/supabase';
import { BandMemberOption } from '../types';

export function AddMembersModal({
  isOpen,
  onClose,
  bandId,
  eventId,
  existingMemberIds,
  onMembersAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  bandId: string;
  eventId: string;
  existingMemberIds: Set<string>;
  onMembersAdded: (userIds: string[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bandMembers, setBandMembers] = useState<BandMemberOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !bandId) return;
    let alive = true;

    const displayName = (x: BandMemberOption) =>
      (
        [x.first_name, x.last_name].filter(Boolean).join(' ').trim() ||
        x.display_name ||
        'Unknown'
      ).toLowerCase();

    (async () => {
      setLoading(true);
      setSelectedIds(new Set());

      const { data, error } = await supabase
        .from('band_members')
        .select(
          'user_id, profiles:user_id (first_name, last_name, display_name, avatar_url, updated_at)'
        )
        .eq('band_id', bandId);

      if (!alive) return;

      if (error) {
        setBandMembers([]);
        setLoading(false);
        return;
      }

      const mapped: BandMemberOption[] = (data ?? []).map((m: any) => ({
        user_id: m.user_id,
        first_name: m.profiles?.first_name ?? null,
        last_name: m.profiles?.last_name ?? null,
        display_name: m.profiles?.display_name ?? null,
        avatar_url: m.profiles?.avatar_url ?? null,
        updated_at: m.profiles?.updated_at ?? null,
      }));

      // Sort: selectable first, then already-invited; tie-breaker alphabetical
      mapped.sort((a, b) => {
        const aInvited = existingMemberIds.has(a.user_id) ? 1 : 0;
        const bInvited = existingMemberIds.has(b.user_id) ? 1 : 0;
        if (aInvited !== bInvited) return aInvited - bInvited;
        return displayName(a).localeCompare(displayName(b));
      });

      setBandMembers(mapped);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, bandId, existingMemberIds]);

  const toggleMember = (userId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const handleAddSelected = async () => {
    if (selectedIds.size === 0 || saving) return;
    setSaving(true);
    try {
      const inserts = Array.from(selectedIds).map((user_id) => ({
        event_id: eventId,
        user_id,
        status: 'pending',
      }));
      const { error } = await supabase.from('event_members').insert(inserts);
      if (!error) {
        onMembersAdded(Array.from(selectedIds));
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',

        background: '#050509',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8,8,12,0.98)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          Cancel
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#f9fafb',
            }}
          >
            Add Members
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : 'Select band members'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSelected}
          disabled={saving || selectedIds.size === 0}
          style={{
            background: 'transparent',
            border: 'none',
            color:
              selectedIds.size === 0 ? 'rgba(139, 92, 246, 0.4)' : '#a78bfa',
            fontSize: 16,
            fontWeight: 700,
            cursor:
              saving || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {saving ? (
            <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
          ) : (
            'Add'
          )}
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 16,
          paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,

          boxSizing: 'border-box',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: '#9ca3af',
              fontSize: 14,
              padding: '60px 0',
            }}
          >
            <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
            Loading band members…
          </div>
        ) : bandMembers.length === 0 ? (
          <div
            style={{
              color: '#9ca3af',
              fontSize: 14,
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IonIcon
                icon={peopleOutline}
                style={{ fontSize: 28, color: 'rgba(139, 92, 246, 0.5)' }}
              />
            </div>
            <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: 4 }}>
              All members invited
            </div>
            <div>Every band member is already invited to this event.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bandMembers.map((m) => {
              const name =
                [m.first_name, m.last_name].filter(Boolean).join(' ').trim() ||
                m.display_name ||
                'Unknown';
              const isSelected = selectedIds.has(m.user_id);
              const isAlreadyInvited = existingMemberIds.has(m.user_id);
              const disabled = isAlreadyInvited;
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => {
                    if (!disabled) toggleMember(m.user_id);
                  }}
                  disabled={disabled}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 14,

                    background: disabled
                      ? 'rgba(255,255,255,0.015)'
                      : isSelected
                      ? 'rgba(139, 92, 246, 0.12)'
                      : 'rgba(255,255,255,0.02)',

                    border: disabled
                      ? '1px solid rgba(255,255,255,0.04)'
                      : isSelected
                      ? '1.5px solid rgba(139, 92, 246, 0.4)'
                      : '1px solid rgba(255,255,255,0.06)',

                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <AvatarImageMobile
                    name={name}
                    bucket="profile-avatars"
                    avatarPath={m.avatar_url || undefined}
                    updatedAt={m.updated_at || undefined}
                    size={44}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: disabled
                          ? '#94a3b8'
                          : isSelected
                          ? '#e9d5ff'
                          : '#f9fafb',
                        fontWeight: 600,
                        fontSize: 15,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>

                    {disabled && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 12,
                          color: '#6b7280',
                          fontWeight: 600,
                        }}
                      >
                        Already invited
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: disabled
                        ? 'rgba(255,255,255,0.04)'
                        : isSelected
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: disabled
                        ? '2px solid rgba(255,255,255,0.08)'
                        : isSelected
                        ? 'none'
                        : '2px solid rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {!disabled && isSelected && (
                      <IonIcon
                        icon={checkmarkOutline}
                        style={{ fontSize: 16, color: '#fff' }}
                      />
                    )}
                    {disabled && (
                      <IonIcon
                        icon={checkmarkOutline}
                        style={{ fontSize: 16, color: '#9ca3af' }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

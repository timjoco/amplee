/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner, IonText, IonToast } from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  helpCircleOutline,
  personOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useAttendance, type AttStatus } from '../../hooks/useAttendance';
import { supabase } from '../../lib/supabase';

type AttendanceSummary = {
  accepted: number;
  total: number;
  mine: AttStatus | null;
  hydrated: boolean;
};

export default function RSVPTabMobile({
  eventId,
  onLocalBookedChange,
  onAttendanceSummaryChange,
}: {
  eventId: string;
  onLocalBookedChange?: (isBooked: boolean) => void;
  onAttendanceSummaryChange?: (summary: AttendanceSummary) => void;
}) {
  const {
    mine,
    counts,
    needsSub,
    subReason,
    saving,
    savingSub,
    error,
    update,
    updateSubRequest,
    hydrated,
  } = useAttendance(eventId);

  const [showSubPopup, setShowSubPopup] = React.useState(false);
  const [showSubToast, setShowSubToast] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [confirmTarget, setConfirmTarget] = React.useState<AttStatus | null>(
    null
  );

  const hasSubRequested = needsSub;
  const isAccepted = hydrated && !hasSubRequested && mine === 'accepted';
  const isPending = hydrated && !hasSubRequested && mine === 'pending';

  React.useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get event's band_id and check if user is admin
      const { data: event } = await supabase
        .from('events')
        .select('band_id')
        .eq('id', eventId)
        .single();

      if (!event) return;

      const { data: member } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', event.band_id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(member?.role === 'admin');
    }

    checkAdmin();
  }, [eventId]);

  // -------------------------
  // Optimistic display counts
  // -------------------------
  const [displayCounts, setDisplayCounts] = React.useState(() => ({
    accepted: 0,
    total: 0,
  }));

  const isDeclined = hydrated && !hasSubRequested && mine === 'declined';

  // Initialize + reconcile from hook counts (avoid flicker while saving)
  React.useEffect(() => {
    if (!hydrated) return;
    if (saving || savingSub) return;

    setDisplayCounts({
      accepted: counts.accepted ?? 0,
      total: counts.total ?? 0,
    });
  }, [counts.accepted, counts.total, hydrated, saving, savingSub]);

  const acceptedDisplay = displayCounts.accepted;
  const totalDisplay = displayCounts.total;

  const attendancePercentage =
    totalDisplay > 0 ? Math.round((acceptedDisplay / totalDisplay) * 100) : 0;

  const handleAskConfirm = (target: AttStatus) => {
    if (saving) return;
    setConfirmTarget(target);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;

    // If user is accepting/pending AND currently has a sub request, clear it first
    if (
      (confirmTarget === 'accepted' || confirmTarget === 'pending') &&
      needsSub
    ) {
      await updateSubRequest(false, '');
    }

    // --- Optimistic: update the numbers shown on this screen immediately ---
    setDisplayCounts((prev) => {
      const total = prev.total || (counts.total ?? 0);
      const prevAccepted = prev.accepted || (counts.accepted ?? 0);

      // We treat "sub requested" as NOT confirmed.
      const wasAccepted = mine === 'accepted' && !needsSub;
      const willBeAccepted = confirmTarget === 'accepted'; // sub is cleared above if needed

      let nextAccepted = prevAccepted;

      if (wasAccepted && !willBeAccepted) nextAccepted -= 1;
      if (!wasAccepted && willBeAccepted) nextAccepted += 1;

      // clamp
      if (nextAccepted < 0) nextAccepted = 0;
      if (total > 0 && nextAccepted > total) nextAccepted = total;

      return { accepted: nextAccepted, total };
    });

    // --- Optimistic: compute next band booked state ---
    if (onLocalBookedChange) {
      const total = counts.total ?? 0;
      const prevAccepted = counts.accepted ?? 0;

      const wasAccepted = mine === 'accepted' && !needsSub;
      const willBeAccepted = confirmTarget === 'accepted' && !needsSub; // (needsSub is cleared above, but keep safe)

      let nextAccepted = prevAccepted;

      if (wasAccepted && !willBeAccepted) nextAccepted -= 1;
      if (!wasAccepted && willBeAccepted) nextAccepted += 1;

      const optimisticIsBooked = total > 0 && nextAccepted === total;
      onLocalBookedChange(optimisticIsBooked);
    }

    await update(confirmTarget);

    setConfirmTarget(null);
  };

  const handleCancel = () => {
    setConfirmTarget(null);
  };

  const handleOpenSubPopup = () => {
    if (savingSub) return;
    setShowSubPopup(true);
  };

  const handleConfirmSub = async (reason: string) => {
    //  mark as declined + needs sub (atomic on server side via hook)
    await updateSubRequest(true, reason);

    // optimistic: if I was accepted, reduce confirmed by 1 immediately
    setDisplayCounts((prev) => {
      if (mine !== 'accepted') return prev;
      const nextAccepted = Math.max(0, prev.accepted - 1);
      return { ...prev, accepted: nextAccepted };
    });

    setShowSubPopup(false);
    setShowSubToast(true);
  };

  const handleCancelSub = () => {
    setShowSubPopup(false);
  };

  const handleClearSub = async () => {
    await updateSubRequest(false, '');
  };

  React.useEffect(() => {
    if (!onAttendanceSummaryChange) return;

    onAttendanceSummaryChange({
      accepted: counts.accepted,
      total: counts.total,
      mine,
      hydrated,
    });
  }, [
    counts.accepted,
    counts.total,
    mine,
    hydrated,
    onAttendanceSummaryChange,
  ]);

  return (
    <>
      <div
        style={{
          padding: '20px 16px 80px 16px',
          minHeight: '100%',
          color: '#E5E7EB',
          background: '#050509',
        }}
      >
        {/* error */}
        {error && (
          <div
            style={{
              borderRadius: 12,
              border: '2px solid #EF4444',
              padding: 16,
              fontSize: 14,
              background: 'rgba(239, 68, 68, 0.1)',
              marginBottom: 20,
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0, fontWeight: 600, color: '#FCA5A5' }}>
                {error}
              </p>
            </IonText>
          </div>
        )}

        {/* STATS HEADER */}
        <div
          style={{
            background: 'rgba(52, 211, 153, 0.05)',
            border: '2px solid rgba(52, 211, 153, 0.2)',
            borderRadius: 16,
            padding: '24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: '#34D399',
                lineHeight: 1,
                marginBottom: 8,
                letterSpacing: -1,
              }}
            >
              {acceptedDisplay}/{totalDisplay}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Confirmed
            </div>
          </div>

          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `conic-gradient(
              #34D399 0% ${attendancePercentage}%,
              rgba(52, 211, 153, 0.1) ${attendancePercentage}% 100%
            )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#050509',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: '#34D399',
              }}
            >
              {attendancePercentage}%
            </div>
          </div>
        </div>

        {/* YOUR STATUS CARD */}
        <div
          style={{
            background: '#0F172A',
            border: `2px solid ${
              hasSubRequested
                ? 'rgba(59, 130, 246, 0.3)'
                : isAccepted
                ? 'rgba(52, 211, 153, 0.3)'
                : isDeclined
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(251, 191, 36, 0.3)'
            }`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: hasSubRequested
                  ? 'rgba(59, 130, 246, 0.15)'
                  : isAccepted
                  ? 'rgba(52, 211, 153, 0.15)'
                  : isDeclined
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(251, 191, 36, 0.15)',
                border: `2px solid ${
                  hasSubRequested
                    ? 'rgba(59, 130, 246, 0.4)'
                    : isAccepted
                    ? 'rgba(52, 211, 153, 0.4)'
                    : isDeclined
                    ? 'rgba(239, 68, 68, 0.4)'
                    : 'rgba(251, 191, 36, 0.4)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={
                  hasSubRequested
                    ? personOutline
                    : isAccepted
                    ? checkmarkCircleOutline
                    : isDeclined
                    ? closeCircleOutline
                    : helpCircleOutline
                }
                style={{
                  fontSize: 24,
                  color: hasSubRequested
                    ? '#3B82F6'
                    : isAccepted
                    ? '#34D399'
                    : isDeclined
                    ? '#EF4444'
                    : '#FBBf24',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Your Status
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: hasSubRequested
                    ? '#93C5FD'
                    : isAccepted
                    ? '#34D399'
                    : isDeclined
                    ? '#FCA5A5'
                    : '#FBBf24',
                }}
              >
                {!hydrated
                  ? 'Checking…'
                  : hasSubRequested
                  ? 'Sub Requested'
                  : isAccepted
                  ? "I'm In! ✓"
                  : isDeclined
                  ? "Can't Attend"
                  : 'Not Sure Yet'}
              </div>
            </div>
          </div>

          {hasSubRequested && subReason && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Your Reason:
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#D1D5DB',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                {subReason}
              </div>
            </div>
          )}
        </div>

        {/* CAN YOU MAKE THE SHOW? */}
        <div
          style={{
            background: '#0F172A',
            border: '2px solid rgba(52, 211, 153, 0.2)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 700,
              color: '#34D399',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Can You Make It?
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* First row: Yes and Not Sure */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                disabled={saving || !hydrated}
                onClick={() => handleAskConfirm('accepted')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: isAccepted
                    ? '2px solid #34D399'
                    : '2px solid rgba(52, 211, 153, 0.2)',
                  background: isAccepted ? '#34D399' : '#0F172A',
                  color: isAccepted ? '#000000' : '#34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: !hydrated || saving ? 0.5 : 1,
                }}
              >
                {saving && isAccepted && (
                  <IonSpinner
                    name="crescent"
                    style={{ width: 16, height: 16 }}
                  />
                )}
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{ fontSize: 20 }}
                />
                Yes, I'm In
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleAskConfirm('pending')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: isPending
                    ? '2px solid #FBBf24'
                    : '2px solid rgba(251, 191, 36, 0.2)',
                  background: isPending ? 'rgba(251, 191, 36, 0.2)' : '#0F172A',
                  color: isPending ? '#FBBf24' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving && isPending && (
                  <IonSpinner
                    name="crescent"
                    style={{ width: 16, height: 16 }}
                  />
                )}
                <IonIcon icon={helpCircleOutline} style={{ fontSize: 20 }} />
                Not Sure
              </button>
            </div>

            {/* Second row: Can't Make It - full width */}
            {/* Second row: Can't Make It - full width */}
            <button
              type="button"
              disabled={saving || !hydrated || isAdmin} // ADD isAdmin here
              onClick={() => handleAskConfirm('declined')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                textAlign: 'center',
                cursor: isAdmin ? 'not-allowed' : 'pointer', // ADD this
                transition: 'all 0.15s ease',
                border: isDeclined
                  ? '2px solid #EF4444'
                  : '2px solid rgba(239, 68, 68, 0.2)',
                background: isDeclined ? 'rgba(239, 68, 68, 0.2)' : '#0F172A',
                color: isDeclined ? '#FCA5A5' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isAdmin ? 0.4 : !hydrated || saving ? 0.5 : 1, // UPDATE this
              }}
            >
              {saving && isDeclined && (
                <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
              )}
              <IonIcon icon={closeCircleOutline} style={{ fontSize: 20 }} />
              Can't Make It
            </button>

            {/* ADD helper text below the button */}
            {isAdmin && (
              <p
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  textAlign: 'center',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                As a band admin, you cannot decline events. Request a sub if you
                can't attend.
              </p>
            )}
          </div>
        </div>

        {/* DO YOU NEED A SUB? */}
        <div
          style={{
            background: '#0F172A',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 700,
              color: '#3B82F6',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Need a Substitute?
          </h3>

          <button
            type="button"
            onClick={handleOpenSubPopup}
            disabled={savingSub || isDeclined}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
              cursor: isDeclined ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: isDeclined ? 0.4 : 1,
              border: needsSub
                ? '2px solid #3B82F6'
                : '2px solid rgba(59, 130, 246, 0.2)',
              background: needsSub ? '#3B82F6' : '#0F172A',
              color: needsSub ? '#000000' : '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {savingSub && (
              <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
            )}
            <IonIcon icon={personOutline} style={{ fontSize: 20 }} />
            {needsSub ? 'Update Sub Request' : 'Request a Sub'}
          </button>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 13,
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Your band leader will be notified automatically
          </p>

          {needsSub && (
            <button
              type="button"
              disabled={savingSub}
              onClick={handleClearSub}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '14px 16px',
                borderRadius: 12,
                border: '2px solid rgba(148, 163, 184, 0.2)',
                background: '#0F172A',
                color: '#94A3B8',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Clear Sub Request
            </button>
          )}
        </div>

        {/* CONFIRMATION POPUP */}
        {confirmTarget && (
          <ConfirmStatusPopup
            target={confirmTarget}
            saving={saving}
            onCancel={() => setConfirmTarget(null)}
            onConfirm={handleConfirm}
          />
        )}

        {/* SUB REQUEST POPUP */}
        {showSubPopup && (
          <SubRequestPopup
            initialReason={subReason}
            saving={savingSub}
            onCancel={() => setShowSubPopup(false)}
            onConfirm={handleConfirmSub}
          />
        )}
      </div>

      {/* TOAST */}
      <IonToast
        isOpen={showSubToast}
        onDidDismiss={() => setShowSubToast(false)}
        message="✓ Sub request sent to your band"
        duration={2500}
        position="top"
        style={
          {
            '--background': '#34D399',
            '--color': '#000000',
            '--border-radius': '12px',
            fontWeight: 700,
          } as any
        }
      />
    </>
  );
}

/* ---------- CONFIRMATION POPUP ---------- */

function ConfirmStatusPopup({
  target,
  saving,
  onCancel,
  onConfirm,
}: {
  target: AttStatus;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isYes = target === 'accepted';
  const isPending = target === 'pending';
  const isDeclined = target === 'declined';

  const title = isYes
    ? 'Confirm Attendance'
    : isDeclined
    ? 'Decline Event'
    : 'Mark as Pending';

  const body = isYes
    ? "You'll be marked as attending this show."
    : isDeclined
    ? "You'll be marked as unable to attend this show."
    : "You'll be marked as pending for this show.";

  const icon = isYes
    ? checkmarkCircleOutline
    : isDeclined
    ? closeCircleOutline
    : helpCircleOutline;

  const borderColor = isYes
    ? 'rgba(52, 211, 153, 0.4)'
    : isDeclined
    ? 'rgba(239, 68, 68, 0.4)'
    : 'rgba(251, 191, 36, 0.4)';

  const bgGradient = isYes
    ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))'
    : isDeclined
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
    : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))';

  const iconBorder = isYes
    ? '1px solid rgba(52, 211, 153, 0.4)'
    : isDeclined
    ? '1px solid rgba(239, 68, 68, 0.4)'
    : '1px solid rgba(251, 191, 36, 0.4)';

  const iconColor = isYes
    ? 'rgba(52, 211, 153, 0.95)'
    : isDeclined
    ? 'rgba(252, 165, 165, 0.95)'
    : 'rgba(251, 191, 36, 0.95)';

  const buttonBorder = isYes
    ? '1px solid rgba(52, 211, 153, 0.5)'
    : isDeclined
    ? '1px solid rgba(239, 68, 68, 0.5)'
    : '1px solid rgba(251, 191, 36, 0.5)';

  const buttonBg = isYes
    ? 'rgba(52, 211, 153, 0.95)'
    : isDeclined
    ? 'rgba(239, 68, 68, 0.95)'
    : 'rgba(251, 191, 36, 0.95)';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
          border: `1px solid ${borderColor}`,
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: bgGradient,
            border: iconBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <IonIcon
            icon={icon}
            style={{
              fontSize: 28,
              color: iconColor,
            }}
          />
        </div>

        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 20,
            fontWeight: 800,
            color: '#f9fafb',
            letterSpacing: -0.5,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 20,
            fontSize: 15,
            color: '#9ca3af',
            lineHeight: 1.5,
          }}
        >
          {body}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: buttonBorder,
              background: buttonBg,
              color: '#000000',
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {saving && (
              <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
            )}
            Confirm
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#9ca3af',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- SUB REQUEST POPUP ---------- */

function SubRequestPopup({
  initialReason,
  saving,
  onCancel,
  onConfirm,
}: {
  initialReason: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState(initialReason ?? '');

  React.useEffect(() => {
    setReason(initialReason ?? '');
  }, [initialReason]);

  const handleConfirmClick = () => {
    onConfirm(reason);
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <IonIcon
            icon={personOutline}
            style={{
              fontSize: 28,
              color: 'rgba(147, 197, 253, 0.95)',
            }}
          />
        </div>

        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 20,
            fontWeight: 800,
            color: '#f9fafb',
            letterSpacing: -0.5,
          }}
        >
          Request a Substitute
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: 14,
            color: '#9ca3af',
            lineHeight: 1.5,
          }}
        >
          Let your band know why you need a sub so they can arrange coverage.
        </p>

        <div style={{ marginBottom: 20 }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g., Out of town, work conflict, family event..."
            style={{
              width: '100%',
              borderRadius: 12,
              padding: 14,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#e5e7eb',
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirmClick}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.5)',
              background: 'rgba(59, 130, 246, 0.95)',
              color: '#000000',
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'center',
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {saving && (
              <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
            )}
            Send Request
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#9ca3af',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

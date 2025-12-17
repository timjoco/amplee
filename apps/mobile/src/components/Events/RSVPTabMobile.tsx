/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner, IonText, IonToast } from '@ionic/react';
import {
  checkmarkCircleOutline,
  helpCircleOutline,
  personOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useAttendance, type AttStatus } from '../../hooks/useAttendance';

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
  const [confirmTarget, setConfirmTarget] = React.useState<AttStatus | null>(
    null
  );

  const hasSubRequested = needsSub;
  const isAccepted = hydrated && !hasSubRequested && mine === 'accepted';
  const isPending = hydrated && !hasSubRequested && mine === 'pending';

  // -------------------------
  // Optimistic display counts
  // -------------------------
  const [displayCounts, setDisplayCounts] = React.useState(() => ({
    accepted: 0,
    total: 0,
  }));

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
    await updateSubRequest(true, reason);

    // If I was "accepted", requesting a sub should reduce confirmed by 1 immediately
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

    // If my attendance is accepted, clearing sub restores confirmed +1 immediately
    setDisplayCounts((prev) => {
      if (mine !== 'accepted') return prev;
      const total = prev.total || 0;
      const nextAccepted =
        total > 0 ? Math.min(total, prev.accepted + 1) : prev.accepted + 1;
      return { ...prev, accepted: nextAccepted };
    });
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
          padding: '16px 16px 80px 16px',
          minHeight: '100%',
          color: '#E5E7EB',
          position: 'relative',
          background:
            'linear-gradient(180deg, rgba(5,5,9,0) 0%, rgba(5,5,9,0.3) 100%)',
        }}
      >
        {/* error */}
        {error && (
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(248,113,113,0.4)',
              padding: 16,
              fontSize: 14,
              background:
                'linear-gradient(135deg, rgba(127, 29, 29, 0.2), rgba(127, 29, 29, 0.1))',
              marginBottom: 16,
              backdropFilter: 'blur(10px)',
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </IonText>
          </div>
        )}

        {/* STATS HEADER */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.04))',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'rgba(52, 211, 153, 0.95)',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {acceptedDisplay}/{totalDisplay}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Confirmed
            </div>
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: `conic-gradient(
                rgba(52, 211, 153, 0.8) 0% ${attendancePercentage}%,
                rgba(15, 23, 42, 0.8) ${attendancePercentage}% 100%
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: 'rgba(52, 211, 153, 0.95)',
              }}
            >
              {attendancePercentage}%
            </div>
          </div>
        </div>

        {/* YOUR STATUS CARD */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: hasSubRequested
              ? '1px solid rgba(59, 130, 246, 0.4)'
              : isAccepted
              ? '1px solid rgba(52, 211, 153, 0.4)'
              : '1px solid rgba(251, 191, 36, 0.4)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: hasSubRequested
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))'
                  : isAccepted
                  ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))'
                  : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                border: hasSubRequested
                  ? '1px solid rgba(59, 130, 246, 0.4)'
                  : isAccepted
                  ? '1px solid rgba(52, 211, 153, 0.4)'
                  : '1px solid rgba(251, 191, 36, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={
                  hasSubRequested
                    ? personOutline
                    : isAccepted
                    ? checkmarkCircleOutline
                    : helpCircleOutline
                }
                style={{
                  fontSize: 20,
                  color: hasSubRequested
                    ? 'rgba(59, 130, 246, 0.95)'
                    : isAccepted
                    ? 'rgba(52, 211, 153, 0.95)'
                    : 'rgba(251, 191, 36, 0.95)',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Your Status
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: hasSubRequested
                    ? 'rgba(147, 197, 253, 0.95)'
                    : isAccepted
                    ? 'rgba(52, 211, 153, 0.95)'
                    : 'rgba(251, 191, 36, 0.95)',
                }}
              >
                {!hydrated
                  ? 'Checking…'
                  : hasSubRequested
                  ? 'Sub Requested'
                  : isAccepted
                  ? "I'm In! ✓"
                  : 'Not Sure Yet'}
              </div>
            </div>
          </div>

          {hasSubRequested && subReason && (
            <div
              style={{
                padding: 12,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(147, 197, 253, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Your Reason:
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#d1d5db',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
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
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: 'rgba(52, 211, 153, 0.95)',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Can You Make It?
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={saving || !hydrated}
              onClick={() => handleAskConfirm('accepted')}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isAccepted
                  ? '2px solid rgba(52, 211, 153, 0.6)'
                  : '1px solid rgba(52, 211, 153, 0.3)',
                background: isAccepted
                  ? 'rgba(52, 211, 153, 0.95)'
                  : 'rgba(15, 23, 42, 0.8)',
                color: isAccepted ? '#000000' : 'rgba(52, 211, 153, 0.95)',
                boxShadow: isAccepted
                  ? '0 8px 20px rgba(52, 211, 153, 0.2)'
                  : '0 4px 12px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!isAccepted && hydrated && !saving) {
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(52, 211, 153, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAccepted) {
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(0, 0, 0, 0.4)';
                }
              }}
            >
              {saving && isAccepted && (
                <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
              )}
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 18 }} />
              Yes, I'm In
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleAskConfirm('pending')}
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isPending
                  ? '2px solid rgba(251, 191, 36, 0.6)'
                  : '1px solid rgba(148, 163, 184, 0.3)',
                background: isPending
                  ? 'rgba(251, 191, 36, 0.2)'
                  : 'rgba(15, 23, 42, 0.8)',
                color: isPending
                  ? 'rgba(254, 243, 199, 0.95)'
                  : 'rgba(148, 163, 184, 0.95)',
                boxShadow: isPending
                  ? '0 8px 20px rgba(251, 191, 36, 0.15)'
                  : '0 4px 12px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!isPending && !saving) {
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(251, 191, 36, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPending) {
                  e.currentTarget.style.borderColor =
                    'rgba(148, 163, 184, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(0, 0, 0, 0.4)';
                }
              }}
            >
              {saving && isPending && (
                <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
              )}
              <IonIcon icon={helpCircleOutline} style={{ fontSize: 18 }} />
              Not Sure
            </button>
          </div>
        </div>

        {/* DO YOU NEED A SUB? */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 16,
            padding: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: 'rgba(147, 197, 253, 0.95)',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Need a Substitute?
            </h3>
          </div>

          <button
            type="button"
            onClick={handleOpenSubPopup}
            disabled={savingSub}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: needsSub
                ? '2px solid rgba(59, 130, 246, 0.6)'
                : '1px solid rgba(59, 130, 246, 0.3)',
              background: needsSub
                ? 'rgba(59, 130, 246, 0.95)'
                : 'rgba(15, 23, 42, 0.8)',
              color: needsSub ? '#000000' : 'rgba(147, 197, 253, 0.95)',
              boxShadow: needsSub
                ? '0 8px 20px rgba(59, 130, 246, 0.2)'
                : '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!savingSub) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 8px 20px rgba(59, 130, 246, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = needsSub
                ? '0 8px 20px rgba(59, 130, 246, 0.2)'
                : '0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
          >
            {savingSub && (
              <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
            )}
            <IonIcon icon={personOutline} style={{ fontSize: 18 }} />
            {needsSub ? 'Update Sub Request' : 'Request a Sub'}
          </button>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 13,
              color: '#9ca3af',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Your band leader will be notified automatically
          </p>

          {/* Optional: show a "Clear sub request" action */}
          {needsSub && (
            <button
              type="button"
              disabled={savingSub}
              onClick={handleClearSub}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
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
            '--background': 'rgba(52, 211, 153, 0.95)',
            '--color': '#000000',
            '--border-radius': '12px',
            fontWeight: 600,
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

  const title = isYes ? 'Confirm Attendance' : 'Mark as Pending';
  const body = isYes
    ? "You'll be marked as attending this show."
    : "You'll be marked as pending for this show.";

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
          border: isYes
            ? '1px solid rgba(52, 211, 153, 0.4)'
            : '1px solid rgba(251, 191, 36, 0.4)',
          padding: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isYes
              ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))'
              : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
            border: isYes
              ? '1px solid rgba(52, 211, 153, 0.4)'
              : '1px solid rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <IonIcon
            icon={isYes ? checkmarkCircleOutline : helpCircleOutline}
            style={{
              fontSize: 28,
              color: isYes
                ? 'rgba(52, 211, 153, 0.95)'
                : 'rgba(251, 191, 36, 0.95)',
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
              border: isYes
                ? '1px solid rgba(52, 211, 153, 0.5)'
                : '1px solid rgba(251, 191, 36, 0.5)',
              background: isYes
                ? 'rgba(52, 211, 153, 0.95)'
                : 'rgba(251, 191, 36, 0.95)',
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

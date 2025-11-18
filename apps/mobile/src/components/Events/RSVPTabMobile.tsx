// apps/mobile/src/components/Events/RSVPTabMobile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonSpinner, IonText, IonToast } from '@ionic/react';
import * as React from 'react';
import { useAttendance, type AttStatus } from '../../hooks/useAttendance';

export default function RSVPTabMobile({ eventId }: { eventId: string }) {
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
  } = useAttendance(eventId);

  const [showSubPopup, setShowSubPopup] = React.useState(false);
  const [showSubToast, setShowSubToast] = React.useState(false);

  // confirmation popup state for RSVP
  const [confirmTarget, setConfirmTarget] = React.useState<AttStatus | null>(
    null
  );

  const hasSubRequested = needsSub;
  const isAccepted = !hasSubRequested && mine === 'accepted';
  const isPending = !hasSubRequested && mine === 'pending';

  const primaryButtonBase: React.CSSProperties = {
    width: '100%',
    paddingBlock: 10,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid rgba(216,180,254,0.9)',
    cursor: 'pointer',
  };

  const secondaryButtonBase: React.CSSProperties = {
    width: '100%',
    paddingBlock: 10,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    border: '1px solid rgba(148,163,184,0.8)',
    cursor: 'pointer',
    background: 'rgba(15,23,42,0.9)',
    color: 'rgba(209,213,219,0.9)',
  };

  const handleAskConfirm = (target: AttStatus) => {
    if (saving) return;
    setConfirmTarget(target);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;

    // If user is accepting AND currently has a sub request:
    if (confirmTarget === 'accepted' && needsSub) {
      await updateSubRequest(false, '');
    }

    // If user is switching to pending while a sub is requested:
    if (confirmTarget === 'pending' && needsSub) {
      await updateSubRequest(false, '');
    }

    // Apply the RSVP
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
    setShowSubPopup(false);
    setShowSubToast(true);
  };

  const handleCancelSub = () => {
    setShowSubPopup(false);
  };

  const handleClearSub = async () => {
    await updateSubRequest(false, '');
  };

  return (
    <>
      <div
        style={{
          padding: 16,
          paddingBottom: 24,
          minHeight: '100%',
          color: '#E5E7EB',
          position: 'relative',
        }}
      >
        {/* error */}
        {error && (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(248,113,113,0.7)',
              padding: 10,
              fontSize: 13,
              background: 'rgba(30,7,15,0.9)',
              marginBottom: 16,
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0 }}>{error}</p>
            </IonText>
          </div>
        )}

        {/* CARD 1: CAN YOU MAKE THE SHOW? */}
        <div
          style={{
            borderRadius: 18,
            background:
              'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
            border: '1px solid rgba(88,28,135,0.7)',
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.04,
                textTransform: 'uppercase',
                color: 'rgba(237,233,254,0.96)',
              }}
            >
              Can you make the show?
            </p>
          </div>

          {/* buttons row */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 6,
            }}
          >
            {/* YES / ACCEPTED */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAskConfirm('accepted')}
              style={{
                ...primaryButtonBase,
                background: isAccepted
                  ? 'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(107,58,157,0.98))'
                  : 'rgba(17,24,39,0.95)',
                color: isAccepted ? '#F5F3FF' : 'rgba(196,181,253,0.85)',
                opacity: saving && isAccepted ? 0.8 : 1,
              }}
            >
              {saving && isAccepted && (
                <IonSpinner
                  name="dots"
                  style={{ width: 14, height: 14, marginRight: 6 }}
                />
              )}
              Yes, I&apos;m in
            </button>

            {/* PENDING */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAskConfirm('pending')}
              style={{
                ...secondaryButtonBase,
                border: isPending
                  ? '1px solid rgba(148,163,184,0.95)'
                  : '1px solid rgba(107,114,128,0.7)',
                background: isPending
                  ? 'rgba(15,23,42,0.98)'
                  : 'rgba(17,24,39,0.9)',
              }}
            >
              {saving && isPending && (
                <IonSpinner
                  name="dots"
                  style={{ width: 14, height: 14, marginRight: 6 }}
                />
              )}
              Not sure
            </button>
          </div>

          {/* small status + counts + sub chip */}
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'rgba(156,163,175,0.95)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Your status:{' '}
                <strong style={{ color: '#EDE9FE' }}>
                  {hasSubRequested ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingInline: 8,
                        paddingBlock: 3,
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.04,
                        textTransform: 'uppercase',
                        background: 'rgba(37,99,235,0.18)',
                        border: '1px solid rgba(59,130,246,0.85)',
                        color: '#BFDBFE',
                        whiteSpace: 'nowrap',
                      }}
                      title="You requested a sub for this event"
                    >
                      Sub requested
                    </span>
                  ) : isAccepted ? (
                    'Yes, you are in'
                  ) : (
                    'Marked as pending'
                  )}
                </strong>
              </span>
            </div>

            <div style={{ marginTop: 2 }}>
              Band RSVP:{' '}
              <strong style={{ color: '#C4B5FD' }}>
                {counts.accepted}/{counts.total}
              </strong>{' '}
              marked as &quot;Yes&quot;
            </div>
          </div>
        </div>

        {/* CARD 2: DO YOU NEED A SUB? */}
        <div
          style={{
            borderRadius: 18,
            background:
              'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
            border: '1px solid rgba(88,28,135,0.85)',
            padding: 14,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.04,
                textTransform: 'uppercase',
                color: 'rgba(237,233,254,0.96)',
              }}
            >
              Do you need a sub?
            </p>
          </div>

          {/* sub request button (opens popup, no chip here) */}
          <button
            type="button"
            onClick={handleOpenSubPopup}
            disabled={savingSub}
            style={{
              ...primaryButtonBase,
              border: '1px solid rgba(37,99,235,0.9)',
              background: needsSub
                ? 'linear-gradient(135deg, rgba(59,130,246,0.96), rgba(37,99,235,0.98))'
                : 'rgba(15,23,42,0.98)',
              color: needsSub ? '#EFF6FF' : 'rgba(209,213,219,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: savingSub ? 0.85 : 1,
            }}
          >
            {savingSub && (
              <IonSpinner
                name="dots"
                style={{ width: 14, height: 14, marginRight: 2 }}
              />
            )}
            {needsSub ? 'Update sub request' : 'Request a sub'}
          </button>

          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'rgba(156,163,175,0.95)',
            }}
          >
            Your band leader will be notified automatically{' '}
          </p>
        </div>

        {/* DARK CONFIRMATION POPUP (RSVP) */}
        {confirmTarget && (
          <ConfirmStatusPopup
            target={confirmTarget}
            saving={saving}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        )}

        {/* DARK SUB REQUEST POPUP */}
        {showSubPopup && (
          <SubRequestPopup
            initialReason={subReason}
            saving={savingSub}
            onCancel={handleCancelSub}
            onConfirm={handleConfirmSub}
          />
        )}
      </div>

      {/* TOAST: sub request sent */}
      <IonToast
        isOpen={showSubToast}
        onDidDismiss={() => setShowSubToast(false)}
        message="Sub request sent to the band."
        duration={2200}
        position="top"
        color="tertiary"
      />
    </>
  );
}

/* ---------- DARK POPUP CARD: RSVP STATUS ---------- */

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

  const title = 'Confirm RSVP';
  const body = isYes
    ? 'Mark yourself as a YES for this show?'
    : 'Mark yourself as PENDING for this show?';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 18,
          background: 'linear-gradient(160deg, #02010a, #050509 55%, #050111)',
          border: '1px solid rgba(88,28,135,0.85)',
          padding: 16,
          boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 6,
            fontSize: 16,
            fontWeight: 700,
            color: '#F5F3FF',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontSize: 14,
            color: 'rgba(209,213,219,0.96)',
          }}
        >
          {body}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            style={{
              width: '100%',
              paddingBlock: 10,
              borderRadius: 999,
              border: '1px solid rgba(216,180,254,0.9)',
              background:
                'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(107,58,157,0.98))',
              color: '#F9FAFB',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
              opacity: saving ? 0.85 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {saving && (
              <IonSpinner
                name="dots"
                style={{ width: 14, height: 14, marginRight: 2 }}
              />
            )}
            Confirm
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            style={{
              width: '100%',
              paddingBlock: 10,
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.8)',
              background: 'rgba(15,23,42,0.95)',
              color: 'rgba(209,213,219,0.96)',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- DARK POPUP CARD: SUB REQUEST REASON ---------- */

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
        background: 'rgba(0,0,0,0.55)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 18,
          background: 'linear-gradient(165deg, #02010a, #050509 55%, #020617)',
          border: '1px solid rgba(37,99,235,0.9)',
          padding: 16,
          boxShadow: '0 22px 45px rgba(0,0,0,0.95)',
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 6,
            fontSize: 16,
            fontWeight: 700,
            color: '#EFF6FF',
          }}
        >
          Request a sub
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 13,
            color: 'rgba(191,219,254,0.95)',
          }}
        >
          Let your band know what&apos;s up so they can line up the right
          coverage.
        </p>

        <div
          style={{
            marginBottom: 14,
          }}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex: I’m out of town that weekend / work conflict / family event…"
            style={{
              width: '100%',
              borderRadius: 14,
              padding: 10,
              border: '1px solid rgba(55,65,81,0.9)',
              background: 'rgba(15,23,42,0.98)',
              color: '#E5E7EB',
              fontSize: 13,
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirmClick}
            style={{
              width: '100%',
              paddingBlock: 10,
              borderRadius: 999,
              border: '1px solid rgba(59,130,246,0.95)',
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.96), rgba(37,99,235,0.98))',
              color: '#EFF6FF',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
              opacity: saving ? 0.85 : 1,
            }}
          >
            {saving && (
              <IonSpinner
                name="dots"
                style={{ width: 14, height: 14, marginRight: 2 }}
              />
            )}
            Send sub request
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            style={{
              width: '100%',
              paddingBlock: 10,
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.8)',
              background: 'rgba(15,23,42,0.95)',
              color: 'rgba(209,213,219,0.96)',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

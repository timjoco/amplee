// apps/mobile/src/components/Bands/BandTitleMenuMobile.tsx
import {
  IonAlert,
  IonButton as IonBtn,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronForwardOutline,
  logOutOutline,
  personAddOutline,
  settingsOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Props = {
  bandId: string;
  bandName?: string;
  onInvite?: () => void;
  isAdmin?: boolean;
  // Optional: compact button label instead of a big header
  asButton?: boolean;
};

export default function BandTitleMenuMobile({
  bandId,
  bandName = 'Band',
  onInvite,
  isAdmin = false,
  asButton = true,
}: Props) {
  const nav = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const onConfirmLeave = async () => {
    try {
      setLeaving(true);
      setErr(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in.');

      const { error } = await supabase
        .from('band_members')
        .delete()
        .eq('band_id', bandId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      setConfirmLeave(false);
      setOpen(false);
      // after leave, send them home
      nav('/home', { replace: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to leave band');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <>
      {/* Trigger: make the band name clickable */}
      {asButton ? (
        <IonButton
          fill="clear"
          onClick={() => setOpen(true)}
          style={{
            paddingInline: 8,
            height: 40,
            fontWeight: 900,
            letterSpacing: 0.2,
            color: 'var(--ion-text-color, #fff)',
          }}
        >
          {bandName}
          <IonIcon icon={chevronForwardOutline} slot="end" />
        </IonButton>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${bandName} menu`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: 8,
            background: 'transparent',
            border: 0,
            color: 'inherit',
            fontWeight: 900,
            letterSpacing: 0.2,
            fontSize: 18,
          }}
        >
          {bandName}
          <IonIcon icon={chevronForwardOutline} />
        </button>
      )}

      {/* Bottom Sheet */}
      <IonModal
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        initialBreakpoint={0.85}
        breakpoints={[0, 0.5, 0.85, 1]}
        handleBehavior="cycle"
        // keep content crisp and on-brand
        style={
          {
            '--background': '#1A1B1F',
            '--ion-toolbar-background': '#1A1B1F',
            '--ion-text-color': '#fff',
          } as React.CSSProperties
        }
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ fontWeight: 900 }}>{bandName}</IonTitle>
            <IonButtons slot="end">
              <IonBtn onClick={() => setOpen(false)}>
                <IonIcon icon={chevronDownOutline} />
              </IonBtn>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonList inset={true}>
            {/* Invite (admin only) */}
            {isAdmin && onInvite && (
              <IonItem
                button
                detail={false}
                onClick={() => {
                  setOpen(false);
                  onInvite();
                }}
                style={{ borderRadius: 12, marginBlock: 6 }}
              >
                <IonIcon slot="start" icon={personAddOutline} />
                <IonLabel>
                  <h2 style={{ margin: 0, fontWeight: 800 }}>
                    Invite Band Members
                  </h2>
                </IonLabel>
              </IonItem>
            )}

            {/* Settings (admin only) */}
            {isAdmin && (
              <IonItem
                button
                detail={true}
                onClick={() => {
                  setOpen(false);
                  nav(`/bands/${bandId}/settings`);
                }}
                style={{ borderRadius: 12, marginBlock: 6 }}
              >
                <IonIcon slot="start" icon={settingsOutline} />
                <IonLabel>
                  <h2 style={{ margin: 0, fontWeight: 800 }}>Band Settings</h2>
                </IonLabel>
              </IonItem>
            )}

            {/* Leave band */}
            <IonItem
              button
              detail={false}
              color="danger"
              onClick={() => setConfirmLeave(true)}
              style={{ borderRadius: 12, marginBlock: 6 }}
            >
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>
                <h2 style={{ margin: 0, fontWeight: 800 }}>Leave Band</h2>
              </IonLabel>
            </IonItem>
          </IonList>

          {err ? (
            <div
              style={{
                margin: 16,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(244,67,54,0.35)',
                background: 'rgba(244,67,54,0.08)',
                color: '#fff',
              }}
            >
              {err}
            </div>
          ) : null}
        </IonContent>
      </IonModal>

      {/* Confirm Leave */}
      <IonAlert
        isOpen={confirmLeave}
        header={`Leave “${bandName}”?`}
        message="You’ll lose access to this band’s events and settings."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setConfirmLeave(false),
          },
          {
            text: leaving ? 'Leaving…' : 'Leave',
            role: 'destructive',
            handler: onConfirmLeave,
          },
        ]}
        onDidDismiss={() => !leaving && setConfirmLeave(false)}
      />
    </>
  );
}

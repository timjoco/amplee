/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonActionSheet,
  IonButton,
  IonIcon,
  useIonAlert,
  useIonLoading,
} from '@ionic/react';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Props = {
  bandId: string;
  bandName?: string;
  onInvite?: () => void;
  isAdmin?: boolean;
};

export default function BandTitleMenuMobile({
  bandId,
  bandName,
  onInvite,
  isAdmin = false,
}: Props) {
  const nav = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [presentAlert] = useIonAlert();
  const [presentLoading, dismissLoading] = useIonLoading();

  async function onConfirmLeave() {
    await presentLoading('Leaving…');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in.');

      const { error } = await supabase
        .from('band_members')
        .delete()
        .eq('band_id', bandId)
        .eq('user_id', user.id);

      if (error) throw error;
      nav('/home');
    } catch (e: any) {
      presentAlert({
        header: 'Failed to leave band',
        message: e?.message ?? 'Try again.',
        buttons: ['OK'],
      });
    } finally {
      dismissLoading();
    }
  }

  return (
    <>
      <IonButton
        fill="clear"
        onClick={() => setOpen(true)}
        style={{ fontWeight: 900 }}
      >
        {bandName ?? 'Band'}
        <IonIcon slot="end" name="chevronDownOutline" />
      </IonButton>

      <IonActionSheet
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        header={bandName}
        buttons={[
          ...(isAdmin && onInvite
            ? [
                {
                  text: 'Invite Band Members',
                  // icon: personAddOutline,
                  handler: () => onInvite(),
                },
              ]
            : []),
          ...(isAdmin
            ? [
                {
                  text: 'Band Settings',
                  // icon: settingsOutline,
                  handler: () => nav(`/bands/${bandId}/settings`),
                },
              ]
            : []),
          ...(!isAdmin
            ? [
                {
                  text: 'Leave Band',
                  role: 'destructive',
                  // icon: logOutOutline,
                  handler: () => onConfirmLeave(),
                },
              ]
            : []),
          { text: 'Cancel', role: 'cancel' },
        ]}
      />
    </>
  );
}

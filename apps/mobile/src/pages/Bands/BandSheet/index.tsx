import {
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { BandHeader } from './components/BandHeader';
import { DashboardGrid } from './components/DashboardGrid';
import { NextEventCard } from './components/NextEventCard';
import { useBandSheet } from './hooks/useBandSheet';

export default function BandSheetMobile() {
  const navigate = useNavigate();
  const {
    bandId,
    loading,
    error,
    bandName,
    bandAvatarUrl,
    bandAvatarUpdatedAt,
    myRole,
    showBandSettings,
    setShowBandSettings,
    nextEvent,
    pressedButton,
    eventsCount,
    proposalsCount,
    rosterMembers,
    isAndroid,
    handleButtonPress,
  } = useBandSheet();

  if (!bandId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Band</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <BandHeader
        bandId={bandId}
        bandName={bandName}
        bandAvatarUrl={bandAvatarUrl}
        bandAvatarUpdatedAt={bandAvatarUpdatedAt}
        isAdmin={myRole === 'admin'}
        showSettings={showBandSettings}
        onShowSettings={() => setShowBandSettings(true)}
        onHideSettings={() => setShowBandSettings(false)}
      />

      <IonContent
        fullscreen
        scrollY={true}
        style={
          {
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
            '--padding-bottom': isAndroid
              ? 'calc(env(safe-area-inset-bottom) + 110px)'
              : 'calc(env(safe-area-inset-bottom) + 72px)',
          } as React.CSSProperties
        }
      >
        {loading ? (
          <div
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonSpinner />
          </div>
        ) : error ? (
          <div style={{ padding: 16 }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : (
          <div
            style={{
              padding: '20px 16px 24px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {nextEvent && (
              <NextEventCard
                event={nextEvent}
                isPressed={pressedButton === 'nextEvent'}
                onPress={() =>
                  handleButtonPress('nextEvent', () =>
                    navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                  )
                }
              />
            )}

            <DashboardGrid
              bandId={bandId}
              eventsCount={eventsCount}
              proposalsCount={proposalsCount}
              rosterMembers={rosterMembers}
              pressedButton={pressedButton}
              handleButtonPress={handleButtonPress}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

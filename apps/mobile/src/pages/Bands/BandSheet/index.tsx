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

// Hook to detect screen size for responsive layouts
function useScreenSize() {
  const [size, setSize] = React.useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window === 'undefined') return 'small';
    if (window.innerWidth >= 1024) return 'large';
    if (window.innerWidth >= 768) return 'medium';
    return 'small';
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSize('large');
      else if (window.innerWidth >= 768) setSize('medium');
      else setSize('small');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export default function BandSheetMobile() {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const isLarge = screenSize === 'large';
  const isMedium = screenSize === 'medium';
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
              padding: isLarge
                ? '28px 48px 32px'
                : isMedium
                ? '24px 28px 28px'
                : '20px 16px 24px',
              maxWidth: isLarge ? 'none' : isMedium ? '900px' : '600px',
              margin: isLarge ? '0' : '0 auto',
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

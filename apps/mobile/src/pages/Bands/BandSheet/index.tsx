import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { calendarOutline, chevronForwardOutline } from 'ionicons/icons';
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
            {/* Large screen: NextEvent + Events inline */}
            {isLarge && nextEvent ? (
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 28,
                }}
              >
                <div style={{ flex: 2 }}>
                  <NextEventCard
                    event={nextEvent}
                    isPressed={pressedButton === 'nextEvent'}
                    onPress={() =>
                      handleButtonPress('nextEvent', () =>
                        navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                      )
                    }
                    inline
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleButtonPress('events', () =>
                      navigate(`/bands/${bandId}/events`)
                    )
                  }
                  style={{
                    flex: 1,
                    background:
                      'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: 28,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'transform 120ms ease-out',
                    transform:
                      pressedButton === 'events' ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      position: 'absolute',
                      top: 28,
                      right: 24,
                      fontSize: 22,
                      color: 'rgba(148, 163, 184, 0.6)',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 26, color: '#34d399' }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Events
                    </span>
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    {eventsCount > 0 ? (
                      <>
                        <div
                          style={{
                            fontSize: 42,
                            fontWeight: 700,
                            color: '#34d399',
                            lineHeight: 1,
                            marginBottom: 4,
                          }}
                        >
                          {eventsCount}
                        </div>
                        <div style={{ fontSize: 15, color: '#9ca3af' }}>
                          {eventsCount === 1 ? 'upcoming event' : 'upcoming events'}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: 15,
                          color: 'rgba(203, 213, 225, 0.8)',
                        }}
                      >
                        Shows & practices
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              nextEvent && (
                <NextEventCard
                  event={nextEvent}
                  isPressed={pressedButton === 'nextEvent'}
                  onPress={() =>
                    handleButtonPress('nextEvent', () =>
                      navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                    )
                  }
                />
              )
            )}

            <DashboardGrid
              bandId={bandId}
              eventsCount={eventsCount}
              proposalsCount={proposalsCount}
              rosterMembers={rosterMembers}
              pressedButton={pressedButton}
              handleButtonPress={handleButtonPress}
              hideEvents={isLarge && !!nextEvent}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

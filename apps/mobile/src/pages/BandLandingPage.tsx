import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React from 'react';

const BandLandingPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Band Name</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: '#0B0A0F', color: '#E8E6F0' }}
      >
        {/* About Us Section */}
        <IonText color="light">
          <h2>About Us</h2>
          <p>
            We are a passionate band dedicated to creating music that resonates
            with our audience.
          </p>
        </IonText>

        {/* Location and Genre */}
        <IonRow>
          <IonCol>
            <IonText color="light">Location: City, Country</IonText>
          </IonCol>
          <IonCol>
            <IonText color="light">Genre: Rock</IonText>
          </IonCol>
        </IonRow>

        {/* Upcoming Shows Section */}
        <IonText color="light">
          <h2>Upcoming Shows</h2>
        </IonText>
        <IonList>
          <IonCard>
            <IonCardContent>
              <IonText color="dark">
                Date: Dec 1, 2025 - Venue: The Music Hall
              </IonText>
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent>
              <IonText color="dark">
                Date: Dec 10, 2025 - Venue: The Arena
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonList>

        {/* Newsletter Signup */}
        <IonText color="light">
          <h2>Sign Up for Our Newsletter</h2>
        </IonText>
        <IonItem>
          <IonLabel position="floating">Your Email</IonLabel>
          <IonInput type="email" />
        </IonItem>
        <IonButton expand="full" color="primary" style={{ marginTop: '10px' }}>
          Subscribe
        </IonButton>

        {/* Music Streaming Links */}
        <IonText color="light">
          <h2>Listen to Us</h2>
        </IonText>
        <IonRow>
          <IonCol>
            <IonButton expand="full" href="https://spotify.com" target="_blank">
              Spotify
            </IonButton>
          </IonCol>
          <IonCol>
            <IonButton
              expand="full"
              href="https://apple.com/music"
              target="_blank"
            >
              Apple Music
            </IonButton>
          </IonCol>
          <IonCol>
            <IonButton expand="full" href="https://youtube.com" target="_blank">
              YouTube
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default BandLandingPage;

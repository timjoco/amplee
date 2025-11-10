import { IonCol, IonGrid, IonRow } from '@ionic/react';
import BandTileMobile from './BandTileMobile';

export type BandWithRole = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
};

type Props = {
  bands: BandWithRole[];
  selectedId?: string;
  onSelect: (band: BandWithRole) => void;
};

export default function BandGridMobile({ bands, selectedId, onSelect }: Props) {
  return (
    <IonGrid style={{ padding: 0 }}>
      <IonRow className="ion-justify-content-start ion-align-items-stretch">
        {bands.map((b) => (
          <IonCol key={b.id} size="6" sizeSm="4" sizeMd="3">
            <BandTileMobile
              id={b.id}
              name={b.name}
              avatar_url={b.avatar_url ?? undefined}
              role={b.role}
              selected={selectedId === b.id}
              onClick={() => onSelect(b)}
            />
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
}

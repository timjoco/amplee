import { IonActionSheet } from '@ionic/react';

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
};

export default function AvatarPickerActionSheet({
  isOpen,
  onDismiss,
  onPickCamera,
  onPickLibrary,
}: Props) {
  return (
    <IonActionSheet
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      header="Update photo"
      buttons={[
        { text: 'Take Photo', handler: onPickCamera },
        { text: 'Choose from Library', handler: onPickLibrary },
        { text: 'Cancel', role: 'cancel' },
      ]}
    />
  );
}

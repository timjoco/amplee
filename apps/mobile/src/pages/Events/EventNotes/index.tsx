import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, documentTextOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

import { EmptyNotesState } from './components/EmptyNotesState';
import { NotesEditor } from './components/NotesEditor';
import { NotesViewer } from './components/NotesViewer';
import { useEventNotes } from './hooks/useEventNotes';

export default function EventNotesPage() {
  const nav = useNavigate();
  const {
    eventId,
    title,
    notes,
    editedNotes,
    setEditedNotes,
    isEditing,
    isSaving,
    isAdmin,
    loading,
    handleStartEdit,
    handleCancelEdit,
    handleSaveNotes,
  } = useEventNotes();

  return (
    <IonPage>
      <IonHeader
        className="ion-no-border"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
        <IonToolbar
          style={{
            '--background': 'rgba(5, 5, 9, 0.95)',
            '--border-width': '0',
            borderBottom: '1px solid rgba(31, 41, 55, 0.9)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => nav(-1)}
              style={{
                flex: '0 0 auto',
                background: 'transparent',
                border: 'none',
                padding: 6,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </button>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background:
                  'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={documentTextOutline}
                style={{ fontSize: 16, color: '#34D399' }}
              />
            </div>

            <IonText style={{ flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  letterSpacing: -0.2,
                }}
              >
                Notes
              </h2>
              <p
                style={{
                  margin: 0,
                  marginTop: 2,
                  fontSize: 12,
                  color: '#9ca3af',
                }}
              >
                {title}
              </p>
            </IonText>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{ ['--background' as any]: '#050509' }}
      >
        {loading || !eventId ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            <IonSpinner name="crescent" style={{ marginRight: 8 }} />
            Loading notes…
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {isEditing ? (
              <NotesEditor
                editedNotes={editedNotes}
                isSaving={isSaving}
                onNotesChange={setEditedNotes}
                onSave={handleSaveNotes}
                onCancel={handleCancelEdit}
              />
            ) : notes ? (
              <NotesViewer
                notes={notes}
                isAdmin={isAdmin}
                onEdit={handleStartEdit}
              />
            ) : (
              <EmptyNotesState isAdmin={isAdmin} onEdit={handleStartEdit} />
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

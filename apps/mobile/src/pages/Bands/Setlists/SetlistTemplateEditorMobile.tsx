/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  musicalNotesOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetlistTemplateEditor } from './hooks/useSetlistTemplateEditor';

import { supabase } from '../../../lib/supabase';
import { EmptyState } from './components/EmptyState';
import { ExternalLinksSection } from './components/ExternalLinksSection';
import { SongsSection } from './components/SongsSection';
import { StatsBar } from './components/StatsBar';
import { TemplateActionsSection } from './components/TemplateActionsSection';
import { glassCard, PINK } from './lib/styles';
import { AddLinkModal } from './modals/AddLinkModal';
import { DeleteTemplateModal } from './modals/DeleteTemplateModal';
import { RenameTemplateModal } from './modals/RenameTemplateModal';
import { SongPickerModal } from './modals/SongPickerModal';

type RouteParams = {
  bandId: string;
  setlistId: string;
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SetlistTemplateEditorMobile() {
  const nav = useNavigate();
  const { bandId, setlistId } = useParams<RouteParams>();

  // User permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const isAdmin = useMemo(() => myRole === 'admin', [myRole]);

  // Get current user and role
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      const userId = data.user?.id ?? null;
      setMyUserId(userId);

      if (userId && bandId) {
        const { data: membership } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!alive) return;
        setMyRole(membership?.role ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bandId]);

  const editor = useSetlistTemplateEditor({
    bandId,
    setlistId,
    onDeleted: () => {
      if (bandId) nav(`/bands/${bandId}/setlists`);
      else nav(-1);
    },
  });

  const {
    loading,
    hasAttemptedLoad,
    template,
    items,
    links,
    savingReorder,
    totalDurationMinutes,
    totalDurationLabel,
    sensors,
    pressedButton,
    // songs
    songPickerOpen,
    filteredSongs,
    loadingSongs,
    songSearch,
    setSongSearch,
    // links
    showAddLink,
    newLinkUrl,
    newLinkLabel,
    setNewLinkUrl,
    setNewLinkLabel,
    savingLink,
    linkError,
    // template edit/delete
    showEditTemplate,
    editName,
    setEditName,
    savingTemplate,
    showDeleteTemplate,
    deletingTemplate,
    // actions
    handleButtonPress,
    handleDragEnd,
    handleDeleteItem,
    openSongPicker,
    closeSongPicker,
    handleSelectSongs,
    openAddLink,
    closeAddLink,
    handleAddLink,
    handleDeleteLink,
    openExternalLink,
    startEditTemplate,
    closeEditTemplate,
    saveTemplateEdits,
    openDeleteTemplateConfirm,
    closeDeleteTemplateConfirm,
    deleteTemplate,
  } = editor;

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#f9fafb',
                  letterSpacing: '-0.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template?.name ?? (loading ? 'Loading...' : 'Setlist')}
              </h1>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 13,
                  color: '#6b7280',
                }}
              >
                {items.length} {items.length === 1 ? 'song' : 'songs'}
              </p>
            </div>

            {/* Role Badge */}
            {myUserId && myRole && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: isAdmin
                    ? PINK.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isAdmin ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                  style={{
                    fontSize: 14,
                    color: isAdmin ? PINK.light : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isAdmin ? PINK.light : '#6b7280',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading || !hasAttemptedLoad ? (
          <EmptyState variant="loading" message="Loading setlist..." />
        ) : !template ? (
          <EmptyState
            variant="notFound"
            icon={musicalNotesOutline}
            title="Setlist not found"
            message="This setlist may have been deleted or moved."
          />
        ) : (
          <>
            <div
              style={{
                padding: 16,
                paddingBottom: 100,
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              {/* Non-admin notice */}
              {!isAdmin && myRole && (
                <div
                  style={{
                    ...glassCard,
                    padding: 12,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    style={{ color: '#6b7280', fontSize: 16 }}
                  />
                  <span style={{ color: '#6b7280', fontSize: 13 }}>
                    You're viewing this setlist as a member. Only admins can
                    edit.
                  </span>
                </div>
              )}

              <StatsBar
                songCount={items.length}
                durationMinutes={totalDurationMinutes}
                durationLabel={totalDurationLabel}
                savingReorder={savingReorder}
              />

              <SongsSection
                items={items}
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDeleteItem={handleDeleteItem}
                onAddClick={() => handleButtonPress('add', openSongPicker)}
                onEmptyCtaClick={openSongPicker}
                isAddPressed={pressedButton === 'add'}
                isAdmin={isAdmin}
              />

              <ExternalLinksSection
                links={links}
                onAddClick={() => handleButtonPress('addLink', openAddLink)}
                isAddPressed={pressedButton === 'addLink'}
                onDeleteLink={handleDeleteLink}
                onOpenLink={openExternalLink}
                isAdmin={isAdmin}
              />

              {isAdmin && (
                <TemplateActionsSection
                  onRenameClick={() =>
                    handleButtonPress('rename', startEditTemplate)
                  }
                  onDeleteClick={() =>
                    handleButtonPress('delete', openDeleteTemplateConfirm)
                  }
                  isRenamePressed={pressedButton === 'rename'}
                  isDeletePressed={pressedButton === 'delete'}
                />
              )}
            </div>

            {showAddLink && isAdmin && (
              <AddLinkModal
                newLinkUrl={newLinkUrl}
                newLinkLabel={newLinkLabel}
                setNewLinkUrl={setNewLinkUrl}
                setNewLinkLabel={setNewLinkLabel}
                savingLink={savingLink}
                linkError={linkError}
                onClose={closeAddLink}
                onSubmit={handleAddLink}
              />
            )}

            <SongPickerModal
              isOpen={songPickerOpen && isAdmin}
              loadingSongs={loadingSongs}
              songSearch={songSearch}
              setSongSearch={setSongSearch}
              filteredSongs={filteredSongs}
              songsCount={editor.songs.length}
              onClose={closeSongPicker}
              onSelectSongs={handleSelectSongs}
            />

            <RenameTemplateModal
              isOpen={showEditTemplate && isAdmin}
              editName={editName}
              setEditName={setEditName}
              savingTemplate={savingTemplate}
              onClose={closeEditTemplate}
              onSave={saveTemplateEdits}
            />

            <DeleteTemplateModal
              isOpen={showDeleteTemplate && isAdmin}
              templateName={template?.name ?? ''}
              songCount={items.length}
              deletingTemplate={deletingTemplate}
              onClose={closeDeleteTemplateConfirm}
              onDelete={deleteTemplate}
            />
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

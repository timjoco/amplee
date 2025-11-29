/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  createOutline,
  linkOutline,
  logoApple,
  logoYoutube,
  musicalNotesOutline,
  openOutline,
  reorderThreeOutline,
  searchOutline,
  sparklesOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSetlistTemplateEditor } from '../hooks/useSetlistTemplateEditor';

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SetlistTemplateItemRow,
  SetlistTemplateLinkRow,
  SongOption,
  detectLinkType,
} from '../utils/setlists';

type RouteParams = {
  bandId: string;
  setlistId: string;
};

export function SpotifyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

/* ------------------ MAIN COMPONENT ------------------ */

export default function SetlistTemplateEditorMobile() {
  const nav = useNavigate();
  const { bandId, setlistId } = useParams<RouteParams>();

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
    template,
    items,
    links,
    savingReorder,
    minutesEstimate,
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
    handleSelectSong,
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
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 12, 0.98)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
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
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                '--padding-start': '0',
                '--padding-end': '0',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  letterSpacing: '-0.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template?.name ?? (loading ? 'Loading…' : 'Setlist')}
              </h1>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 13,
                  color: '#9ca3af',
                }}
              >
                {items.length} {items.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #0a0812 0%, #050509 100%)',
        }}
      >
        {loading ? (
          <LoadingState />
        ) : !template ? (
          <NotFoundState />
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
              {/* 1) Stats bar */}
              <StatsBar
                songCount={items.length}
                minutesEstimate={minutesEstimate}
                savingReorder={savingReorder}
              />

              {/* 2) Songs (picker + list) */}
              <SongsSection
                items={items}
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDeleteItem={handleDeleteItem}
                onAddClick={() => handleButtonPress('add', openSongPicker)}
                onEmptyCtaClick={openSongPicker}
                isAddPressed={pressedButton === 'add'}
              />

              {/* 3) External links */}
              <ExternalLinksSection
                links={links}
                onAddClick={() => handleButtonPress('addLink', openAddLink)}
                isAddPressed={pressedButton === 'addLink'}
                onDeleteLink={handleDeleteLink}
                onOpenLink={openExternalLink}
              />

              {/* 4) Rename / delete actions */}
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
            </div>

            {/* Add Link Modal */}
            {showAddLink && (
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

            {/* Song picker modal */}
            <SongPickerModal
              isOpen={songPickerOpen}
              loadingSongs={loadingSongs}
              songSearch={songSearch}
              setSongSearch={setSongSearch}
              filteredSongs={filteredSongs}
              songsCount={editor.songs.length}
              onClose={closeSongPicker}
              onSelectSong={handleSelectSong}
            />

            {/* Edit template name modal */}
            <RenameTemplateModal
              isOpen={showEditTemplate}
              editName={editName}
              setEditName={setEditName}
              savingTemplate={savingTemplate}
              onClose={closeEditTemplate}
              onSave={saveTemplateEdits}
            />

            {/* Delete template confirm modal */}
            <DeleteTemplateModal
              isOpen={showDeleteTemplate}
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

/* ------------------ PRESENTATIONAL COMPONENTS ------------------ */

function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
        gap: 12,
      }}
    >
      <IonSpinner
        name="crescent"
        style={{ '--color': '#f472b6', width: 32, height: 32 }}
      />
      <IonText color="medium">
        <p style={{ margin: 0, fontSize: 14 }}>Loading setlist…</p>
      </IonText>
    </div>
  );
}

function NotFoundState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
        gap: 12,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(244, 114, 182, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IonIcon
          icon={musicalNotesOutline}
          style={{ fontSize: 32, color: '#f472b6' }}
        />
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: '#e5e7eb',
        }}
      >
        Setlist not found
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
        This setlist may have been deleted or moved.
      </p>
    </div>
  );
}

function StatsBar({
  songCount,
  minutesEstimate,
  savingReorder,
}: {
  songCount: number;
  minutesEstimate: number;
  savingReorder: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          flex: 1,
          background:
            'linear-gradient(135deg, rgba(244,114,182,0.1) 0%, rgba(236,72,153,0.05) 100%)',
          border: '1px solid rgba(244, 114, 182, 0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#f472b6',
            lineHeight: 1,
          }}
        >
          {songCount}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          {songCount === 1 ? 'SONG' : 'SONGS'}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background:
            'linear-gradient(135deg, rgba(244,114,182,0.1) 0%, rgba(236,72,153,0.05) 100%)',
          border: '1px solid rgba(244, 114, 182, 0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#f472b6',
            lineHeight: 1,
          }}
        >
          {minutesEstimate === 0 ? '0' : `~${minutesEstimate}`}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          MINUTES
        </div>
      </div>

      {savingReorder && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: 'rgba(244, 114, 182, 0.15)',
            fontSize: 12,
            color: '#f472b6',
          }}
        >
          <IonSpinner
            name="dots"
            style={{ '--color': '#f472b6', width: 16, height: 16 }}
          />
          Saving…
        </div>
      )}
    </div>
  );
}

function SongsSection({
  items,
  sensors,
  onDragEnd,
  onDeleteItem,
  onAddClick,
  onEmptyCtaClick,
  isAddPressed,
}: {
  items: SetlistTemplateItemRow[];
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteItem: (id: string) => void;
  onAddClick: () => void;
  onEmptyCtaClick: () => void;
  isAddPressed: boolean;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonIcon
            icon={musicalNotesOutline}
            style={{ fontSize: 18, color: '#f472b6' }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Songs
          </span>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid rgba(244, 114, 182, 0.4)',
            background:
              'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(236,72,153,0.1) 100%)',
            color: '#f472b6',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 100ms ease-out',
            transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(244, 114, 182, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <IonIcon
              icon={sparklesOutline}
              style={{ fontSize: 28, color: '#f472b6' }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#e5e7eb',
              marginBottom: 6,
            }}
          >
            Start building your setlist
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 16,
            }}
          >
            Add songs from your library and drag to reorder
          </p>

          <button
            type="button"
            onClick={onEmptyCtaClick}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(244, 114, 182, 0.4)',
              background:
                'linear-gradient(135deg, rgba(244,114,182,0.9) 0%, rgba(236,72,153,0.9) 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(244, 114, 182, 0.3)',
            }}
          >
            Add your first song
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={items.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {items.map((row, index) => (
                <SortableTemplateItemCard
                  key={row.id}
                  row={row}
                  index={index}
                  onDelete={() => onDeleteItem(row.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function ExternalLinksSection({
  links,
  onAddClick,
  isAddPressed,
  onDeleteLink,
  onOpenLink,
}: {
  links: SetlistTemplateLinkRow[];
  onAddClick: () => void;
  isAddPressed: boolean;
  onDeleteLink: (id: string) => void;
  onOpenLink: (url: string) => void;
}) {
  const renderLinkIcon = (url: string) => {
    const { kind } = detectLinkType(url);

    if (kind === 'spotify') {
      return <SpotifyIcon size={18} />;
    }
    if (kind === 'apple') {
      return <IonIcon icon={logoApple} style={{ fontSize: 18 }} />;
    }
    if (kind === 'youtube') {
      return <IonIcon icon={logoYoutube} style={{ fontSize: 18 }} />;
    }
    return <IonIcon icon={linkOutline} style={{ fontSize: 18 }} />;
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(236,72,153,0.04) 100%)',
        border: '1px solid rgba(244, 114, 182, 0.2)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: links.length > 0 ? 16 : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonIcon
            icon={linkOutline}
            style={{ fontSize: 18, color: '#f472b6' }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            External Links
          </span>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid rgba(244, 114, 182, 0.4)',
            background:
              'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(236,72,153,0.1) 100%)',
            color: '#f472b6',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 100ms ease-out',
            transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
          Add
        </button>
      </div>

      {links.length === 0 ? (
        <div
          style={{
            padding: '20px 16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Add links to Spotify playlists, Apple Music, YouTube, and more
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {links.map((link) => (
            <div
              key={link.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: '#f472b6',
                }}
              >
                {renderLinkIcon(link.url)}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#F9FAFB',
                    marginBottom: 2,
                  }}
                >
                  {link.label || detectLinkType(link.url).label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {link.url}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenLink(link.url)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid rgba(244, 114, 182, 0.3)',
                  background: 'rgba(244, 114, 182, 0.1)',
                  color: '#f472b6',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={openOutline} style={{ fontSize: 16 }} />
              </button>

              <button
                type="button"
                onClick={() => onDeleteLink(link.id)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  background: 'rgba(248, 113, 113, 0.1)',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={trashOutline} style={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateActionsSection({
  onRenameClick,
  onDeleteClick,
  isRenamePressed,
  isDeletePressed,
}: {
  onRenameClick: () => void;
  onDeleteClick: () => void;
  isRenamePressed: boolean;
  isDeletePressed: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        marginTop: 20,
      }}
    >
      <button
        type="button"
        onClick={onRenameClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid rgba(244, 114, 182, 0.3)',
          background:
            'linear-gradient(135deg, rgba(244,114,182,0.1) 0%, rgba(236,72,153,0.05) 100%)',
          color: '#f472b6',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 100ms ease-out',
          transform: isRenamePressed ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
        Rename
      </button>

      <button
        type="button"
        onClick={onDeleteClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid rgba(248, 113, 113, 0.3)',
          background:
            'linear-gradient(135deg, rgba(248,113,113,0.1) 0%, rgba(239,68,68,0.05) 100%)',
          color: '#f87171',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 100ms ease-out',
          transform: isDeletePressed ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
        Delete
      </button>
    </div>
  );
}

function AddLinkModal({
  newLinkUrl,
  newLinkLabel,
  setNewLinkUrl,
  setNewLinkLabel,
  savingLink,
  linkError,
  onClose,
  onSubmit,
}: {
  newLinkUrl: string;
  newLinkLabel: string;
  setNewLinkUrl: (v: string) => void;
  setNewLinkLabel: (v: string) => void;
  savingLink: boolean;
  linkError: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={() => !savingLink && onClose()}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          background:
            'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          borderRadius: 24,
          padding: 24,
          boxShadow:
            '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(244,114,182,0.1)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(236,72,153,0.1) 100%)',
            border: '1px solid rgba(244,114,182,0.3)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <IonIcon
            icon={linkOutline}
            style={{ fontSize: 26, color: '#f472b6' }}
          />
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#f9fafb',
            textAlign: 'center',
            letterSpacing: '-0.3px',
          }}
        >
          Add external link
        </h2>

        <p
          style={{
            margin: '8px 0 20px',
            fontSize: 14,
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Link to Spotify, Apple Music, YouTube, or any other streaming service
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            URL
          </label>
          <input
            type="url"
            value={newLinkUrl}
            onChange={(e) => {
              setNewLinkUrl(e.target.value);
              if (linkError) {
              }
            }}
            placeholder="https://open.spotify.com/playlist/..."
            autoFocus
            style={{
              width: '100%',
              borderRadius: 12,
              border: linkError
                ? '1px solid rgba(248,113,113,0.6)'
                : '1px solid rgba(148,163,184,0.25)',
              padding: '12px 14px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              color: '#e5e7eb',
              fontSize: 15,
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Label (optional)
          </label>
          <input
            type="text"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            placeholder="e.g. Practice Playlist"
            style={{
              width: '100%',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              padding: '12px 14px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              color: '#e5e7eb',
              fontSize: 15,
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          />
        </div>

        {linkError && (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: '#f87171',
              textAlign: 'center',
            }}
          >
            {linkError}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={savingLink}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(255,255,255,0.03)',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={savingLink || !newLinkUrl.trim()}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(244,114,182,0.4)',
              background:
                savingLink || !newLinkUrl.trim()
                  ? 'rgba(244,114,182,0.1)'
                  : 'linear-gradient(135deg, rgba(244,114,182,0.9) 0%, rgba(236,72,153,0.9) 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor:
                savingLink || !newLinkUrl.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: savingLink || !newLinkUrl.trim() ? 0.5 : 1,
              boxShadow:
                savingLink || !newLinkUrl.trim()
                  ? 'none'
                  : '0 4px 14px rgba(244,114,182,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {savingLink ? (
              <>
                <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                Adding…
              </>
            ) : (
              'Add link'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SongPickerModal({
  isOpen,
  loadingSongs,
  songSearch,
  setSongSearch,
  filteredSongs,
  songsCount,
  onClose,
  onSelectSong,
}: {
  isOpen: boolean;
  loadingSongs: boolean;
  songSearch: string;
  setSongSearch: (v: string) => void;
  filteredSongs: SongOption[];
  songsCount: number;
  onClose: () => void;
  onSelectSong: (song: SongOption) => void;
}) {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{
        '--background': 'rgba(8, 8, 12, 1)',
      }}
    >
      <div
        style={{
          padding: 16,
          paddingTop: 20,
          background: 'linear-gradient(180deg, #0a0812 0%, #050509 100%)',
          minHeight: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: '#F9FAFB',
            }}
          >
            Add song
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'transparent',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        {/* Search bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: 16,
          }}
        >
          <IonIcon
            icon={searchOutline}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: '#6b7280',
            }}
          />
          <input
            type="text"
            value={songSearch}
            onChange={(e) => setSongSearch(e.target.value)}
            placeholder="Search songs…"
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: 12,
              border: '1px solid rgba(244, 114, 182, 0.3)',
              background: 'rgba(255,255,255,0.03)',
              color: '#e5e7eb',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {loadingSongs ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 10,
            }}
          >
            <IonSpinner
              name="crescent"
              style={{ '--color': '#f472b6', width: 24, height: 24 }}
            />
            <span style={{ fontSize: 14, color: '#9ca3af' }}>
              Loading songs…
            </span>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
            }}
          >
            <IonIcon
              icon={musicalNotesOutline}
              style={{
                fontSize: 40,
                color: '#4b5563',
                marginBottom: 12,
              }}
            />
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              {songsCount === 0
                ? 'No songs in your library yet'
                : 'No songs match your search'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '65vh',
              overflowY: 'auto',
              paddingBottom: 20,
            }}
          >
            {filteredSongs.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => onSelectSong(song)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  background:
                    'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(236,72,153,0.04) 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 100ms ease-out',
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#F9FAFB',
                    marginBottom: 4,
                  }}
                >
                  {song.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 12,
                    color: '#6b7280',
                  }}
                >
                  <span>Key: {song.default_key?.trim() || '—'}</span>
                  <span>•</span>
                  <span>BPM: {song.default_bpm ?? '—'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </IonModal>
  );
}

function RenameTemplateModal({
  isOpen,
  editName,
  setEditName,
  savingTemplate,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editName: string;
  setEditName: (v: string) => void;
  savingTemplate: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        style={{
          '--background': 'rgba(8, 8, 12, 0.98)',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 24,
              padding: 24,
              background:
                'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
              border: '1px solid rgba(244, 114, 182, 0.3)',
              boxShadow:
                '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(244,114,182,0.1)',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 22,
                fontWeight: 800,
                color: '#F9FAFB',
              }}
            >
              Rename setlist
            </h3>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Setlist name"
                autoFocus
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid rgba(244, 114, 182, 0.4)',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#F9FAFB',
                  fontSize: 16,
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
              }}
            >
              <button
                type="button"
                disabled={savingTemplate}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#9ca3af',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingTemplate}
                onClick={onSave}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(244,114,182,0.4)',
                  background:
                    'linear-gradient(135deg, rgba(244,114,182,0.9) 0%, rgba(236,72,153,0.9) 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: savingTemplate ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(244, 114, 182, 0.3)',
                }}
              >
                {savingTemplate ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}

function DeleteTemplateModal({
  isOpen,
  templateName,
  songCount,
  deletingTemplate,
  onClose,
  onDelete,
}: {
  isOpen: boolean;
  templateName: string;
  songCount: number;
  deletingTemplate: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        style={{
          '--background': 'rgba(8, 8, 12, 0.98)',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              borderRadius: 24,
              padding: 24,
              background:
                'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              boxShadow:
                '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(248,113,113,0.1)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(185,28,28,0.1) 100%)',
                border: '1px solid rgba(248,113,113,0.3)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IonIcon
                icon={trashOutline}
                style={{ fontSize: 28, color: '#f87171' }}
              />
            </div>

            <h3
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 22,
                fontWeight: 800,
                color: '#F9FAFB',
                textAlign: 'center',
              }}
            >
              Delete setlist?
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 24,
                fontSize: 15,
                color: '#9ca3af',
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              This will permanently remove "{templateName}" and all {songCount}{' '}
              song{songCount === 1 ? '' : 's'}. This can't be undone.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
              }}
            >
              <button
                type="button"
                disabled={deletingTemplate}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#9ca3af',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingTemplate}
                onClick={onDelete}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(220,38,38,0.5)',
                  background:
                    'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: deletingTemplate ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {deletingTemplate ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ width: 16, height: 16 }}
                    />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}

function SortableTemplateItemCard({
  row,
  index,
  onDelete,
}: {
  row: SetlistTemplateItemRow;
  index: number;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          borderRadius: 14,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: isDragging
            ? 'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(236,72,153,0.1) 100%)'
            : 'rgba(15, 23, 42, 0.6)',
          border: isDragging
            ? '1px solid rgba(244, 114, 182, 0.4)'
            : '1px solid rgba(71, 85, 105, 0.3)',
          boxShadow: isDragging
            ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(244,114,182,0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'background 150ms, border 150ms, box-shadow 150ms',
        }}
      >
        {/* Drag handle + index */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: 28,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            aria-label="Reorder"
            {...attributes}
            {...listeners}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 4,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              touchAction: 'none',
              borderRadius: 6,
            }}
          >
            <IonIcon
              icon={reorderThreeOutline}
              style={{ fontSize: 20, color: '#6b7280' }}
            />
          </button>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#f472b6',
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Song info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#F9FAFB',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 4,
            }}
          >
            {row.title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 13, color: '#f472b6', opacity: 0.8 }}
              />
              <span>{row.musical_key || '—'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IonIcon
                icon={speedometerOutline}
                style={{ fontSize: 13, color: '#f472b6', opacity: 0.8 }}
              />
              <span>{row.bpm ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid rgba(248, 113, 113, 0.3)',
            background: 'rgba(248, 113, 113, 0.1)',
            color: '#f87171',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  closeOutline,
  createOutline,
  linkOutline,
  logoApple,
  logoYoutube,
  musicalNotesOutline,
  openOutline,
  personOutline,
  reorderThreeOutline,
  searchOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import React, { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '../lib/supabase';
import {
  SetlistTemplateItemRow,
  SetlistTemplateLinkRow,
  SongOption,
  detectLinkType,
} from '../utils/setlists';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library/Setlists)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  primaryHover: '#db2777',
  light: '#f472b6',
  lighter: '#f9a8d4',
  dark: '#be185d',
  glow: 'rgba(236, 72, 153, 0.4)',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
};

const RED = {
  primary: '#ef4444',
  light: '#f87171',
  subtle: 'rgba(239, 68, 68, 0.08)',
  border: 'rgba(239, 68, 68, 0.25)',
  glow: 'rgba(239, 68, 68, 0.4)',
};

// ─────────────────────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type RouteParams = {
  bandId: string;
  setlistId: string;
};

// ─────────────────────────────────────────────────────────────
// Spotify Icon
// ─────────────────────────────────────────────────────────────

export function SpotifyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

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
                isAdmin={isAdmin}
              />

              {/* 3) External links */}
              <ExternalLinksSection
                links={links}
                onAddClick={() => handleButtonPress('addLink', openAddLink)}
                isAddPressed={pressedButton === 'addLink'}
                onDeleteLink={handleDeleteLink}
                onOpenLink={openExternalLink}
                isAdmin={isAdmin}
              />

              {/* 4) Rename / delete actions (Admin Only) */}
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

            {/* Add Link Modal */}
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

            {/* Song picker modal */}
            <SongPickerModal
              isOpen={songPickerOpen && isAdmin}
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
              isOpen={showEditTemplate && isAdmin}
              editName={editName}
              setEditName={setEditName}
              savingTemplate={savingTemplate}
              onClose={closeEditTemplate}
              onSave={saveTemplateEdits}
            />

            {/* Delete template confirm modal */}
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

// ─────────────────────────────────────────────────────────────
// Presentational Components
// ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '50vh',
        gap: 12,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <IonSpinner
          style={{
            '--color': PINK.primary,
            width: 32,
            height: 32,
          }}
        />
        <div
          style={{
            color: '#6b7280',
            fontSize: 13,
            marginTop: 12,
          }}
        >
          Loading setlist...
        </div>
      </div>
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
          borderRadius: 16,
          background: PINK.subtle,
          border: `1px solid ${PINK.border}`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <IonIcon
          icon={musicalNotesOutline}
          style={{ fontSize: 28, color: PINK.light }}
        />
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 17,
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
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: PINK.light,
            lineHeight: 1,
          }}
        >
          {songCount}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginTop: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {songCount === 1 ? 'Song' : 'Songs'}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: PINK.light,
            lineHeight: 1,
          }}
        >
          {minutesEstimate === 0 ? '0' : `~${minutesEstimate}`}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            marginTop: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Minutes
        </div>
      </div>

      {savingReorder && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: PINK.subtle,
            border: `1px solid ${PINK.border}`,
            fontSize: 12,
            fontWeight: 600,
            color: PINK.light,
          }}
        >
          <IonSpinner
            style={{ '--color': PINK.light, width: 14, height: 14 }}
          />
          Saving...
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
  isAdmin,
}: {
  items: SetlistTemplateItemRow[];
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteItem: (id: string) => void;
  onAddClick: () => void;
  onEmptyCtaClick: () => void;
  isAddPressed: boolean;
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        ...glassCard,
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Section Header */}
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
            style={{ fontSize: 18, color: PINK.light }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Songs
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: PINK.primary,
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: `0 4px 12px ${PINK.glow}`,
              transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 100ms ease-out',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add
          </button>
        )}
      </div>

      {/* Empty State */}
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
              borderRadius: 14,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <IonIcon
              icon={sparklesOutline}
              style={{ fontSize: 24, color: PINK.light }}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#e5e7eb',
              marginBottom: 6,
            }}
          >
            {isAdmin ? 'Start building your setlist' : 'No songs yet'}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
              marginBottom: isAdmin ? 16 : 0,
            }}
          >
            {isAdmin
              ? 'Add songs from your library and drag to reorder'
              : 'This setlist is empty. Ask an admin to add songs.'}
          </p>

          {isAdmin && (
            <button
              type="button"
              onClick={onEmptyCtaClick}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: PINK.primary,
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${PINK.glow}`,
              }}
            >
              Add your first song
            </button>
          )}
        </div>
      ) : (
        /* Song List */
        <DndContext
          sensors={isAdmin ? sensors : []}
          collisionDetection={closestCenter}
          onDragEnd={isAdmin ? onDragEnd : () => {}}
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
                  isAdmin={isAdmin}
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
  isAdmin,
}: {
  links: SetlistTemplateLinkRow[];
  onAddClick: () => void;
  isAddPressed: boolean;
  onDeleteLink: (id: string) => void;
  onOpenLink: (url: string) => void;
  isAdmin: boolean;
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
        ...glassCard,
        border: `1px solid ${PINK.border}`,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Section Header */}
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
            style={{ fontSize: 18, color: PINK.light }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            External Links
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              color: PINK.light,
              fontSize: 13,
              fontWeight: 600,
              transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 100ms ease-out',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add
          </button>
        )}
      </div>

      {/* Empty State */}
      {links.length === 0 ? (
        <div
          style={{
            padding: '16px',
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
            {isAdmin
              ? 'Add links to Spotify playlists, Apple Music, YouTube, and more'
              : 'No external links added yet'}
          </p>
        </div>
      ) : (
        /* Links List */
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
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: PINK.subtle,
                  border: `1px solid ${PINK.border}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: PINK.light,
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
                    color: '#f9fafb',
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
                  background: PINK.subtle,
                  border: `1px solid ${PINK.border}`,
                  color: PINK.light,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={openOutline} style={{ fontSize: 16 }} />
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDeleteLink(link.id)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: RED.subtle,
                    border: `1px solid ${RED.border}`,
                    color: RED.light,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 16 }} />
                </button>
              )}
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
        marginTop: 8,
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
          padding: '14px 16px',
          borderRadius: 12,
          background: PINK.subtle,
          border: `1px solid ${PINK.border}`,
          color: PINK.light,
          fontSize: 14,
          fontWeight: 600,
          transform: isRenamePressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'all 100ms ease-out',
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
          padding: '14px 16px',
          borderRadius: 12,
          background: RED.subtle,
          border: `1px solid ${RED.border}`,
          color: RED.light,
          fontSize: 14,
          fontWeight: 600,
          transform: isDeletePressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'all 100ms ease-out',
        }}
      >
        <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
        Delete
      </button>
    </div>
  );
}

function SortableTemplateItemCard({
  row,
  index,
  onDelete,
  isAdmin,
}: {
  row: SetlistTemplateItemRow;
  index: number;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isAdmin });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: isDragging ? PINK.subtle : 'rgba(255, 255, 255, 0.02)',
          border: isDragging
            ? `1px solid ${PINK.border}`
            : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isDragging
            ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${PINK.glow}`
            : 'none',
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
          {isAdmin && (
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
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: PINK.light,
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
              color: '#f9fafb',
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
              gap: 12,
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
                style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
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
                style={{ fontSize: 13, color: PINK.light, opacity: 0.7 }}
              />
              <span>{row.bpm ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Remove button (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: RED.subtle,
              border: `1px solid ${RED.border}`,
              color: RED.light,
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal Components
// ─────────────────────────────────────────────────────────────

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
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          ...glassCard,
          border: `1px solid ${PINK.border}`,
          padding: 24,
          boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 40px ${PINK.glow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: PINK.subtle,
                border: `1px solid ${PINK.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={linkOutline}
                style={{ fontSize: 20, color: PINK.light }}
              />
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Add Link
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={savingLink}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
          </button>
        </div>

        <p
          style={{
            margin: '0 0 20px',
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          Link to Spotify, Apple Music, YouTube, or any other streaming service
        </p>

        {/* URL Input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            URL
          </label>
          <input
            type="url"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: linkError
                ? `1px solid ${RED.border}`
                : `1px solid ${
                    newLinkUrl ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
              color: '#f9fafb',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Label Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
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
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f9fafb',
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {linkError && (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: RED.light,
              textAlign: 'center',
            }}
          >
            {linkError}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={savingLink}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e5e7eb',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={savingLink || !newLinkUrl.trim()}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 12,
              background: PINK.primary,
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              opacity: savingLink || !newLinkUrl.trim() ? 0.5 : 1,
              boxShadow: `0 4px 12px ${PINK.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {savingLink ? (
              <>
                <IonSpinner
                  style={{ '--color': '#fff', width: 16, height: 16 }}
                />
                Adding...
              </>
            ) : (
              'Add Link'
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
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        <div style={{ padding: 16, paddingTop: 20 }}>
          {/* Header */}
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
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Add Song
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>

          {/* Search */}
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
              placeholder="Search songs..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  songSearch ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>

          {/* Content */}
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
                style={{ '--color': PINK.primary, width: 24, height: 24 }}
              />
              <span style={{ fontSize: 14, color: '#6b7280' }}>
                Loading songs...
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
                  onClick={() => onSelectSong(song)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: PINK.subtle,
                    border: `1px solid ${PINK.border}`,
                    textAlign: 'left',
                    transition: 'all 100ms ease-out',
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#f9fafb',
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
      </IonContent>
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
          '--background': 'rgba(8, 8, 14, 0.98)',
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
              ...glassCard,
              border: `1px solid ${PINK.border}`,
              padding: 24,
              boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${PINK.glow}`,
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Rename Setlist
            </h3>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
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
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    editName ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 16,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={savingTemplate}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e5e7eb',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={savingTemplate}
                onClick={onSave}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: PINK.primary,
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: savingTemplate ? 0.7 : 1,
                  boxShadow: `0 4px 12px ${PINK.glow}`,
                }}
              >
                {savingTemplate ? 'Saving...' : 'Save'}
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
          '--background': 'rgba(8, 8, 14, 0.98)',
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
              ...glassCard,
              border: `1px solid ${RED.border}`,
              padding: 24,
              boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${RED.glow}`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: RED.subtle,
                border: `1px solid ${RED.border}`,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IonIcon
                icon={trashOutline}
                style={{ fontSize: 26, color: RED.light }}
              />
            </div>

            <h3
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
                textAlign: 'center',
              }}
            >
              Delete Setlist?
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 24,
                fontSize: 14,
                color: '#6b7280',
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              This will permanently remove "{templateName}" and all {songCount}{' '}
              song{songCount === 1 ? '' : 's'}. This can't be undone.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={deletingTemplate}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e5e7eb',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={deletingTemplate}
                onClick={onDelete}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: RED.primary,
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
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
                      style={{ '--color': '#fff', width: 16, height: 16 }}
                    />
                    Deleting...
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

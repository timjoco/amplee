import { IonIcon } from '@ionic/react';
import {
  chevronForwardOutline,
  documentTextOutline,
  folderOpenOutline,
  musicalNotesOutline,
  peopleOutline,
} from 'ionicons/icons';

type AttendanceStats = {
  accepted: number;
  total: number;
};

type EventQuickTilesProps = {
  attendanceStats: AttendanceStats;
  inviteeTotal: number;

  setlistCount: number;
  filesCount: number;
  hasNotes: boolean;
  pressedButton: string | null;
  onPressRollCall: () => void;
  onPressSetlist: () => void;
  onPressNotes: () => void;
  onPressFiles: () => void;
};

type TileProps = {
  icon: string;
  iconColor: string;
  label: string;
  value: string | number;
  subtitle: string;
  bgColor: string;
  borderColor: string;
  isPressed: boolean;
  onPress: () => void;
};

function Tile({
  icon,
  iconColor,
  label,
  value,
  subtitle,
  bgColor,
  borderColor,
  isPressed,
  onPress,
}: TileProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        transition: 'transform 120ms ease-out',
        position: 'relative',
        textAlign: 'left',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 130,
      }}
    >
      <IonIcon
        icon={chevronForwardOutline}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontSize: 18,
          color: 'rgba(148, 163, 184, 0.6)',
          opacity: 0.7,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <IonIcon icon={icon} style={{ fontSize: 20, color: iconColor }} />
        <span
          style={{
            fontSize: 11,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 700,
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: iconColor,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af' }}>{subtitle}</div>
    </button>
  );
}

export default function EventQuickTiles({
  attendanceStats,
  inviteeTotal,
  setlistCount,
  filesCount,
  hasNotes,
  pressedButton,
  onPressRollCall,
  onPressSetlist,
  onPressNotes,
  onPressFiles,
}: EventQuickTilesProps) {
  const attendancePercentage =
    inviteeTotal > 0
      ? Math.round((attendanceStats.accepted / inviteeTotal) * 100)
      : 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* Roll Call */}
      <Tile
        icon={peopleOutline}
        iconColor="#34d399"
        label="Roll Call"
        value={`${attendancePercentage}%`}
        subtitle={
          inviteeTotal === 0
            ? 'No invitees yet'
            : `${attendanceStats.accepted} of ${inviteeTotal} in`
        }
        bgColor="rgba(52, 211, 153, 0.05)"
        borderColor="rgba(52, 211, 153, 0.15)"
        isPressed={pressedButton === 'rollcall'}
        onPress={onPressRollCall}
      />

      {/* Setlist */}
      <Tile
        icon={musicalNotesOutline}
        iconColor="#f472b6"
        label="Setlist"
        value={setlistCount}
        subtitle={setlistCount === 1 ? 'song planned' : 'songs planned'}
        bgColor="rgba(244, 114, 182, 0.05)"
        borderColor="rgba(244, 114, 182, 0.15)"
        isPressed={pressedButton === 'setlist'}
        onPress={onPressSetlist}
      />

      {/* Notes */}
      <Tile
        icon={documentTextOutline}
        iconColor="#34d399"
        label="Notes"
        value={hasNotes ? '✓' : '—'}
        subtitle={hasNotes ? 'Notes added' : 'No notes yet'}
        bgColor="rgba(52, 211, 153, 0.05)"
        borderColor="rgba(52, 211, 153, 0.15)"
        isPressed={pressedButton === 'notes'}
        onPress={onPressNotes}
      />

      {/* Files */}
      <Tile
        icon={folderOpenOutline}
        iconColor="#34d399"
        label="Files"
        value={filesCount}
        subtitle={filesCount === 1 ? 'file uploaded' : 'files uploaded'}
        bgColor="rgba(52, 211, 153, 0.05)"
        borderColor="rgba(52, 211, 153, 0.15)"
        isPressed={pressedButton === 'files'}
        onPress={onPressFiles}
      />
    </div>
  );
}

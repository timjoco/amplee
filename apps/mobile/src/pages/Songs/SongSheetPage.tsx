/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addCircleOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  closeOutline,
  createOutline,
  musicalNotesOutline,
  saveOutline,
  timeOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type SongOrigin = 'original' | 'cover';

type SongRow = {
  id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
  lyrics: string | null;
  notes: string | null;
  origin: SongOrigin;
  band_name: string | null;
};

type UserChart = {
  id: string;
  chart_content: string | null;
  personal_notes: string | null;
  key_override: string | null;
  bpm_override: number | null;
  created_at: string;
  updated_at: string;
};

type SongSheetPageProps = {
  songId: string;
  onBack: () => void;
  onEdit?: (songId: string) => void;
};

type ViewMode = 'shared' | 'personal';

type ChordPlacement = {
  id: string;
  chord: string;
  position: number; // character position in line
};

type ChartLine = {
  id: string;
  text: string;
  chords: ChordPlacement[];
};

export default function SongSheetPage({
  songId,
  onBack,
  onEdit,
}: SongSheetPageProps) {
  const [loading, setLoading] = useState(true);
  const [song, setSong] = useState<SongRow | null>(null);
  const [userChart, setUserChart] = useState<UserChart | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('shared');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editLines, setEditLines] = useState<ChartLine[]>([]);
  const [editPersonalNotes, setEditPersonalNotes] = useState('');
  const [editKeyOverride, setEditKeyOverride] = useState('');
  const [editBpmOverride, setEditBpmOverride] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [collisionFlashLineId, setCollisionFlashLineId] = useState<
    string | null
  >(null);

  // Drag state
  const [draggingChord, setDraggingChord] = useState<{
    lineId: string;
    chordId: string;
  } | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);

  useEffect(() => {
    if (!songId) return;

    const loadData = async () => {
      setLoading(true);

      // Load song
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select(
          `
          id,
          title,
          default_key,
          default_bpm,
          lyrics,
          notes,
          origin,
          bands(name)
        `
        )
        .eq('id', songId)
        .maybeSingle();

      if (songError) {
        console.error('[SongSheetPage] loadSong error', songError.message);
        setSong(null);
      } else if (songData) {
        const anyData = songData as any;
        const bandName = anyData.bands?.name ?? null;
        setSong({
          id: anyData.id,
          title: anyData.title,
          default_key: anyData.default_key,
          default_bpm: anyData.default_bpm,
          lyrics: anyData.lyrics,
          notes: anyData.notes,
          origin: anyData.origin,
          band_name: bandName,
        });
      }

      // Load user's personal chart
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: chartData, error: chartError } = await supabase
          .from('user_charts')
          .select('*')
          .eq('song_id', songId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!chartError && chartData) {
          setUserChart(chartData as UserChart);
        }
      }

      setLoading(false);
    };

    void loadData();
  }, [songId]);

  // Convert bracket notation [C] to structured format
  const parseChartContent = (content: string): ChartLine[] => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const chords: ChordPlacement[] = [];

      // First, clean up any corrupted empty brackets or malformed data
      let cleanedLine = line.replace(/\[\s*\]/g, ''); // Remove empty brackets []

      const chordRegex = /\[([^\]]+)\]/g;
      let match;
      let textWithoutChords = cleanedLine;

      // First, extract all chords and their positions in the original string
      const chordsWithOriginalPos: Array<{
        chord: string;
        originalPos: number;
      }> = [];
      while ((match = chordRegex.exec(cleanedLine)) !== null) {
        // Skip empty or whitespace-only chords
        if (match[1].trim().length > 0) {
          chordsWithOriginalPos.push({
            chord: match[1].trim(),
            originalPos: match.index,
          });
        }
      }

      // Remove all chord brackets to get clean text
      textWithoutChords = cleanedLine.replace(/\[([^\]]+)\]/g, '');

      // Calculate new positions after removing brackets
      chordsWithOriginalPos.forEach((item, i) => {
        // Count how many brackets came before this position
        const bracketsBeforeCount = i;
        const totalCharsRemovedBefore = chordsWithOriginalPos
          .slice(0, i)
          .reduce((sum, c) => sum + c.chord.length + 2, 0); // +2 for []

        const adjustedPosition = item.originalPos - totalCharsRemovedBefore;

        chords.push({
          id: `chord-${idx}-${i}`,
          chord: item.chord,
          position: Math.max(0, adjustedPosition), // Ensure non-negative
        });
      });

      return {
        id: `line-${idx}`,
        text: textWithoutChords,
        chords,
      };
    });
  };

  // Convert structured format back to bracket notation
  const serializeChartContent = (lines: ChartLine[]): string => {
    return lines
      .map((line, lineIdx) => {
        if (line.chords.length === 0) {
          return line.text;
        }

        // Sort chords by position (descending) to insert from right to left
        // This prevents position shifts as we insert brackets
        const sortedChords = [...line.chords].sort(
          (a, b) => b.position - a.position
        );

        let result = line.text;

        console.log(`[Line ${lineIdx}] Original text:`, line.text);
        console.log(`[Line ${lineIdx}] Text length:`, line.text.length);
        console.log(`[Line ${lineIdx}] Chords to insert:`, sortedChords);

        // Insert chords from right to left so positions don't shift
        sortedChords.forEach((chord) => {
          const pos = Math.min(chord.position, result.length);
          console.log(
            `[Line ${lineIdx}] Inserting [${chord.chord}] at position ${pos}`
          );
          console.log(`[Line ${lineIdx}] Before:`, result);
          result =
            result.slice(0, pos) + `[${chord.chord}]` + result.slice(pos);
          console.log(`[Line ${lineIdx}] After:`, result);
        });

        console.log(`[Line ${lineIdx}] Final result:`, result);
        return result;
      })
      .join('\n');
  };

  const handleStartEdit = () => {
    if (userChart && userChart.chart_content) {
      setEditLines(parseChartContent(userChart.chart_content));
      setEditPersonalNotes(userChart.personal_notes || '');
      setEditKeyOverride(userChart.key_override || '');
      setEditBpmOverride(userChart.bpm_override?.toString() || '');
    } else {
      // Start with song's shared lyrics as template
      const initialContent = song?.lyrics || '';
      setEditLines(parseChartContent(initialContent));
      setEditPersonalNotes('');
      setEditKeyOverride('');
      setEditBpmOverride('');
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLines([]);
    setEditPersonalNotes('');
    setEditKeyOverride('');
    setEditBpmOverride('');
    setSelectedLineId(null);
  };

  const handleSaveChart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !song) return;

    setSaving(true);

    const chartContent = serializeChartContent(editLines);

    const chartData = {
      user_id: user.id,
      song_id: song.id,
      chart_content: chartContent || null,
      personal_notes: editPersonalNotes || null,
      key_override: editKeyOverride || null,
      bpm_override: editBpmOverride ? parseInt(editBpmOverride) : null,
    };

    if (userChart) {
      // Update existing chart
      const { data, error } = await supabase
        .from('user_charts')
        .update(chartData)
        .eq('id', userChart.id)
        .select()
        .single();

      if (error) {
        console.error('[SongSheetPage] update chart error', error.message);
      } else {
        setUserChart(data as UserChart);
        setIsEditing(false);
        setSelectedLineId(null);
      }
    } else {
      // Create new chart
      const { data, error } = await supabase
        .from('user_charts')
        .insert([chartData])
        .select()
        .single();

      if (error) {
        console.error('[SongSheetPage] create chart error', error.message);
      } else {
        setUserChart(data as UserChart);
        setIsEditing(false);
        setSelectedLineId(null);
        setViewMode('personal');
      }
    }

    setSaving(false);
  };

  const handleAddLine = () => {
    setEditLines([
      ...editLines,
      {
        id: `line-${Date.now()}`,
        text: '',
        chords: [],
      },
    ]);
  };

  const handleUpdateLineText = (lineId: string, newText: string) => {
    setEditLines(
      editLines.map((line) =>
        line.id === lineId ? { ...line, text: newText } : line
      )
    );
  };

  // Helper function to find nearest word boundary
  const findNearestWordBoundary = (pos: number, text: string): number => {
    // Never allow position 0 - always snap to at least after the first word
    if (pos === 0 || pos === 1) {
      // Find the end of the first word
      let firstWordEnd = 0;
      while (firstWordEnd < text.length && text[firstWordEnd] !== ' ') {
        firstWordEnd++;
      }
      // Skip any spaces after the first word
      while (firstWordEnd < text.length && text[firstWordEnd] === ' ') {
        firstWordEnd++;
      }
      return firstWordEnd;
    }

    if (pos >= text.length) return text.length;

    // Check if we're already at a space or start
    if (text[pos] === ' ' || (pos > 0 && text[pos - 1] === ' ')) {
      // If clicking on or after a space, snap to after the space
      while (pos < text.length && text[pos] === ' ') pos++;
      return pos;
    }

    // We're in the middle of a word
    // Look backward to find the start of the current word
    let startOfWord = pos;
    while (startOfWord > 0 && text[startOfWord - 1] !== ' ') {
      startOfWord--;
    }

    // Look forward to find the end of the current word
    let endOfWord = pos;
    while (endOfWord < text.length && text[endOfWord] !== ' ') {
      endOfWord++;
    }

    // Choose the closer boundary
    const distToStart = pos - startOfWord;
    const distToEnd = endOfWord - pos;

    // If closer to start (first half of word), snap to start
    // If closer to end (second half of word), snap to end
    return distToStart <= distToEnd ? startOfWord : endOfWord;
  };

  const handleAddChordToLine = (
    lineId: string,
    clickX: number,
    lineStartX: number
  ) => {
    const charWidth = 8.4; // monospace character width
    const rawPosition = Math.max(
      0,
      Math.round((clickX - lineStartX) / charWidth)
    );

    console.log('=== ADD CHORD ===');
    console.log('clickX:', clickX);
    console.log('lineStartX:', lineStartX);
    console.log('delta:', clickX - lineStartX);
    console.log('rawPosition:', rawPosition);

    setEditLines(
      editLines.map((line) => {
        if (line.id === lineId) {
          console.log('Line text:', line.text);
          console.log('Line text length:', line.text.length);
          console.log('Existing chords:', line.chords);

          // Check if trying to place beyond text length
          if (rawPosition > line.text.length) {
            console.log('REJECTED: Beyond text length');
            setCollisionFlashLineId(lineId);
            setTimeout(() => setCollisionFlashLineId(null), 400);
            return line;
          }

          // SMART POSITIONING: Use word boundary snapping
          const requestedPosition = findNearestWordBoundary(
            rawPosition,
            line.text
          );
          console.log('Smart-adjusted position:', requestedPosition);

          // Check for collision with existing chords
          const chordWidth = 6; // approximate character width of a chord (e.g., "Cmaj7" = ~5 chars)
          const hasCollision = line.chords.some((chord) => {
            const distance = Math.abs(chord.position - requestedPosition);
            return distance < chordWidth;
          });

          // If collision, trigger red flash and don't add chord
          if (hasCollision) {
            console.log('REJECTED: Collision detected');
            setCollisionFlashLineId(lineId);
            setTimeout(() => setCollisionFlashLineId(null), 400);
            return line;
          }

          console.log('ACCEPTED: Adding chord at position', requestedPosition);
          return {
            ...line,
            chords: [
              ...line.chords,
              {
                id: `chord-${Date.now()}`,
                chord: 'C',
                position: requestedPosition,
              },
            ],
          };
        }
        return line;
      })
    );
  };

  const handleUpdateChord = (
    lineId: string,
    chordId: string,
    updates: Partial<ChordPlacement>
  ) => {
    setEditLines(
      editLines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            chords: line.chords.map((chord) =>
              chord.id === chordId ? { ...chord, ...updates } : chord
            ),
          };
        }
        return line;
      })
    );
  };

  const handleDeleteChord = (lineId: string, chordId: string) => {
    setEditLines(
      editLines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            chords: line.chords.filter((chord) => chord.id !== chordId),
          };
        }
        return line;
      })
    );
  };

  const handleDeleteLine = (lineId: string) => {
    setEditLines(editLines.filter((line) => line.id !== lineId));
  };

  // Drag handlers
  const handleChordMouseDown = (
    e: React.MouseEvent,
    lineId: string,
    chordId: string,
    currentPosition: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingChord({ lineId, chordId });
    setDragStartX(e.clientX);
    setDragStartPosition(currentPosition);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingChord) return;

    const charWidth = 8.4;
    const deltaX = e.clientX - dragStartX;
    const deltaPosition = Math.round(deltaX / charWidth);
    const rawPosition = Math.max(0, dragStartPosition + deltaPosition);

    // Find the line to get max position and check collisions
    const line = editLines.find((l) => l.id === draggingChord.lineId);
    if (line) {
      // Don't allow dragging beyond text length
      if (rawPosition > line.text.length) {
        return;
      }

      // Apply smart positioning during drag too
      const requestedPosition = findNearestWordBoundary(rawPosition, line.text);

      const chordWidth = 6; // approximate character width buffer

      // Check collision with other chords (not including the one being dragged)
      const hasCollision = line.chords.some((chord) => {
        if (chord.id === draggingChord.chordId) return false; // Skip self
        const distance = Math.abs(chord.position - requestedPosition);
        return distance < chordWidth;
      });

      // Only update if no collision and within bounds
      if (!hasCollision) {
        handleUpdateChord(draggingChord.lineId, draggingChord.chordId, {
          position: requestedPosition,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingChord(null);
  };

  // ---- Rendering functions ----
  const renderContent = (content: string | null | undefined) => {
    if (!content) return null;

    const lines = content.split('\n');

    return lines.map((line, idx) => {
      // blank spacer
      if (line.trim() === '') {
        return <div key={idx} style={{ height: 16 }} />;
      }

      const chordRegex = /\[([^\]]+)\]/g;
      const hasChords = chordRegex.test(line);

      console.log('[renderContent] Line:', line);
      console.log('[renderContent] hasChords:', hasChords);

      if (hasChords) {
        const parts: Array<{ text: string; chord?: string }> = [];
        let lastIndex = 0;
        // Create a NEW regex because .test() consumed the first one
        const matchRegex = /\[([^\]]+)\]/g;
        const matches = [...line.matchAll(matchRegex)];

        matches.forEach((match) => {
          if (match.index !== undefined && match.index > lastIndex) {
            parts.push({
              text: line.slice(lastIndex, match.index),
            });
          }
          parts.push({ chord: match[1], text: '' });
          lastIndex = (match.index ?? 0) + match[0].length;
        });

        if (lastIndex < line.length) {
          parts.push({ text: line.slice(lastIndex) });
        }

        return (
          <div
            key={idx}
            style={{
              marginBottom: 24,
              lineHeight: '2.2em',
              position: 'relative',
              whiteSpace: 'pre-wrap',
            }}
          >
            {parts.map((part, partIdx) =>
              part.chord ? (
                <span
                  key={partIdx}
                  style={{
                    position: 'relative',
                    paddingLeft: part.text === '' ? 0 : 4,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: -26,
                      left: 0,
                      fontFamily: '"Space Mono", monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(244, 114, 182, 0.95)',
                      textShadow: '0 0 10px rgba(244, 114, 182, 0.3)',
                    }}
                  >
                    {part.chord}
                  </span>
                  {part.text}
                </span>
              ) : (
                <span key={partIdx}>{part.text}</span>
              )
            )}
          </div>
        );
      }

      // Section headers
      const isSectionHeader =
        line === line.toUpperCase() &&
        line.trim().length > 0 &&
        line.trim().length < 30;
      const isParenthetical =
        line.trim().startsWith('(') && line.trim().endsWith(')');

      if (isSectionHeader || isParenthetical) {
        return (
          <div
            key={idx}
            style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 12,
              fontWeight: 700,
              color: '#9ca3af',
              letterSpacing: 1,
              marginTop: idx === 0 ? 0 : 32,
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            {line}
          </div>
        );
      }

      // Regular lyric line
      return (
        <div
          key={idx}
          style={{
            marginBottom: 8,
            lineHeight: '1.8em',
          }}
        >
          {line}
        </div>
      );
    });
  };

  const renderEditableLine = (line: ChartLine, lineIndex: number) => {
    const isSelected = selectedLineId === line.id;
    const charWidth = 8.4; // approximate width per character in pixels

    return (
      <div
        key={line.id}
        style={{
          marginBottom: 24,
          padding: 12,
          background: isSelected
            ? 'rgba(244, 114, 182, 0.08)'
            : 'rgba(15,23,42,0.3)',
          borderRadius: 12,
          border: isSelected
            ? '2px solid rgba(244, 114, 182, 0.4)'
            : '1px solid rgba(148,163,184,0.2)',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onClick={() => setSelectedLineId(line.id)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Chord positioning area - CLICKABLE */}
        <div
          style={{
            position: 'relative',
            height: 50,
            minHeight: 50,
            marginBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
            background: 'rgba(15,23,42,0.4)',
            borderRadius: 8,
            border:
              collisionFlashLineId === line.id
                ? '2px solid rgba(239, 68, 68, 0.8)'
                : '1px dashed rgba(148,163,184,0.3)',
            cursor: 'crosshair',
            transition: 'border 0.15s ease-out',
            boxShadow:
              collisionFlashLineId === line.id
                ? '0 0 12px rgba(239, 68, 68, 0.6)'
                : 'none',
            overflow: 'hidden',
          }}
          onClick={(e) => {
            e.stopPropagation();
            const chordAreaRect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX;
            const relativeX = clickX - (chordAreaRect.left + 12);

            // Calculate the max allowed width based on text length
            const charWidth = 8.4;
            const maxWidth = line.text.length * charWidth;

            // Check if click is within text bounds
            if (relativeX < 0 || relativeX > maxWidth) {
              setCollisionFlashLineId(line.id);
              setTimeout(() => setCollisionFlashLineId(null), 400);
              return;
            }

            handleAddChordToLine(line.id, clickX, chordAreaRect.left + 12);
          }}
        >
          {/* Visual boundary marker showing text length */}
          {line.text.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 12 + line.text.length * 8.4,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'rgba(148,163,184,0.3)',
                pointerEvents: 'none',
              }}
            />
          )}

          {line.chords.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#6b7280',
                fontSize: 12,
                pointerEvents: 'none',
              }}
            >
              Click to add chord
            </div>
          )}
          {line.chords.map((chord) => (
            <div
              key={chord.id}
              style={{
                position: 'absolute',
                left: chord.position * charWidth + 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor:
                  draggingChord?.chordId === chord.id ? 'grabbing' : 'grab',
                userSelect: 'none',
              }}
              onMouseDown={(e) =>
                handleChordMouseDown(e, line.id, chord.id, chord.position)
              }
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(244, 114, 182, 0.95)',
                  padding: '6px 10px',
                  borderRadius: 8,
                  boxShadow:
                    draggingChord?.chordId === chord.id
                      ? '0 4px 12px rgba(244, 114, 182, 0.5)'
                      : '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <input
                  type="text"
                  value={chord.chord}
                  onChange={(e) =>
                    handleUpdateChord(line.id, chord.id, {
                      chord: e.target.value,
                    })
                  }
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  maxLength={6}
                  style={{
                    width: 50,
                    minWidth: 50,
                    maxWidth: 50,
                    background: 'rgba(0,0,0,0.2)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 13,
                    fontFamily: '"Space Mono", monospace',
                    fontWeight: 700,
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChord(line.id, chord.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: 'none',
                    color: '#000',
                    padding: '2px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Lyric text with monospace preview - single line, no wrap */}
        <div
          style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 15,
            color: '#9ca3af',
            marginBottom: 8,
            padding: '8px 12px',
            background: 'rgba(15,23,42,0.4)',
            borderRadius: 8,
            height: 36,
            lineHeight: '20px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {line.text || <span style={{ color: '#6b7280' }}>Empty line...</span>}
        </div>

        {/* Lyric text input - single line */}
        <input
          type="text"
          value={line.text}
          onChange={(e) => handleUpdateLineText(line.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Enter lyrics or section header..."
          style={{
            width: '100%',
            background: 'rgba(15,23,42,0.6)',
            color: '#e5e7eb',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: '"Inter", sans-serif',
            marginBottom: 8,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        />

        {/* Line controls */}
        {isSelected && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLine(line.id);
              }}
              style={{
                flex: 1,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: 'rgba(239, 68, 68, 0.9)',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              🗑 Delete Line
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---- Loading & Not Found ----
  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
            }}
          >
            <IonSpinner color="light" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!song) {
    return (
      <IonPage>
        <IonContent fullscreen style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              padding: 24,
            }}
          >
            <IonText color="medium">
              <h2 style={{ color: '#e5e7eb' }}>Song not found</h2>
            </IonText>
            <IonButton
              onClick={onBack}
              style={
                {
                  marginTop: 16,
                  '--background': 'rgba(148,163,184,0.3)',
                  '--color': '#f9fafb',
                } as any
              }
            >
              Go back
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const artistName = song.band_name || 'Unknown artist';
  const displayKey =
    viewMode === 'personal' && userChart?.key_override
      ? userChart.key_override
      : song.default_key;
  const displayBpm =
    viewMode === 'personal' && userChart?.bpm_override
      ? userChart.bpm_override
      : song.default_bpm;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              onClick={onBack}
              style={{ '--color': '#e8e4ecff' } as any}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ fontSize: 20, color: '#ffffffff', marginRight: 2 }}
              />
            </IonButton>
          </IonButtons>
          <IonTitle
            style={{
              color: '#e8e4ecff',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {song.title}
          </IonTitle>
          <IonButtons slot="end">
            {onEdit && viewMode === 'shared' && (
              <IonButton
                onClick={() => onEdit(song.id)}
                style={{ '--color': '#e8e4ecff' } as any}
              >
                <IonIcon icon={createOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={
          {
            '--background': '#050509',
          } as any
        }
      >
        <div
          style={{
            padding: '24px 20px 80px 20px',
            maxWidth: 800,
            margin: '0 auto',
          }}
        >
          {/* Song Header */}
          <div
            style={{
              background:
                'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
              border: '1px solid rgba(148,163,184,0.4)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 28,
              boxShadow: '0 18px 40px rgba(0,0,0,0.9)',
            }}
          >
            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: '#f9fafb',
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {song.title}
            </h1>

            <div
              style={{
                fontSize: 14,
                color: '#9ca3af',
                marginBottom: 16,
              }}
            >
              {artistName}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {displayKey && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(244, 114, 182, 0.12)',
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(244, 114, 182, 0.4)',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 16, color: 'rgba(244, 114, 182, 0.95)' }}
                  />
                  <span
                    style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#f9fafb',
                    }}
                  >
                    Key: {displayKey}
                  </span>
                </div>
              )}

              {displayBpm != null && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(15,23,42,0.98)',
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.5)',
                  }}
                >
                  <IonIcon
                    icon={timeOutline}
                    style={{ fontSize: 16, color: '#9ca3af' }}
                  />
                  <span
                    style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#e5e7eb',
                    }}
                  >
                    {displayBpm} BPM
                  </span>
                </div>
              )}

              {song.origin && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    borderRadius: 999,
                    border:
                      song.origin === 'cover'
                        ? '1px solid rgba(59,130,246,0.85)'
                        : '1px solid rgba(52,211,153,0.85)',
                    background:
                      song.origin === 'cover'
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(52,211,153,0.12)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0.08,
                      textTransform: 'uppercase',
                      color:
                        song.origin === 'cover'
                          ? 'rgba(129, 178, 255, 0.98)'
                          : 'rgba(52, 211, 153, 0.98)',
                    }}
                  >
                    {song.origin === 'cover' ? 'Cover' : 'Original'}
                  </span>
                </div>
              )}
            </div>

            {song.notes && viewMode === 'shared' && (
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  background: 'rgba(15,23,42,0.9)',
                  borderRadius: 12,
                  borderLeft: '3px solid rgba(244, 114, 182, 0.6)',
                }}
              >
                <IonText
                  style={{
                    fontSize: 14,
                    color: '#d1d5db',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}
                >
                  {song.notes}
                </IonText>
              </div>
            )}
          </div>

          {/* Main Content Block (The Amp!) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #050509 0%, #050814 100%)',
              border: '1px solid rgba(148,163,184,0.35)',
              borderRadius: 20,
              padding: '16px 16px 24px 16px',
              boxShadow: '0 10px 32px rgba(0,0,0,0.9)',
            }}
          >
            {/* Tab Switcher */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 20,
                background: 'rgba(15,23,42,0.6)',
                padding: 4,
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.3)',
              }}
            >
              <button
                onClick={() => !isEditing && setViewMode('shared')}
                disabled={isEditing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border:
                    viewMode === 'shared'
                      ? '1px solid rgba(244, 114, 182, 0.4)'
                      : 'none',
                  background:
                    viewMode === 'shared'
                      ? 'rgba(244, 114, 182, 0.15)'
                      : 'transparent',
                  color:
                    viewMode === 'shared'
                      ? 'rgba(244, 114, 182, 0.98)'
                      : '#9ca3af',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isEditing ? 'not-allowed' : 'pointer',
                  opacity: isEditing ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                Shared Lyrics
              </button>
              <button
                onClick={() => !isEditing && setViewMode('personal')}
                disabled={isEditing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border:
                    viewMode === 'personal'
                      ? '1px solid rgba(244, 114, 182, 0.4)'
                      : 'none',
                  background:
                    viewMode === 'personal'
                      ? 'rgba(244, 114, 182, 0.15)'
                      : 'transparent',
                  color:
                    viewMode === 'personal'
                      ? 'rgba(244, 114, 182, 0.98)'
                      : '#9ca3af',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isEditing ? 'not-allowed' : 'pointer',
                  opacity: isEditing ? 0.5 : 1,
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                My Chart
                {userChart && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: 'rgba(34, 211, 238, 0.9)',
                      color: '#000',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: 999,
                      border: '2px solid #050509',
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            </div>

            {/* Content Area */}
            {isEditing ? (
              /* EDIT MODE - Drag & Drop Editor */
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: '1px solid rgba(148,163,184,0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#f9fafb',
                    }}
                  >
                    ✏️ Editing Your Chart
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <IonButton
                      onClick={handleCancelEdit}
                      size="small"
                      fill="clear"
                      style={
                        {
                          '--color': '#9ca3af',
                        } as any
                      }
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      onClick={handleSaveChart}
                      size="small"
                      disabled={saving}
                      style={
                        {
                          '--background': 'rgba(244, 114, 182, 0.95)',
                          '--background-activated': 'rgba(244, 114, 182, 1)',
                          '--color': '#000000',
                          '--border-radius': '999px',
                        } as any
                      }
                    >
                      {saving ? (
                        <IonSpinner
                          name="crescent"
                          style={{ width: 16, height: 16 }}
                        />
                      ) : (
                        <>
                          <IonIcon icon={saveOutline} slot="start" />
                          Save
                        </>
                      )}
                    </IonButton>
                  </div>
                </div>

                {/* Help text */}
                <div
                  style={{
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#d1d5db',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>💡 How to use:</strong> Click in the dashed area to
                  add a chord. Drag chords left/right to position them. Edit
                  chord names by clicking the text input.
                </div>

                {/* Line editor */}
                <div style={{ marginBottom: 16 }}>
                  {editLines.map((line, idx) => renderEditableLine(line, idx))}

                  <button
                    onClick={handleAddLine}
                    style={{
                      width: '100%',
                      background: 'rgba(148,163,184,0.15)',
                      border: '1px dashed rgba(148,163,184,0.4)',
                      color: '#9ca3af',
                      padding: '12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <IonIcon icon={addCircleOutline} />
                    Add Line
                  </button>
                </div>

                {/* Personal Notes Editor */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      marginBottom: 8,
                    }}
                  >
                    Personal Notes
                  </label>
                  <IonTextarea
                    value={editPersonalNotes}
                    onIonInput={(e) =>
                      setEditPersonalNotes(e.detail.value || '')
                    }
                    rows={3}
                    placeholder="Add performance notes, reminders, etc..."
                    style={
                      {
                        '--background': 'rgba(15,23,42,0.6)',
                        '--color': '#e5e7eb',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        '--padding-top': '12px',
                        '--padding-bottom': '12px',
                        fontSize: 14,
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.3)',
                      } as any
                    }
                  />
                </div>

                {/* Optional Overrides */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#9ca3af',
                        marginBottom: 8,
                      }}
                    >
                      Key Override
                    </label>
                    <input
                      type="text"
                      value={editKeyOverride}
                      onChange={(e) => setEditKeyOverride(e.target.value)}
                      placeholder="e.g. A, Bb"
                      style={{
                        width: '100%',
                        background: 'rgba(15,23,42,0.6)',
                        color: '#e5e7eb',
                        padding: '10px 12px',
                        fontSize: 14,
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.3)',
                        fontFamily: '"Space Mono", monospace',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#9ca3af',
                        marginBottom: 8,
                      }}
                    >
                      BPM Override
                    </label>
                    <input
                      type="number"
                      value={editBpmOverride}
                      onChange={(e) => setEditBpmOverride(e.target.value)}
                      placeholder="e.g. 120"
                      style={{
                        width: '100%',
                        background: 'rgba(15,23,42,0.6)',
                        color: '#e5e7eb',
                        padding: '10px 12px',
                        fontSize: 14,
                        borderRadius: 12,
                        border: '1px solid rgba(148,163,184,0.3)',
                        fontFamily: '"Space Mono", monospace',
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : viewMode === 'shared' ? (
              /* SHARED LYRICS VIEW */
              <div>
                <div
                  style={{
                    fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
                    fontSize: 15,
                    color: '#e5e7eb',
                    lineHeight: 1.8,
                  }}
                >
                  {song.lyrics ? (
                    renderContent(song.lyrics)
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                      }}
                    >
                      <IonIcon
                        icon={musicalNotesOutline}
                        style={{
                          fontSize: 48,
                          color: '#27272f',
                          marginBottom: 16,
                        }}
                      />
                      <IonText color="medium">
                        <p style={{ fontSize: 15, color: '#9ca3af' }}>
                          No lyrics or chart added yet.
                        </p>
                      </IonText>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* PERSONAL CHART VIEW */
              <div>
                {userChart ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        paddingBottom: 12,
                        borderBottom: '1px solid rgba(148,163,184,0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#f9fafb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        📝 Your Personal Chart
                      </div>
                      <IonButton
                        onClick={handleStartEdit}
                        size="small"
                        style={
                          {
                            '--background': 'rgba(244, 114, 182, 0.15)',
                            '--background-activated':
                              'rgba(244, 114, 182, 0.25)',
                            '--color': 'rgba(244, 114, 182, 0.98)',
                            '--border-radius': '999px',
                            '--padding-start': '12px',
                            '--padding-end': '12px',
                          } as any
                        }
                      >
                        <IonIcon icon={createOutline} slot="start" />
                        Edit
                      </IonButton>
                    </div>

                    {userChart.personal_notes && (
                      <div
                        style={{
                          background: 'rgba(34, 211, 238, 0.1)',
                          borderLeft: '3px solid rgba(34, 211, 238, 0.6)',
                          padding: '12px 14px',
                          borderRadius: 8,
                          marginBottom: 20,
                          fontSize: 14,
                          color: '#d1d5db',
                          fontStyle: 'italic',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'rgba(34, 211, 238, 0.98)',
                            marginBottom: 4,
                          }}
                        >
                          💡 Your notes:
                        </div>
                        {userChart.personal_notes}
                      </div>
                    )}

                    <div
                      style={{
                        fontFamily:
                          '"Inter", -apple-system, system-ui, sans-serif',
                        fontSize: 15,
                        color: '#e5e7eb',
                        lineHeight: 1.8,
                      }}
                    >
                      {renderContent(userChart.chart_content)}
                    </div>
                  </>
                ) : (
                  /* NO PERSONAL CHART YET */
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                    }}
                  >
                    <IonIcon
                      icon={musicalNotesOutline}
                      style={{
                        fontSize: 48,
                        color: '#27272f',
                        marginBottom: 16,
                      }}
                    />
                    <IonText color="medium">
                      <p
                        style={{
                          fontSize: 15,
                          color: '#9ca3af',
                          marginBottom: 8,
                        }}
                      >
                        You haven't created a personal chart yet.
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: '#6b7280',
                          marginBottom: 20,
                        }}
                      >
                        Create your own version with custom chords and
                        performance cues.
                      </p>
                    </IonText>
                    <IonButton
                      onClick={handleStartEdit}
                      style={
                        {
                          '--background': 'rgba(244, 114, 182, 0.95)',
                          '--background-activated': 'rgba(244, 114, 182, 1)',
                          '--color': '#000000',
                          '--border-radius': '999px',
                        } as any
                      }
                    >
                      <IonIcon icon={checkmarkCircleOutline} slot="start" />
                      Create My Chart
                    </IonButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          `}
        </style>
      </IonContent>
    </IonPage>
  );
}

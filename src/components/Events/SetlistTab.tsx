/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Portal,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { supabaseBrowser } from '@/lib/supabaseClient';

/* ------------------------- Types ------------------------- */
type SetlistRow = {
  id: string;
  event_id: string;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
  order_index: number;
  created_at?: string;
};

type Template = { id: string; name: string };
type TemplateItem = {
  id: string;
  template_id: string;
  order_index: number;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
};

type Props = { eventId: string; bandId: string; isAdmin?: boolean };

/* -------------------- Desktop Sortable Row -------------------- */
function DesktopSortableRow({
  id,
  children,
  isAdmin,
}: {
  id: string;
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : undefined,
    outline: isDragging ? '2px solid rgba(128,128,255,0.35)' : undefined,
    borderRadius: isDragging ? 8 : undefined,
    background: isDragging ? 'rgba(128,128,255,0.06)' : undefined,
  };
  return (
    <TableRow ref={setNodeRef} style={style} hover>
      <TableCell sx={{ width: 44, pr: 0.5 }}>
        {isAdmin && (
          <IconButton
            size="small"
            aria-label="Drag"
            {...attributes}
            {...listeners}
            sx={{ touchAction: 'none' }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
      {children}
    </TableRow>
  );
}

/* --------------------- Mobile Sortable Row -------------------- */
function MobileSortableRow({
  id,
  index,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  values,
  onChange,
  isAdmin,
}: {
  id: string;
  index: number;
  isEditing: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  values: {
    title?: string;
    musical_key?: string | null;
    bpm?: number | null;
    notes?: string | null;
    display: {
      title: string;
      musical_key: string | null;
      bpm: number | null;
      notes: string | null;
    };
  };
  onChange: (
    field: keyof SetlistRow
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={(t) => ({
        p: 1.25,
        borderRadius: 2,
        background: isDragging ? 'rgba(128,128,255,0.06)' : undefined,
        outline: isDragging ? '2px solid rgba(128,128,255,0.35)' : undefined,
      })}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {isAdmin && (
          <IconButton
            size="small"
            aria-label="Drag"
            {...attributes}
            {...listeners}
            sx={{ touchAction: 'none' }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}

        <Chip size="small" label={index + 1} sx={{ mr: 0.5 }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={values.title ?? ''}
              onChange={onChange('title')}
              placeholder="Song title"
            />
          ) : (
            <Typography variant="subtitle2" noWrap>
              {values.display.title}
            </Typography>
          )}

          {/* Meta row: Key • BPM */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 0.5 }}
            alignItems="center"
          >
            {isEditing ? (
              <>
                <TextField
                  size="small"
                  value={values.musical_key ?? ''}
                  onChange={onChange('musical_key')}
                  placeholder="Key (e.g., C, Gm)"
                  sx={{ width: 98 }}
                />
                <TextField
                  size="small"
                  type="number"
                  value={values.bpm ?? ''}
                  onChange={onChange('bpm')}
                  placeholder="BPM"
                  inputProps={{ min: 0 }}
                  sx={{ width: 88 }}
                />
              </>
            ) : (
              <>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {values.display.musical_key || '—'}
                </Typography>
                <Divider
                  flexItem
                  orientation="vertical"
                  sx={{ mx: 0.5, opacity: 0.2 }}
                />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {values.display.bpm ?? '—'}
                </Typography>
              </>
            )}
          </Stack>

          {/* Notes */}
          <Box sx={{ mt: 0.75 }}>
            {isEditing ? (
              <TextField
                size="small"
                fullWidth
                value={values.notes ?? ''}
                onChange={onChange('notes')}
                placeholder="Notes"
              />
            ) : (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {values.display.notes || ' '}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Row actions */}
        <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
          {isEditing ? (
            <>
              <IconButton size="small" aria-label="Save" onClick={onSave}>
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Cancel" onClick={onCancel}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <IconButton size="small" aria-label="Edit" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" aria-label="Delete" onClick={onDelete}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}

/* ------------------------- Component ------------------------- */
export default function SetlistTab({
  eventId,
  bandId,
  isAdmin = false,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  const supabase = supabaseBrowser();

  const [rows, setRows] = React.useState<SetlistRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [edits, setEdits] = React.useState<Record<string, Partial<SetlistRow>>>(
    {}
  );

  // templates UI state
  const [saveDlgOpen, setSaveDlgOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const [loadDlgOpen, setLoadDlgOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [applyMode, setApplyMode] = React.useState<'replace' | 'append'>(
    'replace'
  );

  // delete dialog state
  const [deleteDlgOpen, setDeleteDlgOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SetlistRow | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  // batched save
  const saveQueue = React.useRef<Record<string, SetlistRow>>({});
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 180, tolerance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
  /* -------- Load current event setlist -------- */
  React.useEffect(() => {
    let mounted = true;

    if (!eventId) {
      console.error('SetlistTab: eventId is required');
      setRows([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_setlist_items')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (!mounted) return;
      if (error) {
        console.error('Load setlist error:', error);
        setRows([]);
      } else {
        setRows((data || []) as SetlistRow[]);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [eventId, supabase]);

  /* -------- Reorder -------- */
  const handleDragEnd = (e: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id);
      const newIndex = prev.findIndex((r) => r.id === over.id);
      const moved = arrayMove(prev, oldIndex, newIndex).map((r, i) => ({
        ...r,
        order_index: i,
      }));
      queueSave(moved);
      return moved;
    });
  };

  /* -------- Save batching -------- */
  const queueSave = (items: SetlistRow[]) => {
    for (const it of items) {
      const normalized: SetlistRow = {
        ...it,
        event_id: it.event_id ?? eventId,
        musical_key: it.musical_key ?? null,
        bpm: it.bpm ?? null,
        notes: it.notes ?? null,
      };
      if (!normalized.id || !normalized.event_id) continue;
      saveQueue.current[normalized.id] = normalized;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSaves, 500);
  };

  const flushSaves = async () => {
    const payload = Object.values(saveQueue.current);
    saveQueue.current = {};
    if (payload.length === 0) return;

    const cleaned = payload.map((r) => JSON.parse(JSON.stringify(r)));
    const { error } = await supabase
      .from('event_setlist_items')
      .upsert(cleaned);
    if (error) console.error('Save setlist error:', error);
  };

  /* -------- Add song -------- */
  const handleAddSong = async () => {
    const order_index = rows.length;
    const insert = {
      event_id: eventId,
      title: 'New Song',
      musical_key: null as string | null,
      bpm: null as number | null,
      notes: null as string | null,
      order_index,
    };

    const { data, error } = await supabase
      .from('event_setlist_items')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      console.error('Add song error:', error);
      return;
    }
    setRows((prev) => [...prev, data as SetlistRow]);
    setEdits((m) => ({
      ...m,
      [(data as SetlistRow).id]: { title: 'New Song' },
    }));
  };

  /* -------- Inline editing -------- */
  const startEdit = (rowId: string) => {
    if (edits[rowId]) return;
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    setEdits((m) => ({
      ...m,
      [rowId]: {
        title: row.title,
        musical_key: row.musical_key ?? '',
        bpm: row.bpm ?? undefined,
        notes: row.notes ?? '',
      },
    }));
  };

  const cancelEdit = (rowId: string) => {
    setEdits(({ [rowId]: _, ...rest }) => rest);
  };

  const commitEdit = (rowId: string) => {
    const patch = edits[rowId];
    if (!patch) return;

    const base = rows.find((r) => r.id === rowId);
    if (!base) return;

    const toSave: SetlistRow = {
      ...base,
      ...patch,
      event_id: base.event_id ?? eventId,
    };

    setRows((prev) => prev.map((r) => (r.id === rowId ? toSave : r)));
    queueSave([toSave]);
    cancelEdit(rowId);
  };

  const handleChange =
    (rowId: string, field: keyof SetlistRow) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      let v: any = raw;

      if (field === 'bpm') {
        v = raw === '' ? null : Number(raw);
        if (Number.isNaN(v)) v = null;
      }

      setEdits((m) => ({ ...m, [rowId]: { ...m[rowId], [field]: v } }));
    };

  /* -------- Templates -------- */
  const openSaveDlg = () => setSaveDlgOpen(true);
  const closeSaveDlg = () => {
    setTemplateName('');
    setSaveDlgOpen(false);
  };

  const saveTemplate = async () => {
    if (!bandId || !templateName.trim()) return;

    const { data: tmpl, error: tErr } = await supabase
      .from('setlist_templates')
      .insert({ band_id: bandId, name: templateName.trim() })
      .select('id')
      .single();
    if (tErr || !tmpl) {
      console.error('Create template error:', tErr);
      return;
    }
    const templateId = tmpl.id as string;

    const items = rows
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((r, i) => ({
        template_id: templateId,
        order_index: i,
        title: r.title,
        musical_key: r.musical_key,
        bpm: r.bpm,
        notes: r.notes,
      }));

    const { error: iErr } = await supabase
      .from('setlist_template_items')
      .insert(items);
    if (iErr) {
      console.error('Insert template items error:', iErr);
      return;
    }
    closeSaveDlg();
  };

  const openLoadDlg = async () => {
    setLoadDlgOpen(true);
    const { data, error } = await supabase
      .from('setlist_templates')
      .select('id,name')
      .eq('band_id', bandId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch templates error:', error);
      setTemplates([]);
    } else {
      setTemplates((data || []) as Template[]);
    }
  };

  const closeLoadDlg = () => {
    setSelectedTemplateId('');
    setApplyMode('replace');
    setLoadDlgOpen(false);
  };

  const applyTemplate = async () => {
    if (!selectedTemplateId) return;

    const { data: tItems, error } = await supabase
      .from('setlist_template_items')
      .select('*')
      .eq('template_id', selectedTemplateId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Fetch template items error:', error);
      return;
    }

    const items = (tItems || []) as TemplateItem[];

    if (applyMode === 'replace') {
      const { error: delErr } = await supabase
        .from('event_setlist_items')
        .delete()
        .eq('event_id', eventId);
      if (delErr) {
        console.error('Clear event setlist error:', delErr);
        return;
      }
      setRows([]);
    }

    const startIndex = applyMode === 'append' ? rows.length : 0;

    const inserts = items.map((it, i) => ({
      event_id: eventId,
      title: it.title,
      musical_key: it.musical_key,
      bpm: it.bpm,
      notes: it.notes,
      order_index: startIndex + i,
    }));

    const { data: newRows, error: insErr } = await supabase
      .from('event_setlist_items')
      .insert(inserts)
      .select('*')
      .order('order_index', { ascending: true });

    if (insErr) {
      console.error('Apply template insert error:', insErr);
      return;
    }

    if (applyMode === 'replace') {
      setRows(newRows as SetlistRow[]);
    } else {
      setRows((prev) => [...prev, ...(newRows as SetlistRow[])]);
    }

    closeLoadDlg();
  };

  /* -------------------------- Render -------------------------- */
  return (
    <Box
      sx={{
        width: '100%',
        // more room on desktop
        px: { xs: 1.5, sm: 2, md: 3, lg: 5, xl: 7 },
        ...(isMobile && {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
        }),
      }}
    >
      {/* Empty vs List/Table */}
      {!loading && rows.length === 0 ? (
        <EmptySetlist onAdd={handleAddSong} />
      ) : isMobile ? (
        /* ------------- Mobile: scrollable card list ------------- */
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            // space for pinned bottom bar
            pb: 'calc(env(safe-area-inset-bottom) + 72px)',
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => {
              if (!isAdmin) return; // guard reorder
              handleDragEnd(e);
            }}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1}>
                {rows.map((row, idx) => {
                  const edit = edits[row.id];
                  const isEditing = Boolean(edit);

                  return (
                    <MobileSortableRow
                      key={row.id}
                      id={row.id}
                      index={idx}
                      isAdmin={isAdmin}
                      isEditing={isEditing}
                      onEdit={() => startEdit(row.id)}
                      onCancel={() => cancelEdit(row.id)}
                      onSave={() => commitEdit(row.id)}
                      onDelete={() => {
                        const target = rows.find((r) => r.id === row.id);
                        if (!target) return;
                        setDeleteTarget(target);
                        setDeleteDlgOpen(true);
                      }}
                      values={{
                        title: edit?.title,
                        musical_key: edit?.musical_key ?? null,
                        bpm: (edit?.bpm as number | null) ?? null,
                        notes: edit?.notes ?? null,
                        display: {
                          title: row.title,
                          musical_key: row.musical_key,
                          bpm: row.bpm,
                          notes: row.notes,
                        },
                      }}
                      onChange={(field) => handleChange(row.id, field)}
                    />
                  );
                })}
              </Stack>
            </SortableContext>
          </DndContext>
        </Box>
      ) : (
        /* ------------- Desktop: table view + floating grid-aligned buttons ------------- */
        <Box sx={{ mt: 1 }}>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => {
                if (!isAdmin) return;
                handleDragEnd(e);
              }}
              modifiers={[restrictToVerticalAxis]}
            >
              <Table size="small" aria-label="Setlist (draggable)">
                <TableHead
                  sx={{
                    '& th': {
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', md: '0.975rem' },
                      py: { xs: 1, md: 1.25 },
                    },
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ width: 44 }} />
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Song</TableCell>
                    <TableCell sx={{ width: 120 }}>Key</TableCell>
                    <TableCell sx={{ width: 100 }}>BPM</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell sx={{ width: 120 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody sx={{ '& td': { py: { xs: 0.75, md: 1.25 } } }}>
                  <SortableContext
                    items={rows.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row, idx) => {
                      const edit = edits[row.id];
                      const isEditing = Boolean(edit);

                      return (
                        <DesktopSortableRow
                          key={row.id}
                          id={row.id}
                          isAdmin={isAdmin}
                        >
                          <TableCell sx={{ width: 56, pr: 2 }}>
                            {idx + 1}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={edit.title ?? ''}
                                onChange={handleChange(row.id, 'title')}
                                placeholder="Song title"
                              />
                            ) : (
                              row.title
                            )}
                          </TableCell>

                          <TableCell sx={{ width: 120 }}>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={edit.musical_key ?? ''}
                                onChange={handleChange(row.id, 'musical_key')}
                                placeholder="Key (e.g., C, Gm)"
                              />
                            ) : (
                              row.musical_key ?? ''
                            )}
                          </TableCell>

                          <TableCell sx={{ width: 100 }}>
                            {isEditing ? (
                              <TextField
                                size="small"
                                type="number"
                                value={edit.bpm ?? ''}
                                onChange={handleChange(row.id, 'bpm')}
                                placeholder="BPM"
                                inputProps={{ min: 0 }}
                              />
                            ) : (
                              row.bpm ?? ''
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                fullWidth
                                value={edit.notes ?? ''}
                                onChange={handleChange(row.id, 'notes')}
                                placeholder="Notes"
                              />
                            ) : (
                              row.notes ?? ''
                            )}
                          </TableCell>

                          <TableCell align="right" sx={{ width: 120 }}>
                            {isEditing ? (
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                              >
                                <IconButton
                                  size="small"
                                  aria-label="Save"
                                  onClick={() => commitEdit(row.id)}
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Cancel"
                                  onClick={() => cancelEdit(row.id)}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Delete"
                                  onClick={() => {
                                    const target = rows.find(
                                      (r) => r.id === row.id
                                    );
                                    if (!target) return;
                                    setDeleteTarget(target);
                                    setDeleteDlgOpen(true);
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            ) : (
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                              >
                                <IconButton
                                  size="small"
                                  aria-label="Edit"
                                  onClick={() => startEdit(row.id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Delete"
                                  onClick={() => {
                                    const target = rows.find(
                                      (r) => r.id === row.id
                                    );
                                    if (!target) return;
                                    setDeleteTarget(target);
                                    setDeleteDlgOpen(true);
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            )}
                          </TableCell>
                        </DesktopSortableRow>
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </TableContainer>

          {/* Actions BELOW the grid, right-aligned, in normal flow */}
          {!isMobile && isAdmin && !loading && rows.length > 0 && (
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={1}
              sx={{ mt: 1.25 }}
            >
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSong}
              >
                Add song
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={openSaveDlg}
              >
                Save as template
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={openLoadDlg}
              >
                Load
              </Button>
            </Stack>
          )}
        </Box>
      )}

      {/* MOBILE pinned bottom action bar (icons only, black, no radius) */}
      {isMobile && isAdmin && !loading && rows.length > 0 && (
        <Portal>
          <Paper
            elevation={8}
            square
            sx={(t) => ({
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: (t.zIndex.modal ?? 1300) + 1,
              bgcolor: '#000',
              color: t.palette.primary.contrastText,
              py: 1,
              px: 2,
              pb: `calc(env(safe-area-inset-bottom) + 8px)`,
              borderTop: `1px solid ${t.palette.divider}`,
            })}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-around"
              spacing={2}
            >
              <IconButton
                aria-label="Add song"
                onClick={handleAddSong}
                sx={{ color: 'primary.main' }}
                size="large"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                aria-label="Save as template"
                onClick={openSaveDlg}
                sx={{ color: 'primary.main' }}
                size="large"
              >
                <SaveIcon />
              </IconButton>

              <IconButton
                aria-label="Load template"
                onClick={openLoadDlg}
                sx={{ color: 'primary.main' }}
                size="large"
              >
                <ReplayIcon />
              </IconButton>
            </Stack>
          </Paper>
        </Portal>
      )}

      {loading && (
        <Typography variant="body2" sx={{ mt: 1.25, opacity: 0.7 }}>
          Loading setlist…
        </Typography>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDlgOpen}
        onClose={
          deleting
            ? undefined
            : () => {
                setDeleteDlgOpen(false);
                setDeleteTarget(null);
              }
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon fontSize="small" />
          Delete song?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This will remove{' '}
            <strong>{deleteTarget?.title || 'this song'}</strong> from the
            setlist.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDlgOpen(false);
              setDeleteTarget(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!deleteTarget) return;
              setDeleting(true);
              const { error } = await supabase
                .from('event_setlist_items')
                .delete()
                .eq('id', deleteTarget.id);
              if (error) {
                console.error('Delete song error:', error);
                setDeleting(false);
                return;
              }
              setRows((prev) => {
                const remaining = prev.filter((r) => r.id !== deleteTarget.id);
                const renumbered = remaining.map((r, i) => ({
                  ...r,
                  order_index: i,
                }));
                queueSave(renumbered);
                return renumbered;
              });
              setDeleting(false);
              setDeleteDlgOpen(false);
              setDeleteTarget(null);
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Template */}
      <Dialog open={saveDlgOpen} onClose={closeSaveDlg} fullWidth maxWidth="xs">
        <DialogTitle>Save setlist as template</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            label="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., 45-min Rock Set"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSaveDlg}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveTemplate}
            disabled={!templateName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Template */}
      <Dialog open={loadDlgOpen} onClose={closeLoadDlg} fullWidth maxWidth="xs">
        <DialogTitle>Load template</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="tmpl-label">Template</InputLabel>
            <Select
              labelId="tmpl-label"
              label="Template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(String(e.target.value))}
            >
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="apply-mode-label">Apply mode</InputLabel>
            <Select
              labelId="apply-mode-label"
              label="Apply mode"
              value={applyMode}
              onChange={(e) =>
                setApplyMode(e.target.value as 'replace' | 'append')
              }
            >
              <MenuItem value="replace">Replace current setlist</MenuItem>
              <MenuItem value="append">Append to current setlist</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLoadDlg}>Cancel</Button>
          <Button
            variant="contained"
            onClick={applyTemplate}
            disabled={!selectedTemplateId}
          >
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ---------------------- Empty State ---------------------- */
function EmptySetlist({ onAdd }: { onAdd: () => void }) {
  return (
    <Paper
      variant="outlined"
      sx={(t) => ({
        borderStyle: 'dashed',
        borderColor: t.palette.divider,
        p: 4,
        borderRadius: 2,
        textAlign: 'center',
        bgcolor:
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.02)'
            : 'background.paper',
      })}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={(t) => ({
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: t.palette.action.hover,
          })}
        >
          <MusicNoteIcon />
        </Box>

        <Typography variant="h6" sx={{ mt: 0.5 }}>
          No songs in this setlist (yet)
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 460 }}>
          Tap <strong>Add song</strong> to get started. Drag to reorder, edit
          inline, and save this set as a template.
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          <Button variant="contained" onClick={onAdd}>
            Add song
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

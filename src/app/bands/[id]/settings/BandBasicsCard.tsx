/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  bandId: string;
  initialName: string;
};

type GenreRow = { id: string; name: string };

export default function BandBasicsCard({ bandId, initialName }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSave() {
    const next = name.trim();
    if (!next) {
      setErr('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const { error } = await sb
        .from('bands')
        .update({ name: next })
        .eq('id', bandId);
      if (error) throw new Error(error.message);

      setOk('Band name updated.');
    } catch (e: any) {
      setErr(e?.message || 'Failed to update band name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Band Basics"
        subheader="Update your band’s display name and genres"
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Name row */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label="Band name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr(null);
                setOk(null);
              }}
              size="small"
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <Button
              variant="contained"
              onClick={onSave}
              disabled={saving || name.trim() === initialName.trim()}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>

          {/* Genres editor */}
          <GenresSelectorInline bandId={bandId} />

          {/* Status */}
          {err && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {err}
            </Typography>
          )}
          {ok && (
            <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
              {ok}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* -------------------- Genres Selector (inline) -------------------- */

function GenresSelectorInline({ bandId }: { bandId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<GenreRow[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GenreRow[]>([]);
  const debounceRef = useRef<number | null>(null);

  const loadSelected = useCallback(async () => {
    setErr(null);
    const { data, error } = await sb
      .from('band_genres')
      .select('genre_id, genres(id, name)')
      .eq('band_id', bandId)
      .order('genres(name)');
    if (error) {
      setErr(error.message);
      return;
    }
    const rows = (data ?? [])
      .map((r: any) => r.genres)
      .filter(Boolean) as GenreRow[];
    setSelected(rows);
  }, [sb, bandId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSelected();
      setLoading(false);
    })();
  }, [loadSelected]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearching(false);
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      const { data, error } = await sb
        .from('genres')
        .select('id, name')
        .ilike('name', `%${query.trim()}%`)
        .order('name')
        .limit(20);

      setSearching(false);
      if (error) {
        setErr(error.message);
        return;
      }
      const selectedIds = new Set(selected.map((g) => g.id));
      setResults((data ?? []).filter((g) => !selectedIds.has(g.id)));
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, sb, selected]);

  const attachGenre = useCallback(
    async (g: GenreRow) => {
      // optimistic
      setSelected((prev) =>
        prev.find((x) => x.id === g.id) ? prev : [...prev, g]
      );
      const { error } = await sb
        .from('band_genres')
        .upsert(
          { band_id: bandId, genre_id: g.id },
          { onConflict: 'band_id,genre_id' }
        );
      if (error) {
        // revert on error
        setSelected((prev) => prev.filter((x) => x.id !== g.id));
        setErr(error.message);
      } else {
        setQuery('');
        setResults([]);
      }
    },
    [sb, bandId]
  );

  const detachGenre = useCallback(
    async (genreId: string) => {
      const old = selected;
      setSelected((prev) => prev.filter((g) => g.id !== genreId));
      const { error } = await sb
        .from('band_genres')
        .delete()
        .match({ band_id: bandId, genre_id: genreId });
      if (error) {
        setSelected(old); // revert
        setErr(error.message);
      }
    },
    [sb, bandId, selected]
  );

  const createAndAttach = useCallback(
    async (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      const { data: g, error: gErr } = await sb
        .from('genres')
        .upsert({ name: clean }, { onConflict: 'name' })
        .select('id, name')
        .single();
      if (gErr) {
        setErr(gErr.message);
        return;
      }
      await attachGenre(g as GenreRow);
    },
    [sb, attachGenre]
  );

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        Genres
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {loading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        ) : selected.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            No genres yet — add a few to describe your sound.
          </Typography>
        ) : (
          selected.map((g) => (
            <Chip
              key={g.id}
              label={g.name}
              size="small"
              onDelete={() => detachGenre(g.id)}
              deleteIcon={<CloseIcon />}
              sx={(t) => ({
                height: 26,
                borderRadius: 2,
                fontWeight: 700,
                letterSpacing: 0.2,
                bgcolor: 'rgba(255,255,255,0.06)',
                color: 'inherit',
                border: `1px solid ${alpha(t.palette.primary.main, 0.24)}`,
                '& .MuiChip-label': { px: 1 },
              })}
            />
          ))
        )}
      </Stack>

      {/* Search / Create */}
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Create a genre…"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searching ? (
                <CircularProgress size={16} />
              ) : (
                <SearchIcon fontSize="small" />
              )}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ fontWeight: 800, borderRadius: 2 }}
                onClick={() => createAndAttach(query)}
              >
                Create “{query.trim()}”
              </Button>
            </InputAdornment>
          ) : undefined,
          sx: {
            bgcolor: '#11131a',
            color: 'white',
          },
        }}
      />

      {results.length > 0 && (
        <List
          dense
          disablePadding
          sx={(t) => ({
            mt: 0.5,
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            maxHeight: 240,
            overflowY: 'auto',
          })}
        >
          {results.map((g) => (
            <ListItemButton
              key={g.id}
              onClick={() => attachGenre(g)}
              sx={(t) => ({
                px: 1.25,
                py: 1,
                '&:hover': {
                  backgroundColor: alpha(t.palette.primary.main, 0.06),
                  borderRadius: 2,
                },
              })}
            >
              <ListItemText
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
                primary={g.name}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {err && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {err}
        </Typography>
      )}
    </Stack>
  );
}

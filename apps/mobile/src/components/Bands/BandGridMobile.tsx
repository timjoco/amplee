import type { BandWithRole } from '../../types/bands';
import BandTileMobile from './BandTileMobile';

type Props = {
  bands: BandWithRole[];
  selectedId?: string;
  onSelect: (band: BandWithRole) => void;
  gapPx?: number;
  /** avatar size inside each tile (px) */
  avatarSize?: number;
};

export default function BandGridMobile({
  bands,
  selectedId,
  onSelect,
  gapPx = 10, // ⬅️ a bit more breathing room between tiles
  avatarSize = 50,
}: Props) {
  return (
    <div style={{ paddingInline: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: gapPx,
          alignItems: 'stretch',
        }}
      >
        {bands.map((b) => (
          <div
            key={b.id}
            style={{
              width: '100%',
              minHeight: 0,
              aspectRatio: '1 / 1',
            }}
          >
            <BandTileMobile
              id={b.id}
              name={b.name}
              bandRole={b.role}
              avatar_url={b.avatar_url ?? null}
              selected={selectedId === b.id}
              size={avatarSize}
              onClick={() => onSelect(b)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export type { BandWithRole };

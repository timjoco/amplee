// apps/mobile/src/components/Bands/BandGridMobile.tsx
import type { BandWithRole } from '../../types/bands';
import BandTileMobile from './BandTileMobile';

type Props = {
  bands: BandWithRole[];
  selectedId?: string;
  onSelect: (band: BandWithRole) => void;
  /** spacing between tiles (px) */
  gapPx?: number;
  /** avatar size inside each tile (px) */
  avatarSize?: number;
};

export default function BandGridMobile({
  bands,
  selectedId,
  onSelect,
  gapPx = 8, // tighter than before
  avatarSize = 92, // slightly smaller avatar for a tighter feel
}: Props) {
  return (
    <div style={{ paddingInline: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', // exactly 2 cols
          gap: gapPx, // tighter gap
          alignItems: 'start',
        }}
      >
        {bands.map((b) => (
          <div key={b.id} style={{ width: '100%', aspectRatio: '1 / 1' }}>
            <BandTileMobile
              id={b.id}
              name={b.name}
              bandRole={b.role}
              avatar_url={b.avatar_url ?? null}
              selected={selectedId === b.id}
              size={avatarSize} // smaller avatar renders “closer” tiles
              onClick={() => onSelect(b)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export type { BandWithRole };

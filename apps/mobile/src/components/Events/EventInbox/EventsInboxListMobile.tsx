/* eslint-disable @typescript-eslint/no-explicit-any */

import EventInboxArchivedMobile from './components/EventInboxArchivedMobile';
import EventInboxBandMobile from './components/EventInboxBandMobile';
import EventInboxHomeMobile from './components/EventInboxHomeMobile';

export default function EventInboxListMobile({
  onLoaded,
  bandId,
  showAvatars = true,
  enableCreateForBand = false,
  isAdmin = false,
  adminBandIds = [],
  suppressEmptyState = false,
  showArchived = false,
  clientFilterBandId,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  showArchived?: boolean;
  clientFilterBandId?: string;
}) {
  // Archived view wins if requested
  if (showArchived) {
    return (
      <EventInboxArchivedMobile
        onLoaded={onLoaded}
        bandId={bandId}
        showAvatars={showAvatars}
        isAdmin={isAdmin}
        adminBandIds={adminBandIds}
        suppressEmptyState={suppressEmptyState}
        clientFilterBandId={clientFilterBandId}
      />
    );
  }

  // Band-scoped view
  if (bandId) {
    return (
      <EventInboxBandMobile
        onLoaded={onLoaded}
        bandId={bandId}
        showAvatars={showAvatars}
        enableCreateForBand={enableCreateForBand}
        isAdmin={isAdmin}
        adminBandIds={adminBandIds}
        suppressEmptyState={suppressEmptyState}
        clientFilterBandId={clientFilterBandId}
      />
    );
  }

  // Home view (all bands)
  return (
    <EventInboxHomeMobile
      onLoaded={onLoaded}
      showAvatars={showAvatars}
      isAdmin={isAdmin}
      adminBandIds={adminBandIds}
      suppressEmptyState={suppressEmptyState}
      clientFilterBandId={clientFilterBandId}
    />
  );
}

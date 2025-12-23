/* eslint-disable @typescript-eslint/no-explicit-any */

import EventInboxArchivedMobile from './components/EventInboxArchivedMobile';
import EventInboxBandMobile from './components/EventInboxBandMobile';
import EventInboxDeclinedMobile from './components/EventInboxDeclinedMobile';
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
  showDeclined = false,
  showActive = true,
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
  showDeclined?: boolean;
  showActive?: boolean;
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

  // Declined view
  if (showDeclined) {
    return (
      <EventInboxDeclinedMobile
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

  // Band-scoped view (active events only)
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

  // Home view (all bands, active events only)
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

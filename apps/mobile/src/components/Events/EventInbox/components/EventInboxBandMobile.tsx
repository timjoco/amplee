import EventInboxListBaseMobile from './EventInboxListBaseMobile';

export default function EventInboxBandMobile(props: {
  onLoaded?: (count: number) => void;
  bandId: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  clientFilterBandId?: string;
}) {
  return (
    <EventInboxListBaseMobile
      scope="band"
      bandId={props.bandId}
      showAvatars={props.showAvatars ?? true}
      enableCreateForBand={props.enableCreateForBand ?? false}
      isAdmin={props.isAdmin ?? false}
      adminBandIds={props.adminBandIds ?? []}
      suppressEmptyState={props.suppressEmptyState ?? false}
      clientFilterBandId={props.clientFilterBandId}
      onLoaded={props.onLoaded}
      showArchived={false}
    />
  );
}

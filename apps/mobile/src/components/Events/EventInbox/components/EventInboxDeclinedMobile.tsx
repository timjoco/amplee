import EventInboxListBaseMobile from './EventInboxListBaseMobile';

export default function EventInboxDeclinedMobile(props: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  clientFilterBandId?: string;
}) {
  return (
    <EventInboxListBaseMobile
      scope={props.bandId ? 'band' : 'home'}
      bandId={props.bandId}
      showAvatars={props.showAvatars ?? true}
      isAdmin={props.isAdmin ?? false}
      adminBandIds={props.adminBandIds ?? []}
      suppressEmptyState={props.suppressEmptyState ?? false}
      clientFilterBandId={props.clientFilterBandId}
      onLoaded={props.onLoaded}
      showDeclined={true}
    />
  );
}

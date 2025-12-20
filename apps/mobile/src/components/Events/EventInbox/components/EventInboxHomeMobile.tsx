import EventInboxListBaseMobile from './EventInboxListBaseMobile';

export default function EventInboxHomeMobile(props: {
  onLoaded?: (count: number) => void;
  showAvatars?: boolean;
  isAdmin?: boolean;
  adminBandIds?: string[];
  suppressEmptyState?: boolean;
  clientFilterBandId?: string;
}) {
  return (
    <EventInboxListBaseMobile
      scope="home"
      showAvatars={props.showAvatars ?? true}
      isAdmin={props.isAdmin ?? false}
      adminBandIds={props.adminBandIds ?? []}
      suppressEmptyState={props.suppressEmptyState ?? false}
      clientFilterBandId={props.clientFilterBandId}
      onLoaded={props.onLoaded}
      showArchived={false}
    />
  );
}

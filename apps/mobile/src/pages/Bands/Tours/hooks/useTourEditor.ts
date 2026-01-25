import { useDndSensors } from './useDndSensors';
import { useHapticsPress } from './useHapticsPress';
import { useTourActions } from './useTourActions';
import { useTourFinancials } from './useTourFinancials';
import { useTourLoad } from './useTourLoad';
import { useTourStopReorder } from './useTourStopReorder';
import { useTourStops } from './useTourStops';

type UseTourEditorArgs = {
  bandId?: string;
  tourId?: string;
  onDeleted?: () => void;
};

export function useTourEditor({ bandId, tourId, onDeleted }: UseTourEditorArgs) {
  // UI state hooks
  const sensors = useDndSensors();
  const { pressedButton, triggerHaptic, handleButtonPress } = useHapticsPress();

  // Data loading
  const { loading, hasAttemptedLoad, tour, setTour, stops, setStops, reload } =
    useTourLoad(bandId, tourId);

  // Domain-specific feature hooks
  const { savingReorder, handleDragEnd } = useTourStopReorder({
    tourId,
    stops,
    setStops,
    triggerHaptic,
  });

  const stopsApi = useTourStops({
    tourId,
    stops,
    setStops,
    triggerHaptic,
  });

  const tourActions = useTourActions({
    tourId,
    tour,
    setTour,
    onDeleted,
  });

  const financials = useTourFinancials(stops);

  return {
    // Loading state
    loading,
    hasAttemptedLoad,
    // Data
    tour,
    stops,
    // UI
    sensors,
    pressedButton,
    handleButtonPress,
    triggerHaptic,
    // Reorder
    savingReorder,
    handleDragEnd,
    // Stops
    ...stopsApi,
    // Tour actions
    ...tourActions,
    // Financials
    financials,
    // Reload
    reload,
  };
}

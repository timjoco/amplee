/* eslint-disable @typescript-eslint/no-explicit-any */
import EventDateTimePicker from '../../ui/EventDateTimePicker';

type EventFormPickersShape = {
  showStartsPicker: boolean;
  showEndsPicker: boolean;

  starts: string;
  ends: string;

  setStarts: (iso: string) => void;
  setEnds: (iso: string) => void;

  setShowStartsPicker: (v: boolean) => void;
  setShowEndsPicker: (v: boolean) => void;
};

export default function EventPickers(props: {
  eventForm: EventFormPickersShape;
}) {
  const { eventForm } = props;

  return (
    <>
      <EventDateTimePicker
        open={eventForm.showStartsPicker}
        label="Event Start"
        value={eventForm.starts || undefined}
        onChange={(iso) => {
          if (iso) eventForm.setStarts(iso);
          eventForm.setShowStartsPicker(false);
        }}
        onDismiss={() => eventForm.setShowStartsPicker(false)}
      />

      <EventDateTimePicker
        open={eventForm.showEndsPicker}
        label="Event End"
        value={eventForm.ends || undefined}
        min={eventForm.starts || undefined}
        onChange={(iso) => {
          if (iso) eventForm.setEnds(iso);
          else eventForm.setEnds('');
          eventForm.setShowEndsPicker(false);
        }}
        onDismiss={() => eventForm.setShowEndsPicker(false)}
      />
    </>
  );
}

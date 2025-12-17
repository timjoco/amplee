/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import type { Step } from '../types';

type GlobalCreateDetail = {
  kind?: string;
  type?: string;
  bandId?: string;
  startsAt?: string; // full ISO
  date?: string; // optional "YYYY-MM-DD" fallback
};

type FormApi = {
  setBandId: (id: string) => void;
  setStarts?: (iso: string) => void;
};

export function useGlobalCreateEvents(params: {
  setOpen: (v: boolean) => void;
  setStep: (s: Step) => void;
  setError: (e: string | null) => void;

  eventForm: {
    setBandId: FormApi['setBandId'];
    setStarts: (iso: string) => void;
  };
  songForm: { setBandId: FormApi['setBandId'] };
  proposalForm: { setBandId: FormApi['setBandId'] };
}) {
  const { setOpen, setStep, setError, eventForm, songForm, proposalForm } =
    params;

  useEffect(() => {
    const onOpen = () => {
      setStep('menu');
      setOpen(true);
    };

    const onClose = () => setOpen(false);

    const onAmpleeGlobalCreate = (evt: Event) => {
      const custom = evt as CustomEvent<GlobalCreateDetail>;
      const detail = custom.detail || {};
      const kind = detail.kind ?? detail.type;

      setError(null);

      if (kind === 'event') {
        setStep('newEvent');
        if (detail.bandId) eventForm.setBandId(detail.bandId);

        if (detail.startsAt) eventForm.setStarts(detail.startsAt);
        else if (detail.date) {
          const dt = new Date(`${detail.date}T20:00:00`);
          if (!Number.isNaN(+dt)) eventForm.setStarts(dt.toISOString());
        }
      } else if (kind === 'song') {
        setStep('newSong');
        if (detail.bandId) songForm.setBandId(detail.bandId);
      } else if (kind === 'proposal') {
        setStep('newProposal');
        if (detail.bandId) proposalForm.setBandId(detail.bandId);
      } else {
        setStep('menu');
      }

      setOpen(true);
    };

    window.addEventListener('global-create:open', onOpen);
    window.addEventListener('global-create:close', onClose);
    window.addEventListener(
      'amplee:global-create',
      onAmpleeGlobalCreate as any
    );

    return () => {
      window.removeEventListener('global-create:open', onOpen);
      window.removeEventListener('global-create:close', onClose);
      window.removeEventListener(
        'amplee:global-create',
        onAmpleeGlobalCreate as any
      );
    };
  }, [setOpen, setStep, setError, eventForm, songForm, proposalForm]);
}

import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { addCircleOutline, calendarOutline, chevronBackOutline, clipboardOutline } from 'ionicons/icons';
import { useState } from 'react';

import EventDateTimePicker from '../../components/ui/EventDateTimePicker';
import { DateOptionCard } from './components/DateOptionCard';
import { DeleteProposalModal } from './components/DeleteProposalModal';
import { EditProposalModal } from './components/EditProposalModal';
import { ProposalDetailsCard } from './components/ProposalDetailsCard';
import { ProposalStatsHeader } from './components/ProposalStatsHeader';
import { useProposalData } from './hooks/useProposalData';
import type { Option } from './types';

export default function ProposedGigSheet() {
  const {
    bandId,
    nav,
    proposal,
    membersCount,
    myId,
    loading,
    saving,
    error,
    proposedByName,
    converting,
    deleting,
    isAdmin,
    savingProposal,
    availabilityByOptionId,
    vote,
    addOption,
    convert,
    deleteProposal,
    deleteOption,
    saveProposalEdits,
    saveOptionEdit,
  } = useProposalData();

  // Local UI state
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [showConvertAlert, setShowConvertAlert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);

  async function handleConvert(optionId: string) {
    const result = await convert(optionId);
    if (result.success) {
      setShowConvertAlert(true);
    }
  }

  async function handleDeleteProposal() {
    const success = await deleteProposal();
    if (success) {
      setShowDeleteConfirm(false);
    }
  }

  async function handleSaveProposalEdits(title: string, venue: string) {
    const success = await saveProposalEdits(title, venue);
    if (success) {
      setShowEditProposal(false);
    }
  }

  async function handleSaveOptionEdit(iso: string | null) {
    if (!editingOption || !iso) {
      setEditingOption(null);
      setShowEditDatePicker(false);
      return;
    }

    const success = await saveOptionEdit(editingOption.id, iso);
    if (success) {
      setEditingOption(null);
      setShowEditDatePicker(false);
    }
  }

  function startEditOption(option: Option) {
    setEditingOption(option);
    setShowEditDatePicker(true);
  }

  const renderBody = () => {
    if (loading) {
      return (
        <div
          style={{
            padding: 24,
            display: 'flex',
            justifyContent: 'center',
            marginTop: 48,
          }}
        >
          <IonSpinner name="crescent" style={{ color: 'rgba(251, 191, 36, 0.95)' }} />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: 16 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 16,
              background:
                'linear-gradient(135deg, rgba(127, 29, 29, 0.2), rgba(127, 29, 29, 0.1))',
              border: '1px solid rgba(248,113,113,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <IonText color="danger">
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </IonText>
          </div>
        </div>
      );
    }

    if (!proposal) return null;

    return (
      <div
        style={{
          padding: '16px 16px 80px 16px',
          background: 'linear-gradient(180deg, rgba(5,5,9,0) 0%, rgba(5,5,9,0.3) 100%)',
        }}
      >
        <ProposalStatsHeader options={proposal.options} membersCount={membersCount} />

        <ProposalDetailsCard
          proposal={proposal}
          myId={myId}
          proposedByName={proposedByName}
          isAdmin={isAdmin}
          onEdit={() => setShowEditProposal(true)}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        {/* DATE OPTIONS */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 16,
            padding: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 14,
              fontSize: 15,
              fontWeight: 700,
              color: 'rgba(251, 191, 36, 0.95)',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Vote on Dates
          </h3>

          {proposal.options.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={calendarOutline}
                  style={{ fontSize: 28, color: 'rgba(251, 191, 36, 0.95)' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>
                No date options yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {proposal.options.map((option) => (
                <DateOptionCard
                  key={option.id}
                  option={option}
                  membersCount={membersCount}
                  availability={availabilityByOptionId[option.id]}
                  isAdmin={isAdmin}
                  saving={saving}
                  converting={converting}
                  onVote={vote}
                  onConvert={handleConvert}
                  onEdit={startEditOption}
                  onDelete={deleteOption}
                />
              ))}
            </div>
          )}

          {isAdmin && (
            <div style={{ marginTop: 16 }}>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowAddDatePicker(true)}
                disabled={saving}
                style={
                  {
                    '--border-color': 'rgba(251, 191, 36, 0.5)',
                    '--color': 'rgba(251, 191, 36, 0.95)',
                    '--background-activated': 'rgba(251, 191, 36, 0.15)',
                    borderRadius: 12,
                  } as any
                }
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Add Date Option
              </IonButton>
            </div>
          )}
        </div>
      </div>
    );
  };

  const headerTitle = proposal?.title || 'Proposed Gig';

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={clipboardOutline}
                  style={{ color: '#f59e0b', fontSize: 20, flexShrink: 0 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {headerTitle}
                </h1>
              </div>
            </div>

            {/* Proposed Badge */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Proposed
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {renderBody()}
      </IonContent>

      {/* Add Date Picker */}
      <EventDateTimePicker
        open={showAddDatePicker}
        label="Add Date Option"
        value={undefined}
        onChange={(iso) => {
          if (iso) {
            addOption(iso);
          }
          setShowAddDatePicker(false);
        }}
        onDismiss={() => setShowAddDatePicker(false)}
      />

      {/* Edit Date Picker */}
      <EventDateTimePicker
        open={showEditDatePicker}
        label="Edit Date Option"
        value={editingOption?.starts_at || undefined}
        onChange={(iso) => {
          handleSaveOptionEdit(iso);
        }}
        onDismiss={() => {
          setShowEditDatePicker(false);
          setEditingOption(null);
        }}
      />

      <IonAlert
        isOpen={showConvertAlert}
        onDidDismiss={() => {
          setShowConvertAlert(false);
          if (bandId) {
            nav(`/bands/${bandId}`);
            window.dispatchEvent(
              new CustomEvent('amplee:band-tab', { detail: { tab: 'events' } })
            );
          } else {
            nav(-1);
          }
        }}
        header="Converted!"
        cssClass="custom-dark-alert delete-event-alert"
        message="This proposed gig is now a confirmed event."
        buttons={['OK']}
      />

      <DeleteProposalModal
        isOpen={showDeleteConfirm}
        deleting={deleting}
        onConfirm={handleDeleteProposal}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <EditProposalModal
        isOpen={showEditProposal}
        saving={savingProposal}
        initialTitle={proposal?.title ?? ''}
        initialVenue={proposal?.venue ?? ''}
        onSave={handleSaveProposalEdits}
        onCancel={() => setShowEditProposal(false)}
      />
    </IonPage>
  );
}

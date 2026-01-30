import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { sendOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Band = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Vendor = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export default function VendorContactPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [vendor, setVendor] = React.useState<Vendor | null>(null);
  const [bands, setBands] = React.useState<Band[]>([]);
  const [selectedBandId, setSelectedBandId] = React.useState<string>('');
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  // Load vendor and user's bands (where they are admin)
  React.useEffect(() => {
    const loadData = async () => {
      if (!vendorId) return;

      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        nav('/login');
        return;
      }

      // Load vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, name, avatar_url')
        .eq('id', vendorId)
        .single();

      if (vendorData) {
        setVendor(vendorData);
        setTitle(`Inquiry for ${vendorData.name}`);
      }

      // Load bands where user is admin
      const { data: memberships } = await supabase
        .from('band_members')
        .select('band_id, role, bands(id, name, avatar_url)')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (memberships) {
        const adminBands = memberships
          .map((m: any) => m.bands)
          .filter(Boolean) as Band[];
        setBands(adminBands);

        // Auto-select if only one band
        if (adminBands.length === 1) {
          setSelectedBandId(adminBands[0].id);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [vendorId, nav]);

  const handleSubmit = async () => {
    if (!selectedBandId) {
      alert('Please select a band');
      return;
    }
    if (!title.trim()) {
      alert('Please enter a subject');
      return;
    }
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the job
      const { data: job, error: jobError } = await supabase
        .from('vendor_jobs')
        .insert({
          vendor_id: vendorId,
          band_id: selectedBandId,
          created_by: user.id,
          title: title.trim(),
          description: message.trim(),
          status: 'inquiry',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create the initial message
      await supabase.from('vendor_job_messages').insert({
        job_id: job.id,
        user_id: user.id,
        body: message.trim(),
      });

      // Navigate to the job chat
      nav(`/jobs/${job.id}`, { replace: true });
    } catch (err) {
      console.error('Error creating job:', err);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/discover" />
            </IonButtons>
            <IonTitle>Contact Vendor</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (bands.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/discover" />
            </IonButtons>
            <IonTitle>Contact Vendor</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#050509' } as any}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#fff' }}>
              No Bands Found
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              You need to be an admin of a band to contact vendors.
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#050509' } as any}>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/discover/vendors/${vendorId}`} />
          </IonButtons>
          <IonTitle>Contact {vendor?.name || 'Vendor'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#050509' } as any}>
        <div style={{ padding: '20px 16px 100px' }}>
          {/* Vendor Info */}
          {vendor && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 14,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {vendor.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                  {vendor.name}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  New inquiry
                </div>
              </div>
            </div>
          )}

          {/* Select Band */}
          {bands.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                }}
              >
                Contacting on behalf of
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bands.map((band) => (
                  <button
                    key={band.id}
                    onClick={() => setSelectedBandId(band.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background:
                        selectedBandId === band.id
                          ? 'rgba(139, 92, 246, 0.15)'
                          : 'rgba(255,255,255,0.04)',
                      border:
                        selectedBandId === band.id
                          ? '1px solid rgba(139, 92, 246, 0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(139,92,246,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {band.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>
                      {band.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 8,
              }}
            >
              Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sound engineer for upcoming show"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                fontSize: 15,
                color: '#fff',
              }}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 8,
              }}
            >
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and describe what you're looking for..."
              rows={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                fontSize: 15,
                color: '#fff',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedBandId || !title.trim() || !message.trim()}
            style={{
              width: '100%',
              padding: '16px 24px',
              background:
                submitting || !selectedBandId || !title.trim() || !message.trim()
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              borderRadius: 14,
              border: 'none',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor:
                submitting || !selectedBandId || !title.trim() || !message.trim()
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting ? (
              <IonSpinner style={{ width: 20, height: 20 }} />
            ) : (
              <>
                <IonIcon icon={sendOutline} style={{ fontSize: 20 }} />
                Send Inquiry
              </>
            )}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}

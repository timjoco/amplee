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
import {
  chatbubbleOutline,
  createOutline,
  eyeOffOutline,
  eyeOutline,
  settingsOutline,
  starOutline,
  storefrontOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type VendorProfile = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  is_public: boolean;
  subscription_status: string;
  subscription_tier: string;
  total_jobs_completed: number;
  average_rating: number | null;
  review_count: number;
};

type VendorJob = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  band: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export default function VendorDashboardPage() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [vendor, setVendor] = React.useState<VendorProfile | null>(null);
  const [recentJobs, setRecentJobs] = React.useState<VendorJob[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        nav('/profile');
        return;
      }

      // Load vendor profile
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !vendorData) {
        // No vendor profile, redirect to create
        nav('/vendor/edit');
        return;
      }

      setVendor(vendorData);

      // Load recent jobs
      const { data: jobs } = await supabase
        .from('vendor_jobs')
        .select(`
          id,
          title,
          status,
          created_at,
          bands (
            id,
            name,
            avatar_url
          )
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobs) {
        setRecentJobs(
          jobs.map((j: any) => ({
            ...j,
            band: j.bands,
            bands: undefined,
          }))
        );
      }

      setLoading(false);
    };

    loadData();
  }, [nav]);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Vendor Dashboard</IonTitle>
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

  if (!vendor) {
    return null;
  }

  const isActive = vendor.subscription_status === 'active' && vendor.is_public;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#050509' } as any}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Vendor Dashboard</IonTitle>
          <IonButtons slot="end">
            <button
              onClick={() => nav('/vendor/edit')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={settingsOutline}
                style={{ fontSize: 22, color: '#fff' }}
              />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#050509' } as any}>
        <div style={{ padding: '20px 16px 100px' }}>
          {/* Profile Card */}
          <div
            style={{
              padding: 20,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 14 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {vendor.avatar_url ? (
                  <img
                    src={vendor.avatar_url}
                    alt={vendor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  vendor.name.charAt(0).toUpperCase()
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  {vendor.name}
                </h2>
                {(vendor.city || vendor.state) && (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                padding: '10px 14px',
                background: isActive
                  ? 'rgba(52, 211, 153, 0.1)'
                  : 'rgba(251, 191, 36, 0.1)',
                borderRadius: 10,
              }}
            >
              <IonIcon
                icon={isActive ? eyeOutline : eyeOffOutline}
                style={{
                  fontSize: 18,
                  color: isActive ? '#34D399' : '#FBbF24',
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? '#34D399' : '#FBBF24',
                }}
              >
                {isActive ? 'Visible on Discover' : 'Not visible - subscription required'}
              </span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => nav('/vendor/edit')}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
              Edit Profile
            </button>
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Jobs"
              value={vendor.total_jobs_completed.toString()}
              icon={storefrontOutline}
            />
            <StatCard
              label="Rating"
              value={vendor.average_rating ? vendor.average_rating.toFixed(1) : '-'}
              icon={starOutline}
            />
            <StatCard
              label="Reviews"
              value={vendor.review_count.toString()}
              icon={chatbubbleOutline}
            />
          </div>

          {/* Subscription CTA */}
          {!isActive && (
            <div
              style={{
                padding: 20,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.1) 100%)',
                borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.3)',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#fff' }}>
                Go Live on Discover
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                Subscribe to make your profile visible to bands looking for vendors like you.
              </p>
              <button
                onClick={() => nav('/vendor/subscribe')}
                style={{
                  padding: '12px 24px',
                  background: '#8B5CF6',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View Plans
              </button>
            </div>
          )}

          {/* Recent Jobs */}
          <div>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Recent Inquiries
            </h3>

            {recentJobs.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  textAlign: 'center',
                }}
              >
                <IonIcon
                  icon={chatbubbleOutline}
                  style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}
                />
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                  {isActive
                    ? 'No inquiries yet. Bands will see your profile on Discover.'
                    : 'Subscribe to start receiving inquiries from bands.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => nav(`/vendor/jobs/${job.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(139,92,246,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {job.band?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {job.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        from {job.band?.name || 'Unknown Band'}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        textAlign: 'center',
      }}
    >
      <IonIcon
        icon={icon}
        style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}
      />
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    inquiry: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
    quoted: { bg: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    accepted: { bg: 'rgba(52,211,153,0.2)', text: '#34D399' },
    completed: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
    declined: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
    cancelled: { bg: 'rgba(107,114,128,0.2)', text: '#9CA3AF' },
  };

  const color = colors[status] || colors.inquiry;

  return (
    <span
      style={{
        padding: '4px 10px',
        background: color.bg,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color: color.text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

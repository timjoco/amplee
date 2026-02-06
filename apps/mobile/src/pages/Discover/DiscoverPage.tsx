import {
  IonContent,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/react';
import { locationOutline, starOutline, storefrontOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type VendorCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type Vendor = {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  average_rating: number | null;
  review_count: number;
  categories: VendorCategory[];
};

export default function DiscoverPage() {
  const nav = useNavigate();

  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [categories, setCategories] = React.useState<VendorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // Load categories
  React.useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('vendor_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
    };

    loadCategories();
  }, []);

  // Load vendors
  const loadVendors = React.useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('vendors')
      .select(
        `
        id,
        name,
        slug,
        bio,
        avatar_url,
        city,
        state,
        average_rating,
        review_count,
        vendor_category_assignments (
          vendor_categories (
            id,
            name,
            slug,
            icon
          )
        )
      `
      )
      .eq('is_public', true)
      .eq('subscription_status', 'active')
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      console.warn('[Discover] Error loading vendors:', error.message);
      setLoading(false);
      return;
    }

    // Transform data
    const transformed: Vendor[] = (data || []).map((v: any) => ({
      ...v,
      categories:
        v.vendor_category_assignments?.map((a: any) => a.vendor_categories) || [],
      vendor_category_assignments: undefined,
    }));

    setVendors(transformed);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadVendors();
    event.detail.complete();
  };

  // Filter vendors by category and search
  const filteredVendors = React.useMemo(() => {
    let result = vendors;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((v) =>
        v.categories.some((c) => c.slug === selectedCategory)
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.bio?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q) ||
          v.state?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vendors, selectedCategory, searchQuery]);

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={
          {
            '--background': '#050509',
          } as any
        }
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Header */}
        <div
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 12,
            background: 'rgba(5, 5, 9, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            Discover
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Find engineers, designers & venues for your band
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 0' }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Search vendors..."
            style={{
              '--background': 'rgba(255,255,255,0.08)',
              '--color': '#fff',
              '--placeholder-color': 'rgba(255,255,255,0.4)',
              '--icon-color': 'rgba(255,255,255,0.4)',
              '--border-radius': '12px',
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ padding: '8px 16px 16px', overflowX: 'auto' }}>
          <IonSegment
            value={selectedCategory}
            onIonChange={(e) => setSelectedCategory(e.detail.value as string)}
            style={{
              '--background': 'rgba(255,255,255,0.05)',
            }}
          >
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            {categories.map((cat) => (
              <IonSegmentButton key={cat.id} value={cat.slug}>
                <IonLabel>{cat.name}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </div>

        {/* Vendors List */}
        <div
          style={{
            padding: '0 16px 120px',
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Loading vendors...
            </div>
          ) : filteredVendors.length === 0 ? (
            <EmptyState
              message={
                searchQuery
                  ? 'No vendors match your search'
                  : selectedCategory !== 'all'
                  ? 'No vendors in this category yet'
                  : 'No vendors available yet'
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onClick={() => nav(`/discover/vendors/${vendor.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

function VendorCard({
  vendor,
  onClick,
}: {
  vendor: Vendor;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        gap: 14,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          vendor.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {vendor.name}
        </h3>

        {/* Location */}
        {(vendor.city || vendor.state) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
            }}
          >
            <IonIcon icon={locationOutline} style={{ fontSize: 14 }} />
            <span>
              {[vendor.city, vendor.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Categories */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 8,
          }}
        >
          {vendor.categories.slice(0, 2).map((cat) => (
            <span
              key={cat.id}
              style={{
                padding: '3px 8px',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#A78BFA',
              }}
            >
              {cat.name}
            </span>
          ))}
        </div>

        {/* Rating */}
        {vendor.average_rating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              color: '#F59E0B',
              fontSize: 13,
            }}
          >
            <IonIcon icon={starOutline} style={{ fontSize: 14 }} />
            <span style={{ fontWeight: 600 }}>
              {vendor.average_rating.toFixed(1)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              ({vendor.review_count})
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <IonIcon
          icon={storefrontOutline}
          style={{ fontSize: 36, color: '#8B5CF6' }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 260,
        }}
      >
        {message}
      </p>
    </div>
  );
}

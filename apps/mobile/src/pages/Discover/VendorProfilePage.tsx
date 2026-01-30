import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import {
  callOutline,
  chatbubbleOutline,
  globeOutline,
  locationOutline,
  mailOutline,
  starOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type VendorCategory = {
  id: string;
  name: string;
  slug: string;
};

type VendorService = {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  price_unit: string | null;
};

type VendorReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_display_name?: string;
};

type VendorDetails = {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  state: string | null;
  country: string;
  website: string | null;
  average_rating: number | null;
  review_count: number;
  total_jobs_completed: number;
  categories: VendorCategory[];
  services: VendorService[];
};

export default function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const nav = useNavigate();

  const [vendor, setVendor] = React.useState<VendorDetails | null>(null);
  const [reviews, setReviews] = React.useState<VendorReview[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load vendor details
  React.useEffect(() => {
    const loadVendor = async () => {
      if (!vendorId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('vendors')
        .select(
          `
          *,
          vendor_category_assignments (
            vendor_categories (
              id,
              name,
              slug
            )
          ),
          vendor_services (
            id,
            name,
            description,
            base_price,
            price_unit,
            is_active,
            display_order
          )
        `
        )
        .eq('id', vendorId)
        .single();

      if (error) {
        console.warn('[VendorProfile] Error:', error.message);
        setLoading(false);
        return;
      }

      // Transform data
      const transformed: VendorDetails = {
        ...data,
        categories:
          data.vendor_category_assignments?.map(
            (a: any) => a.vendor_categories
          ) || [],
        services: (data.vendor_services || [])
          .filter((s: any) => s.is_active)
          .sort((a: any, b: any) => a.display_order - b.display_order),
        vendor_category_assignments: undefined,
        vendor_services: undefined,
      };

      setVendor(transformed);

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('vendor_reviews')
        .select('id, rating, title, body, created_at')
        .eq('vendor_id', vendorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) {
        setReviews(reviewsData);
      }

      setLoading(false);
    };

    loadVendor();
  }, [vendorId]);

  const handleContact = () => {
    if (!vendor) return;
    nav(`/discover/vendors/${vendor.id}/contact`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent
          style={{ '--background': '#050509' } as any}
          className="ion-padding"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Loading...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!vendor) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/discover" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent
          style={{ '--background': '#050509' } as any}
          className="ion-padding"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Vendor not found
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{ '--background': '#050509' } as any}
      >
        {/* Cover / Header */}
        <div
          style={{
            position: 'relative',
            height: 200,
            background: vendor.cover_image_url
              ? `url(${vendor.cover_image_url}) center/cover`
              : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
          }}
        >
          {/* Back button */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top) + 8px)',
              left: 12,
            }}
          >
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ←
            </button>
          </div>

          {/* Avatar */}
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: 20,
              width: 88,
              height: 88,
              borderRadius: 20,
              background: '#1a1a1f',
              border: '4px solid #050509',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: '#fff',
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
        </div>

        {/* Main Content */}
        <div style={{ padding: '52px 20px 120px' }}>
          {/* Name & Location */}
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 24,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {vendor.name}
          </h1>

          {(vendor.city || vendor.state) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 14,
              }}
            >
              <IonIcon icon={locationOutline} style={{ fontSize: 16 }} />
              <span>
                {[vendor.city, vendor.state, vendor.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          {/* Categories */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 12,
            }}
          >
            {vendor.categories.map((cat) => (
              <span
                key={cat.id}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#A78BFA',
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {vendor.average_rating && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#F59E0B',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  <IonIcon icon={starOutline} />
                  {vendor.average_rating.toFixed(1)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 2,
                  }}
                >
                  {vendor.review_count} reviews
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {vendor.total_jobs_completed}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 2,
                }}
              >
                jobs completed
              </div>
            </div>
          </div>

          {/* Bio */}
          {vendor.bio && (
            <div style={{ marginTop: 24 }}>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                About
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {vendor.bio}
              </p>
            </div>
          )}

          {/* Services */}
          {vendor.services.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Services
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vendor.services.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      padding: 14,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#fff',
                        }}
                      >
                        {service.name}
                      </h4>
                      {service.base_price && (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#34D399',
                          }}
                        >
                          ${service.base_price}
                          {service.price_unit && service.price_unit !== 'flat'
                            ? `/${service.price_unit}`
                            : ''}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Reviews
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: 14,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IonIcon
                          key={star}
                          icon={starOutline}
                          style={{
                            fontSize: 14,
                            color:
                              star <= review.rating
                                ? '#F59E0B'
                                : 'rgba(255,255,255,0.2)',
                          }}
                        />
                      ))}
                    </div>
                    {review.title && (
                      <h4
                        style={{
                          margin: '0 0 4px',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#fff',
                        }}
                      >
                        {review.title}
                      </h4>
                    )}
                    {review.body && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.6)',
                          lineHeight: 1.5,
                        }}
                      >
                        {review.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Website Link */}
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 24,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                color: '#A78BFA',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <IonIcon icon={globeOutline} style={{ fontSize: 18 }} />
              Visit Website
            </a>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            background: 'linear-gradient(0deg, rgba(5,5,9,1) 0%, rgba(5,5,9,0.95) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <button
            onClick={handleContact}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              borderRadius: 14,
              border: 'none',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            }}
          >
            <IonIcon icon={chatbubbleOutline} style={{ fontSize: 20 }} />
            Get in Touch
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}

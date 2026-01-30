import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonCheckbox,
} from '@ionic/react';
import { checkmarkOutline, storefrontOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type VendorCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type VendorProfile = {
  id: string;
  name: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  categories: string[]; // category IDs
};

export default function VendorProfileEditPage() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [categories, setCategories] = React.useState<VendorCategory[]>([]);
  const [existingVendorId, setExistingVendorId] = React.useState<string | null>(null);

  // Form state
  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  // Load categories and existing vendor profile
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        nav('/profile');
        return;
      }

      // Load categories
      const { data: cats } = await supabase
        .from('vendor_categories')
        .select('*')
        .order('display_order');

      if (cats) {
        setCategories(cats);
      }

      // Check if user has existing vendor profile
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_category_assignments (
            category_id
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVendor) {
        setExistingVendorId(existingVendor.id);
        setName(existingVendor.name || '');
        setBio(existingVendor.bio || '');
        setCity(existingVendor.city || '');
        setState(existingVendor.state || '');
        setEmail(existingVendor.email || user.email || '');
        setPhone(existingVendor.phone || '');
        setWebsite(existingVendor.website || '');
        setSelectedCategories(
          existingVendor.vendor_category_assignments?.map((a: any) => a.category_id) || []
        );
      } else {
        // Pre-fill email from user
        setEmail(user.email || '');
      }

      setLoading(false);
    };

    loadData();
  }, [nav]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a business name');
      return;
    }
    if (!email.trim()) {
      alert('Please enter an email');
      return;
    }
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (existingVendorId) {
        // Update existing vendor
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            name: name.trim(),
            bio: bio.trim() || null,
            city: city.trim() || null,
            state: state.trim() || null,
            email: email.trim(),
            phone: phone.trim() || null,
            website: website.trim() || null,
          })
          .eq('id', existingVendorId);

        if (updateError) throw updateError;

        // Update categories - delete and re-insert
        await supabase
          .from('vendor_category_assignments')
          .delete()
          .eq('vendor_id', existingVendorId);

        if (selectedCategories.length > 0) {
          await supabase.from('vendor_category_assignments').insert(
            selectedCategories.map((catId) => ({
              vendor_id: existingVendorId,
              category_id: catId,
            }))
          );
        }
      } else {
        // Create new vendor
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const { data: newVendor, error: insertError } = await supabase
          .from('vendors')
          .insert({
            user_id: user.id,
            name: name.trim(),
            slug: `${slug}-${Date.now().toString(36)}`,
            bio: bio.trim() || null,
            city: city.trim() || null,
            state: state.trim() || null,
            email: email.trim(),
            phone: phone.trim() || null,
            website: website.trim() || null,
            is_public: false,
            subscription_status: 'none',
            subscription_tier: 'free',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert category assignments
        if (selectedCategories.length > 0 && newVendor) {
          await supabase.from('vendor_category_assignments').insert(
            selectedCategories.map((catId) => ({
              vendor_id: newVendor.id,
              category_id: catId,
            }))
          );
        }

        setExistingVendorId(newVendor?.id || null);
      }

      // Navigate to vendor dashboard or back to profile
      nav('/vendor/dashboard');
    } catch (err) {
      console.error('Error saving vendor:', err);
      alert('Failed to save vendor profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': '#050509' } as any}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Vendor Profile</IonTitle>
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#050509' } as any}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>{existingVendorId ? 'Edit Vendor Profile' : 'Become a Vendor'}</IonTitle>
          <IonButtons slot="end">
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8B5CF6',
                fontWeight: 600,
                fontSize: 16,
                padding: '8px 16px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#050509' } as any}>
        <div style={{ padding: '20px 16px 100px' }}>
          {/* Header */}
          {!existingVendorId && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: 28,
                padding: '0 12px',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <IonIcon
                  icon={storefrontOutline}
                  style={{ fontSize: 32, color: '#8B5CF6' }}
                />
              </div>
              <h2
                style={{
                  margin: '0 0 8px',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                Create Your Vendor Profile
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.5,
                }}
              >
                Get discovered by bands looking for engineers, designers, and venues.
              </p>
            </div>
          )}

          {/* Business Info Section */}
          <SectionHeader title="Business Info" />
          <div style={{ marginBottom: 24 }}>
            <InputField
              label="Business Name"
              value={name}
              onChange={setName}
              placeholder="e.g., Sound Solutions LLC"
              required
            />
            <InputField
              label="Bio / Description"
              value={bio}
              onChange={setBio}
              placeholder="Tell bands about your services..."
              multiline
            />
          </div>

          {/* Categories Section */}
          <SectionHeader title="Categories" subtitle="Select all that apply" />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: selectedCategories.includes(cat.id)
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: selectedCategories.includes(cat.id)
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
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: selectedCategories.includes(cat.id)
                      ? '#8B5CF6'
                      : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selectedCategories.includes(cat.id) && (
                    <IonIcon
                      icon={checkmarkOutline}
                      style={{ fontSize: 16, color: '#fff' }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {cat.name}
                  </div>
                  {cat.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: 2,
                      }}
                    >
                      {cat.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Location Section */}
          <SectionHeader title="Location" />
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <InputField
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="Kansas City"
                />
              </div>
              <div style={{ width: 100 }}>
                <InputField
                  label="State"
                  value={state}
                  onChange={setState}
                  placeholder="MO"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <SectionHeader title="Contact Info" />
          <div style={{ marginBottom: 24 }}>
            <InputField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              required
            />
            <InputField
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="(555) 123-4567"
              type="tel"
            />
            <InputField
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="https://yoursite.com"
              type="url"
            />
          </div>

          {/* Info Box */}
          <div
            style={{
              padding: 16,
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
              }}
            >
              Your profile will be saved as a draft. To appear on the Discover page
              and receive inquiries from bands, you'll need to activate a subscription.
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            fontSize: 15,
            color: '#fff',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            fontSize: 15,
            color: '#fff',
          }}
        />
      )}
    </div>
  );
}

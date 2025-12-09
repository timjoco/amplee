/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
  cloudUploadOutline,
  contrastOutline,
  copyOutline,
  cubeOutline,
  flowerOutline,
  globeOutline,
  imageOutline,
  linkOutline,
  locationOutline,
  logoApple,
  logoFacebook,
  logoInstagram,
  logoSoundcloud,
  logoTiktok,
  logoTwitter,
  logoYoutube,
  mailOutline,
  moonOutline,
  musicalNotesOutline,
  reorderThreeOutline,
  sparklesOutline,
  sunnyOutline,
  terminalOutline,
  trashOutline,
  videocamOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ============================================
// TYPES
// ============================================
type MembershipRole = 'admin' | 'member';

type BandThemeStyle =
  | 'cosmic'
  | 'cosmic-light'
  | 'matrix'
  | 'blocky'
  | 'modest'
  | 'modest-dark'
  | 'sakura';

type BandProfileRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  public_bio: string | null;
  city: string | null;
  state: string | null;
  public_slug: string | null;
  is_public: boolean;
  public_avatar_enabled: boolean;
  embedded_video_url: string | null;
  gallery_images: string[] | null;
  public_theme: string | null;
  contact_email: string | null;
  public_allow_contact: boolean | null;
};

type LinkItem = {
  id: string;
  type: string;
  label: string;
  url: string;
  icon: string;
  color: string;
  category: 'music' | 'social';
};

// Theme configuration
type ThemeConfig = {
  id: BandThemeStyle;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  accentColor: string;
  checkColor: string;
};

const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'cosmic',
    name: 'Cosmic',
    description: 'Animated gradients, glassmorphism, neon glows',
    icon: sparklesOutline,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    accentColor: 'rgba(139, 92, 246, 0.6)',
    checkColor: '#a78bfa',
  },
  {
    id: 'cosmic-light',
    name: 'Cosmic Light',
    description: 'Same spacey vibes on a bright background',
    icon: sunnyOutline,
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
    accentColor: 'rgba(167, 139, 250, 0.6)',
    checkColor: '#a78bfa',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Terminal vibes, falling code, hacker aesthetic',
    icon: terminalOutline,
    gradient: 'linear-gradient(135deg, #00FF00 0%, #00AA00 100%)',
    accentColor: 'rgba(0, 255, 0, 0.6)',
    checkColor: '#00FF00',
  },
  {
    id: 'blocky',
    name: 'Blocky',
    description: 'Blocky design, hard shadows, neon accents',
    icon: cubeOutline,
    gradient: 'linear-gradient(135deg, #FF2E6C 0%, #00D4FF 100%)',
    accentColor: 'rgba(255, 46, 108, 0.6)',
    checkColor: '#FF2E6C',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Cherry blossom petals, soft pinks, spring vibes',
    icon: flowerOutline,
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FBCFE8 100%)',
    accentColor: 'rgba(244, 114, 182, 0.6)',
    checkColor: '#F472B6',
  },
  {
    id: 'modest',
    name: 'Modest',
    description: 'Clean and minimal, professional light theme',
    icon: contrastOutline,
    gradient: 'linear-gradient(135deg, #737373 0%, #525252 100%)',
    accentColor: 'rgba(115, 115, 115, 0.6)',
    checkColor: '#a1a1aa',
  },
  {
    id: 'modest-dark',
    name: 'Modest Dark',
    description: 'Same clean aesthetic, dark mode',
    icon: moonOutline,
    gradient: 'linear-gradient(135deg, #525252 0%, #404040 100%)',
    accentColor: 'rgba(82, 82, 82, 0.6)',
    checkColor: '#a1a1aa',
  },
];

// ============================================
// CONSTANTS
// ============================================
const LINK_CONFIGS: Omit<LinkItem, 'id' | 'url'>[] = [
  // Music platforms
  {
    type: 'spotify',
    label: 'Spotify',
    icon: 'spotify',
    color: '#1DB954',
    category: 'music',
  },
  {
    type: 'apple',
    label: 'Apple Music',
    icon: 'apple',
    color: '#FA2D48',
    category: 'music',
  },
  {
    type: 'bandcamp',
    label: 'Bandcamp',
    icon: 'bandcamp',
    color: '#1DA0C3',
    category: 'music',
  },
  {
    type: 'tidal',
    label: 'Tidal',
    icon: 'tidal',
    color: '#000000',
    category: 'music',
  },
  {
    type: 'soundcloud',
    label: 'SoundCloud',
    icon: 'soundcloud',
    color: '#FF5500',
    category: 'music',
  },
  {
    type: 'youtubemusic',
    label: 'YouTube Music',
    icon: 'youtube',
    color: '#FF0000',
    category: 'music',
  },
  // Social platforms
  {
    type: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    category: 'social',
  },
  {
    type: 'tiktok',
    label: 'TikTok',
    icon: 'tiktok',
    color: '#000000',
    category: 'social',
  },
  {
    type: 'facebook',
    label: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    category: 'social',
  },
  {
    type: 'twitter',
    label: 'X (Twitter)',
    icon: 'twitter',
    color: '#1DA1F2',
    category: 'social',
  },
  {
    type: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    category: 'social',
  },
  {
    type: 'website',
    label: 'Website',
    icon: 'globe',
    color: '#8B5CF6',
    category: 'social',
  },
];

// ============================================
// HELPER COMPONENTS
// ============================================
const PlatformIcon: React.FC<{
  icon: string;
  size?: number;
  color?: string;
}> = ({ icon, size = 20, color = 'currentColor' }) => {
  const style = { fontSize: size, color };

  switch (icon) {
    case 'spotify':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    case 'apple':
      return <IonIcon icon={logoApple} style={style} />;
    case 'bandcamp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
        </svg>
      );
    case 'tidal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L8.008 16l4.004-4.004L16.016 16l4.004-4.004 4.004 4.004L28.028 12l-4.004-4.004-4.004 4.004-4.004-4.004-4.004 4.004z" />
        </svg>
      );
    case 'soundcloud':
      return <IonIcon icon={logoSoundcloud} style={style} />;
    case 'youtube':
      return <IonIcon icon={logoYoutube} style={style} />;
    case 'instagram':
      return <IonIcon icon={logoInstagram} style={style} />;
    case 'tiktok':
      return <IonIcon icon={logoTiktok} style={style} />;
    case 'facebook':
      return <IonIcon icon={logoFacebook} style={style} />;
    case 'twitter':
      return <IonIcon icon={logoTwitter} style={style} />;
    case 'globe':
      return <IonIcon icon={globeOutline} style={style} />;
    default:
      return <IonIcon icon={linkOutline} style={style} />;
  }
};

// Section Divider Component
const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '8px 0 4px',
    }}
  >
    <div
      style={{
        flex: 1,
        height: 1,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(113, 113, 122, 0.3) 50%, transparent 100%)',
      }}
    />
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    <div
      style={{
        flex: 1,
        height: 1,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(113, 113, 122, 0.3) 50%, transparent 100%)',
      }}
    />
  </div>
);

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  iconColor: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, iconColor, badge, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'rgba(24, 24, 27, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${iconColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IonIcon icon={icon} style={{ fontSize: 20, color: iconColor }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: '#f4f4f5',
              letterSpacing: '-0.3px',
            }}
          >
            {title}
          </h3>
        </div>
        {badge !== undefined && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: `${iconColor}20`,
              color: iconColor,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
        <IonIcon
          icon={isOpen ? chevronUpOutline : chevronDownOutline}
          style={{
            fontSize: 20,
            color: '#71717a',
            transition: 'transform 0.3s ease',
          }}
        />
      </button>
      <div
        style={{
          maxHeight: isOpen ? 2000 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            padding: '0 20px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Input Field Component
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'textarea';
  disabled?: boolean;
  icon?: React.ReactNode;
  rows?: number;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  icon,
  rows = 4,
}) => {
  const [focused, setFocused] = useState(false);

  const containerStyle = {
    background: focused ? 'rgba(139, 92, 246, 0.08)' : 'rgba(9, 9, 11, 0.5)',
    borderRadius: 14,
    border: `1.5px solid ${
      focused ? 'rgba(139, 92, 246, 0.4)' : 'rgba(63, 63, 70, 0.5)'
    }`,
    padding: '14px 16px',
    marginTop: 14,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: focused ? '#a78bfa' : '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.2s ease',
  };

  const inputBaseStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    color: '#e4e4e7',
    fontWeight: 500,
    fontFamily: 'inherit',
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {icon}
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          style={{
            ...inputBaseStyle,
            resize: 'none',
            lineHeight: 1.6,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={inputBaseStyle}
        />
      )}
    </div>
  );
};

// Draggable Link Item Component
const DraggableLinkItem: React.FC<{
  link: LinkItem;
  onUpdate: (url: string) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  disabled: boolean;
}> = ({
  link,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging,
  isDragOver,
  disabled,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: isDragOver
          ? 'rgba(139, 92, 246, 0.15)'
          : focused
          ? 'rgba(139, 92, 246, 0.08)'
          : 'rgba(9, 9, 11, 0.5)',
        borderRadius: 14,
        border: `1.5px solid ${
          isDragOver
            ? 'rgba(139, 92, 246, 0.5)'
            : focused
            ? 'rgba(139, 92, 246, 0.3)'
            : 'rgba(63, 63, 70, 0.4)'
        }`,
        marginTop: 10,
        opacity: isDragging ? 0.5 : disabled ? 0.5 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        cursor: disabled ? 'default' : 'grab',
      }}
    >
      {!disabled && (
        <IonIcon
          icon={reorderThreeOutline}
          style={{ fontSize: 20, color: '#52525b', flexShrink: 0 }}
        />
      )}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${link.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PlatformIcon icon={link.icon} size={18} color={link.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
          }}
        >
          {link.label}
        </div>
        <input
          type="url"
          value={link.url}
          onChange={(e) => onUpdate(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`https://${link.type}.com/...`}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: '#e4e4e7',
            fontWeight: 500,
          }}
        />
      </div>
      {!disabled && link.url && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          <IonIcon
            icon={trashOutline}
            style={{ fontSize: 16, color: '#ef4444' }}
          />
        </button>
      )}
    </div>
  );
};

// Theme Selection Button Component
const ThemeButton: React.FC<{
  config: ThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}> = ({ config, isSelected, onSelect, disabled }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        border: isSelected
          ? `2px solid ${config.accentColor}`
          : '1px solid rgba(63, 63, 70, 0.4)',
        background: isSelected
          ? `linear-gradient(135deg, ${config.accentColor.replace(
              '0.6',
              '0.15'
            )} 0%, ${config.accentColor.replace('0.6', '0.05')} 100%)`
          : 'rgba(9, 9, 11, 0.5)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: config.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 16px ${config.accentColor.replace('0.6', '0.3')}`,
        }}
      >
        <IonIcon
          icon={config.icon}
          style={{
            fontSize: 24,
            color: config.id === 'matrix' ? '#000' : '#fff',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#f4f4f5',
          }}
        >
          {config.name}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: '#71717a',
          }}
        >
          {config.description}
        </p>
      </div>
      {isSelected && (
        <IonIcon
          icon={checkmarkCircleOutline}
          style={{ fontSize: 24, color: config.checkColor }}
        />
      )}
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function BandPublicProfileMobile() {
  const params = useParams<{ bandId?: string; id?: string }>();
  const navigate = useNavigate();
  const bandId = params.bandId ?? params.id ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [myRole, setMyRole] = useState<MembershipRole>('member');

  // Band data
  const [bandName, setBandName] = useState('Band');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [publicBio, setPublicBio] = useState('');
  const [genres, setGenres] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');

  // Links
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [embeddedVideoUrl, setEmbeddedVideoUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [publicTheme, setPublicTheme] = useState<BandThemeStyle>('cosmic');

  const [contactEmail, setContactEmail] = useState('');
  const [allowContact, setAllowContact] = useState(true);

  const isAdmin = myRole === 'admin';

  // Computed
  const location = useMemo(() => {
    if (city && stateVal) return `${city}, ${stateVal}`;
    return city || stateVal || '';
  }, [city, stateVal]);

  const musicLinks = useMemo(
    () => links.filter((l) => l.category === 'music'),
    [links]
  );
  const socialLinks = useMemo(
    () => links.filter((l) => l.category === 'social'),
    [links]
  );
  const activeLinkCount = useMemo(
    () => links.filter((l) => l.url.trim()).length,
    [links]
  );

  // Haptics
  const triggerHaptic = useCallback(
    async (style: ImpactStyle = ImpactStyle.Light) => {
      if (Capacitor.getPlatform() === 'web') return;
      try {
        await Haptics.impact({ style });
      } catch (e) {
        console.warn('[haptic error]', e);
      }
    },
    []
  );

  // Normalize theme from DB value
  const normalizeTheme = (value: string | null): BandThemeStyle => {
    const v = value?.toLowerCase();
    if (
      v === 'cosmic' ||
      v === 'cosmic-light' ||
      v === 'matrix' ||
      v === 'blocky' ||
      v === 'modest' ||
      v === 'modest-dark' ||
      v === 'sakura'
    ) {
      return v;
    }
    // Legacy mappings
    if (v === 'blockyal') return 'blocky';
    if (v === 'plain') return 'modest';
    return 'cosmic';
  };

  // Load data
  useEffect(() => {
    if (!bandId) {
      navigate('/home', { replace: true });
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: auth } = await supabase.auth.getUser();
        if (!alive) return;
        const user = auth?.user;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band.');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select(
            `id, name, avatar_url, public_bio, city, state, public_slug, is_public, public_avatar_enabled, embedded_video_url, gallery_images, public_theme, contact_email, public_allow_contact`
          )
          .eq('id', bandId)
          .maybeSingle();

        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }
        if (!alive) return;

        const b = band as BandProfileRow;
        setBandName(b.name);
        setAvatarUrl(b.avatar_url);
        setPublicBio(b.public_bio ?? '');
        setCity(b.city ?? '');
        setStateVal(b.state ?? '');
        setPublicSlug(b.public_slug ?? null);
        setEmbeddedVideoUrl(b.embedded_video_url ?? '');
        setGalleryImages(b.gallery_images ?? []);
        setPublicTheme(normalizeTheme(b.public_theme));
        setContactEmail(b.contact_email ?? '');
        setAllowContact(
          b.public_allow_contact === null ||
            b.public_allow_contact === undefined
            ? true
            : b.public_allow_contact
        );

        // Fetch streaming links from band_streaming_links table
        const { data: streamingLinksData, error: streamingLinksErr } =
          await supabase
            .from('band_streaming_links')
            .select('id, platform_type, url, display_order')
            .eq('band_id', bandId)
            .order('display_order', { ascending: true });

        if (streamingLinksErr) throw streamingLinksErr;

        // Merge with configs - existing links get their URLs, others stay empty
        const initialLinks: LinkItem[] = LINK_CONFIGS.map((config, index) => {
          const existing = streamingLinksData?.find(
            (l) => l.platform_type?.toLowerCase() === config.type.toLowerCase()
          );
          return {
            ...config,
            id: existing?.id || `${config.type}-${index}`,
            url: existing?.url || '',
          };
        });
        setLinks(initialLinks);

        // Load genres from band_genres junction table
        const { data: bandGenres, error: bandGenresErr } = await supabase
          .from('band_genres')
          .select('genres(name)')
          .eq('band_id', bandId);

        if (bandGenresErr) throw bandGenresErr;

        const genreNames =
          bandGenres
            ?.map((row: any) => row.genres?.name as string | undefined)
            .filter(Boolean) ?? [];
        setGenres(genreNames.join(', '));
      } catch (e: any) {
        console.error('[BandPublicProfileMobile] load error', e);
        if (alive) setError(e?.message || 'Failed to load band profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId, navigate]);

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    if (!bandId || !isAdmin) return;

    try {
      setUploading(true);
      triggerHaptic();

      const fileExt = file.name.split('.').pop();
      const fileName = `${bandId}-${Date.now()}.${fileExt}`;
      const filePath = `band-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('bands')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', bandId);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setToastMessage('Avatar updated! ✨');
      setToastOpen(true);
    } catch (e: any) {
      console.error('[BandPublicProfileMobile] avatar upload error', e);
      setError(e?.message || 'Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  // Handle link updates
  const handleLinkUpdate = (index: number, url: string) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, url } : l)));
  };

  const handleLinkRemove = (index: number) => {
    triggerHaptic();
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, url: '' } : l))
    );
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    triggerHaptic(ImpactStyle.Medium);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      setLinks((prev) => {
        const newLinks = [...prev];
        const [removed] = newLinks.splice(draggedIndex, 1);
        newLinks.splice(dragOverIndex, 0, removed);
        return newLinks;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  // Save
  const handleSave = async () => {
    if (!bandId || !isAdmin) return;

    try {
      triggerHaptic(ImpactStyle.Medium);
      setSaving(true);
      setError(null);

      let slugToUse = publicSlug;
      if (!slugToUse) {
        const baseSlug = bandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        slugToUse = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const trimmedContactEmail = contactEmail.trim();
      const allowContactFinal =
        trimmedContactEmail.length > 0 ? allowContact : false;

      // Update band basic info (without streaming_links - those go to separate table)
      const { error: updateErr } = await supabase
        .from('bands')
        .update({
          public_bio: publicBio || null,
          city: city || null,
          state: stateVal || null,
          public_slug: slugToUse,
          is_public: true,
          public_avatar_enabled: true,
          embedded_video_url: embeddedVideoUrl.trim() || null,
          gallery_images: galleryImages.length > 0 ? galleryImages : null,
          public_theme: publicTheme,
          contact_email: trimmedContactEmail || null,
          public_allow_contact: allowContactFinal,
        })
        .eq('id', bandId);

      if (updateErr) throw updateErr;

      // Save streaming links to band_streaming_links table
      // First, delete existing links for this band
      const { error: deleteLinksErr } = await supabase
        .from('band_streaming_links')
        .delete()
        .eq('band_id', bandId);

      if (deleteLinksErr) throw deleteLinksErr;

      // Insert new links with display_order based on current order
      const linksToInsert = links
        .filter((l) => l.url.trim())
        .map((l, index) => ({
          band_id: bandId,
          platform_type: l.type,
          url: l.url.trim(),
          display_order: index,
        }));

      if (linksToInsert.length > 0) {
        const { error: insertLinksErr } = await supabase
          .from('band_streaming_links')
          .insert(linksToInsert);

        if (insertLinksErr) throw insertLinksErr;
      }

      setPublicSlug(slugToUse);

      // Update genres
      const genreNames =
        genres.trim().length > 0
          ? genres
              .split(',')
              .map((g) => g.trim())
              .filter(Boolean)
          : [];

      const { error: genresErr } = await supabase.rpc('set_band_genres', {
        p_band_id: bandId,
        p_genres: genreNames,
      });

      if (genresErr) throw genresErr;

      setToastMessage('Profile saved ✨');
      setToastOpen(true);
    } catch (e: any) {
      console.error('[BandPublicProfileMobile] save error', e);
      setError(e?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // Open public page
  const handleOpenPublicPage = async () => {
    if (!publicSlug) return;
    triggerHaptic();
    const url = `https://amplee.app/b/${publicSlug}`;
    try {
      if (Capacitor.getPlatform() === 'web') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await Browser.open({ url });
      }
    } catch (e) {
      console.warn('[BandPublicProfileMobile] open public page error', e);
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    if (!publicSlug) return;
    triggerHaptic();
    const url = `https://amplee.app/b/${publicSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('Link copied! 📋');
      setToastOpen(true);
    } catch (e) {
      console.warn('[BandPublicProfileMobile] copy link error', e);
    }
  };

  const getVideoEmbedUrl = useCallback((url: string): string | null => {
    if (!url.trim()) return null;

    // YouTube patterns
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo patterns
    const vimeoMatch = url.match(
      /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/
    );
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  }, []);

  const videoEmbedPreview = useMemo(
    () => getVideoEmbedUrl(embeddedVideoUrl),
    [embeddedVideoUrl, getVideoEmbedUrl]
  );

  // Handle gallery image upload
  const handleGalleryUpload = async (file: File) => {
    if (!bandId || !isAdmin || galleryImages.length >= 4) return;

    try {
      setUploadingGallery(true);
      triggerHaptic();

      const fileExt = file.name.split('.').pop();
      const fileName = `${bandId}-gallery-${Date.now()}.${fileExt}`;
      const filePath = `band-gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      const newImageUrl = urlData.publicUrl;
      setGalleryImages((prev) => [...prev, newImageUrl]);

      setToastMessage('Photo added! 📸');
      setToastOpen(true);
    } catch (e: any) {
      console.error('[BandPublicProfileMobile] gallery upload error', e);
      setError(e?.message || 'Failed to upload photo.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    triggerHaptic();
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleThemeSelect = (theme: BandThemeStyle) => {
    if (!isAdmin) return;
    triggerHaptic();
    setPublicTheme(theme);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(9, 9, 11, 0.95)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  navigate(`/bands/${bandId}`);
                }}
                style={{
                  background: 'rgba(39, 39, 42, 0.6)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: 10,
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <IonIcon
                  icon={chevronBackOutline}
                  style={{ color: '#a1a1aa', fontSize: 20 }}
                />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fafafa',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Public Profile
                </h1>
                <p
                  style={{ fontSize: 12, color: '#71717a', margin: '2px 0 0' }}
                >
                  {bandName}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                }}
              >
                {saving ? (
                  <IonSpinner
                    style={{ '--color': '#fff', width: 16, height: 16 }}
                  />
                ) : (
                  <IonIcon
                    icon={sparklesOutline}
                    style={{ fontSize: 16, color: '#fff' }}
                  />
                )}
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {saving ? 'Saving...' : 'Save'}
                </span>
              </button>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY style={{ '--background': '#09090b' }}>
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              left: '-25%',
              width: '70%',
              height: '50%',
              background:
                'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              right: '-15%',
              width: '55%',
              height: '45%',
              background:
                'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
        </div>

        {loading ? (
          <div
            style={{
              paddingTop: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <IonSpinner
              style={{ '--color': '#a78bfa', width: 36, height: 36 }}
            />
            <p style={{ color: '#71717a', fontSize: 14 }}>Loading profile...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 16,
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: 20,
              }}
            >
              <IonText color="danger">
                <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
              </IonText>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '20px 16px 120px',
              maxWidth: 640,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Public URL Card */}
            {publicSlug ? (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: 18,
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background:
                      'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{ fontSize: 24, color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 10,
                      color: '#86efac',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      fontWeight: 700,
                    }}
                  >
                    Your page is live
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#e4e4e7',
                      margin: '4px 0 0',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    amplee.app/b/{publicSlug}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IonIcon
                      icon={copyOutline}
                      style={{ fontSize: 18, color: '#a1a1aa' }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPublicPage}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IonIcon
                      icon={globeOutline}
                      style={{ fontSize: 18, color: '#22c55e' }}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: 18,
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 22, color: '#fbbf24' }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#fde68a',
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    No public page yet
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#71717a',
                      margin: '4px 0 0',
                    }}
                  >
                    Fill in your info and save to go live
                  </p>
                </div>
              </div>
            )}

            {/* Non-admin notice */}
            {!isAdmin && (
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  borderRadius: 14,
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    color: '#fde68a',
                    fontSize: 13,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Only band admins can edit the public profile
                </p>
              </div>
            )}

            {/* ============================================ */}
            {/* BASICS SECTION */}
            {/* ============================================ */}
            <SectionDivider label="Basics" />

            {/* Avatar Upload Section */}
            <CollapsibleSection
              title="Band Image"
              icon={imageOutline}
              iconColor="#ec4899"
              defaultOpen={false}
            >
              <div style={{ marginTop: 14 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                  style={{ display: 'none' }}
                  disabled={!isAdmin}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAdmin || uploading}
                  style={{
                    width: '100%',
                    padding: 20,
                    borderRadius: 16,
                    border: '2px dashed rgba(236, 72, 153, 0.3)',
                    background: 'rgba(236, 72, 153, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    cursor: isAdmin && !uploading ? 'pointer' : 'not-allowed',
                    opacity: isAdmin ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {avatarUrl ? (
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 16,
                        background: `url(${avatarUrl}) center/cover`,
                        border: '2px solid rgba(236, 72, 153, 0.3)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 16,
                        background: 'rgba(236, 72, 153, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {uploading ? (
                        <IonSpinner
                          style={{
                            '--color': '#ec4899',
                            width: 28,
                            height: 28,
                          }}
                        />
                      ) : (
                        <IonIcon
                          icon={cloudUploadOutline}
                          style={{ fontSize: 32, color: '#ec4899' }}
                        />
                      )}
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontSize: 14,
                        color: '#e4e4e7',
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      {uploading
                        ? 'Uploading...'
                        : avatarUrl
                        ? 'Change image'
                        : 'Upload band image'}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#71717a',
                        margin: '4px 0 0',
                      }}
                    >
                      Square image works best
                    </p>
                  </div>
                </button>
              </div>
            </CollapsibleSection>

            {/* Bio & Identity Section */}
            <CollapsibleSection
              title="Bio & Identity"
              icon={musicalNotesOutline}
              iconColor="#a78bfa"
              defaultOpen={false}
            >
              <InputField
                label="Public Bio"
                value={publicBio}
                onChange={setPublicBio}
                placeholder="Tell people who you are, what you sound like..."
                type="textarea"
                disabled={!isAdmin}
                rows={4}
              />
              <InputField
                label="Genres"
                value={genres}
                onChange={setGenres}
                placeholder="Indie rock, Americana, Folk"
                disabled={!isAdmin}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1 }}>
                  <InputField
                    label="City"
                    value={city}
                    onChange={setCity}
                    placeholder="Kansas City"
                    disabled={!isAdmin}
                    icon={
                      <IonIcon
                        icon={locationOutline}
                        style={{ fontSize: 12 }}
                      />
                    }
                  />
                </div>
                <div style={{ width: 100 }}>
                  <InputField
                    label="State"
                    value={stateVal}
                    onChange={setStateVal}
                    placeholder="MO"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* ============================================ */}
            {/* CONNECT SECTION */}
            {/* ============================================ */}
            <SectionDivider label="Connect" />

            {/* Contact & Inquiries */}
            <CollapsibleSection
              title="Contact & Inquiries"
              icon={mailOutline}
              iconColor="#22c55e"
              defaultOpen={false}
            >
              <InputField
                label="Contact email"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="band@gmail.com"
                type="text"
                disabled={!isAdmin}
                icon={<IonIcon icon={mailOutline} style={{ fontSize: 12 }} />}
              />

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#e4e4e7',
                      fontWeight: 600,
                    }}
                  >
                    Allow contact form
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 12,
                      color: '#71717a',
                      maxWidth: 260,
                      lineHeight: 1.5,
                    }}
                  >
                    Show a contact form on your public page and send messages to
                    this email.
                  </p>
                </div>
                <IonToggle
                  checked={allowContact}
                  onIonChange={(e) => setAllowContact(e.detail.checked)}
                  disabled={!isAdmin || !contactEmail.trim()}
                  style={{
                    '--handle-background': '#09090b',
                    '--background-checked': '#22c55e',
                    '--background': 'rgba(63,63,70,0.8)',
                  }}
                />
              </div>

              {!contactEmail.trim() && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: '#f97316',
                  }}
                >
                  Add an email to enable the contact form.
                </p>
              )}
            </CollapsibleSection>

            {/* Music Links Section */}
            <CollapsibleSection
              title="Music Links"
              icon={musicalNotesOutline}
              iconColor="#ec4899"
              badge={musicLinks.filter((l) => l.url.trim()).length || undefined}
              defaultOpen={false}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  margin: '14px 0 6px',
                  lineHeight: 1.5,
                }}
              >
                Drag to reorder how links appear on your public page
              </p>
              {musicLinks.map((link, index) => {
                const globalIndex = links.findIndex((l) => l.id === link.id);
                return (
                  <DraggableLinkItem
                    key={link.id}
                    link={link}
                    onUpdate={(url) => handleLinkUpdate(globalIndex, url)}
                    onRemove={() => handleLinkRemove(globalIndex)}
                    onDragStart={() => handleDragStart(globalIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={() => handleDragOver(globalIndex)}
                    isDragging={draggedIndex === globalIndex}
                    isDragOver={dragOverIndex === globalIndex}
                    disabled={!isAdmin}
                  />
                );
              })}
            </CollapsibleSection>

            {/* Social Links Section */}
            <CollapsibleSection
              title="Socials & Website"
              icon={linkOutline}
              iconColor="#a78bfa"
              badge={
                socialLinks.filter((l) => l.url.trim()).length || undefined
              }
              defaultOpen={false}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  margin: '14px 0 6px',
                  lineHeight: 1.5,
                }}
              >
                Drag to reorder how links appear on your public page
              </p>
              {socialLinks.map((link) => {
                const globalIndex = links.findIndex((l) => l.id === link.id);
                return (
                  <DraggableLinkItem
                    key={link.id}
                    link={link}
                    onUpdate={(url) => handleLinkUpdate(globalIndex, url)}
                    onRemove={() => handleLinkRemove(globalIndex)}
                    onDragStart={() => handleDragStart(globalIndex)}
                    onDragEnd={handleDragEnd}
                    onDragOver={() => handleDragOver(globalIndex)}
                    isDragging={draggedIndex === globalIndex}
                    isDragOver={dragOverIndex === globalIndex}
                    disabled={!isAdmin}
                  />
                );
              })}
            </CollapsibleSection>

            {/* ============================================ */}
            {/* MEDIA SECTION */}
            {/* ============================================ */}
            <SectionDivider label="Media" />

            {/* Band Gallery Section */}
            <CollapsibleSection
              title="Band Gallery"
              icon={imageOutline}
              iconColor="#22c55e"
              badge={
                galleryImages.length > 0
                  ? `${galleryImages.length}/4`
                  : undefined
              }
              defaultOpen={false}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  margin: '14px 0 10px',
                  lineHeight: 1.5,
                }}
              >
                Add up to 4 photos to showcase your band
              </p>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleGalleryUpload(file);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
                disabled={!isAdmin || galleryImages.length >= 4}
              />

              {/* Gallery Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                {galleryImages.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid rgba(244, 114, 182, 0.2)',
                    }}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <IonIcon
                          icon={trashOutline}
                          style={{ fontSize: 14, color: '#ef4444' }}
                        />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Photo Button */}
                {galleryImages.length < 4 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={!isAdmin || uploadingGallery}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 14,
                      border: '2px dashed rgba(244, 114, 182, 0.3)',
                      background: 'rgba(244, 114, 182, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor:
                        isAdmin && !uploadingGallery
                          ? 'pointer'
                          : 'not-allowed',
                      opacity: isAdmin ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {uploadingGallery ? (
                      <IonSpinner
                        style={{ '--color': '#f472b6', width: 24, height: 24 }}
                      />
                    ) : (
                      <>
                        <IonIcon
                          icon={cloudUploadOutline}
                          style={{ fontSize: 24, color: '#f472b6' }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            color: '#f472b6',
                            fontWeight: 600,
                          }}
                        >
                          Add
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CollapsibleSection>

            {/* Embedded Video Section */}
            <CollapsibleSection
              title="Featured Video"
              icon={videocamOutline}
              iconColor="#ec4899"
              badge={videoEmbedPreview ? '1' : undefined}
              defaultOpen={false}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  margin: '14px 0 6px',
                  lineHeight: 1.5,
                }}
              >
                Paste a YouTube or Vimeo link to feature a video on your page
              </p>

              <InputField
                label="Video URL"
                value={embeddedVideoUrl}
                onChange={setEmbeddedVideoUrl}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                type="url"
                disabled={!isAdmin}
                icon={<IonIcon icon={linkOutline} style={{ fontSize: 12 }} />}
              />

              {/* Video Preview */}
              {videoEmbedPreview && (
                <div
                  style={{
                    marginTop: 14,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    background: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                    }}
                  >
                    <iframe
                      src={videoEmbedPreview}
                      title="Video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(139, 92, 246, 0.08)',
                      borderTop: '1px solid rgba(139, 92, 246, 0.15)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: '#a78bfa',
                        fontWeight: 600,
                      }}
                    >
                      Video preview
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setEmbeddedVideoUrl('')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontSize: 12,
                          color: '#ef4444',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {embeddedVideoUrl && !videoEmbedPreview && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: '#fde68a',
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Couldn't parse video URL. Please use a standard YouTube or
                    Vimeo link.
                  </p>
                </div>
              )}
            </CollapsibleSection>

            {/* ============================================ */}
            {/* APPEARANCE SECTION */}
            {/* ============================================ */}
            <SectionDivider label="Appearance" />

            {/* Theme Selection */}
            <CollapsibleSection
              title="Page Theme"
              icon={sparklesOutline}
              iconColor="#a78bfa"
              defaultOpen={false}
            >
              <p
                style={{
                  fontSize: 12,
                  color: '#71717a',
                  margin: '14px 0 12px',
                  lineHeight: 1.5,
                }}
              >
                Choose how your public page looks to visitors
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {THEME_CONFIGS.map((config) => (
                  <ThemeButton
                    key={config.id}
                    config={config}
                    isSelected={publicTheme === config.id}
                    onSelect={() => handleThemeSelect(config.id)}
                    disabled={!isAdmin}
                  />
                ))}
              </div>
            </CollapsibleSection>

            {/* Bottom spacer for fixed button */}
            <div style={{ height: 20 }} />
          </div>
        )}

        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message={toastMessage}
          duration={2500}
          position="bottom"
          style={{
            '--background': 'rgba(24, 24, 27, 0.95)',
            '--color': '#e4e4e7',
            '--border-radius': '14px',
            '--box-shadow': '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
        />
      </IonContent>
    </IonPage>
  );
}

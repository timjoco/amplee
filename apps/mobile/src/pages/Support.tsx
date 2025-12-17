import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTextarea,
  IonToolbar,
} from '@ionic/react';
import {
  bugOutline,
  bulbOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  documentTextOutline,
  helpCircleOutline,
  mailOutline,
  openOutline,
  peopleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const WEB_BASE_URL = 'https://amplee.app';
const APP_VERSION = '1.0.0-alpha';

const openExternal = async (path: string) => {
  const url = `${WEB_BASE_URL}${path}`;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const legalItems = [
  {
    icon: documentTextOutline,
    label: 'Terms of Service',
    description: 'Usage terms and conditions',
    path: '/terms',
  },
  {
    icon: shieldCheckmarkOutline,
    label: 'Privacy Policy',
    description: 'How we handle your data',
    path: '/privacy',
  },
  {
    icon: peopleOutline,
    label: 'Community Guidelines',
    description: 'Rules for a great community',
    path: '/community-guidelines',
  },
];

const supportItems = [
  {
    icon: helpCircleOutline,
    label: 'Help Center',
    description: 'FAQs and troubleshooting',
    path: '/support',
  },
  {
    icon: mailOutline,
    label: 'Contact Us',
    description: 'Get in touch with our team',
    path: '/support#contact',
  },
];

type FeedbackType = 'bug' | 'feature' | 'general';

const feedbackTypes: { type: FeedbackType; icon: string; label: string }[] = [
  { type: 'bug', icon: bugOutline, label: 'Bug' },
  { type: 'feature', icon: bulbOutline, label: 'Feature' },
  { type: 'general', icon: chatbubbleOutline, label: 'General' },
];

export default function Support() {
  const nav = useNavigate();
  const [feedbackType, setFeedbackType] =
    React.useState<FeedbackType>('general');
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;

    setSubmitting(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id ?? null;

      const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

      const { error } = await supabase.from('app_feedback').insert({
        user_id: userId,
        feedback_type: feedbackType,
        message: feedbackMessage.trim(),
        app_version: APP_VERSION,
        platform,
      });

      if (error) throw error;

      setSubmitted(true);
      setFeedbackMessage('');

      // Reset success state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const LinkCard = ({
    icon,
    label,
    description,
    path,
  }: {
    icon: string;
    label: string;
    description: string;
    path: string;
  }) => (
    <div
      onClick={() => openExternal(path)}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(139,92,246,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IonIcon
          icon={icon}
          style={{
            fontSize: 20,
            color: '#A78BFA',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#f9fafb',
            lineHeight: 1.3,
          }}
        >
          {label}
        </h3>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 13,
            color: '#9ca3af',
          }}
        >
          {description}
        </p>
      </div>

      <IonIcon
        icon={openOutline}
        style={{
          fontSize: 18,
          color: '#6b7280',
          flexShrink: 0,
        }}
      />
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Legal & Support
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  marginTop: 4,
                }}
              >
                Policies and help resources
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: '0 16px 32px',
            paddingTop: 16,
          }}
        >
          {/* Alpha Feedback Section */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '0 0 12px 4px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Alpha Feedback
              </h2>
              <span
                style={{
                  background: 'rgba(139,92,246,0.2)',
                  color: '#A78BFA',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Early Access
              </span>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 20,
              }}
            >
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 14,
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}
              >
                Thanks for testing Amplee! Your feedback helps us build
                something great.
              </p>

              {/* Feedback type selector */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {feedbackTypes.map((ft) => (
                  <button
                    key={ft.type}
                    onClick={() => setFeedbackType(ft.type)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 8px',
                      background:
                        feedbackType === ft.type
                          ? 'rgba(139,92,246,0.15)'
                          : 'rgba(255,255,255,0.03)',
                      border:
                        feedbackType === ft.type
                          ? '1px solid rgba(139,92,246,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IonIcon
                      icon={ft.icon}
                      style={{
                        fontSize: 20,
                        color: feedbackType === ft.type ? '#A78BFA' : '#6b7280',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: feedbackType === ft.type ? '#e5e7eb' : '#9ca3af',
                      }}
                    >
                      {ft.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <IonTextarea
                value={feedbackMessage}
                onIonInput={(e) => setFeedbackMessage(e.detail.value ?? '')}
                placeholder={
                  feedbackType === 'bug'
                    ? 'What happened? What did you expect?'
                    : feedbackType === 'feature'
                    ? 'What would make Amplee better for you?'
                    : 'Share your thoughts...'
                }
                rows={4}
                style={{
                  '--background': 'rgba(255,255,255,0.03)',
                  '--border-radius': '12px',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                  '--padding-top': '12px',
                  '--padding-bottom': '12px',
                  '--color': '#e5e7eb',
                  '--placeholder-color': '#6b7280',
                  fontSize: 14,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                }}
              />

              {/* Submit button */}
              <button
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedbackMessage.trim()}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '14px 20px',
                  background: submitted
                    ? 'rgba(52,211,153,0.2)'
                    : submitting || !feedbackMessage.trim()
                    ? 'rgba(139,92,246,0.1)'
                    : 'rgba(139,92,246,0.9)',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  color: submitted
                    ? '#34D399'
                    : submitting || !feedbackMessage.trim()
                    ? 'rgba(167,139,250,0.5)'
                    : '#fff',
                  cursor:
                    submitting || !feedbackMessage.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitted ? (
                  <>
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      style={{ fontSize: 18 }}
                    />
                    Thanks for your feedback!
                  </>
                ) : submitting ? (
                  'Sending...'
                ) : (
                  'Send Feedback'
                )}
              </button>
            </div>
          </div>

          {/* Legal Section */}
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: '0 0 12px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Legal
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {legalItems.map((item) => (
                <LinkCard key={item.path} {...item} />
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div>
            <h2
              style={{
                margin: '0 0 12px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Support
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {supportItems.map((item) => (
                <LinkCard key={item.path} {...item} />
              ))}
            </div>
          </div>

          {/* App version footer */}
          <div
            style={{
              marginTop: 32,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: 'rgba(156,163,175,0.5)',
                margin: 0,
              }}
            >
              Amplee {APP_VERSION}
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

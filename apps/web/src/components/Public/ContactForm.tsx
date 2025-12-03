'use client';

import type { BandPageTheme } from '@/themes/publicPageThemes';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT FORM SECTION
// Allows visitors to send messages to the band
// ═══════════════════════════════════════════════════════════════════════════

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

interface ContactFormSectionProps {
  theme: BandPageTheme;
  dark: boolean;
  bandId: string;
  bandName: string;
  onSubmit: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ContactFormSection({
  theme,
  dark,
  bandId,
  bandName,
  onSubmit,
}: ContactFormSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !message.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your email and message');
      return;
    }

    setStatus('loading');

    const formData = new FormData();
    formData.append('bandId', bandId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('message', message);

    try {
      const result = await onSubmit(formData);

      if (result.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
        // Reset status after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const inputStyles = {
    background: theme.fieldColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '10px',
    padding: '12px 16px',
    color: theme.mainTextColor,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    '&:focus': {
      borderColor: theme.followButtonBorder,
      boxShadow: `0 0 0 3px ${
        dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
      }`,
    },
    '&::placeholder': {
      color: theme.secondaryTextColor,
      opacity: 0.7,
    },
  };

  return (
    <Box
      sx={{
        background: theme.showBg,
        backdropFilter: 'blur(20px)',
        borderRadius: 2.5,
        border: `1px solid ${theme.borderColor}`,
        padding: 2.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: theme.secondaryTextColor,
          mb: 1,
        }}
      >
        ✉️ Contact the Band
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          color: theme.mainTextColor,
          mb: 2,
        }}
      >
        Got a question, booking inquiry, or just want to say hi? Send us a
        message!
      </Typography>

      {status === 'success' ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: theme.followButtonBg,
              border: `2px solid ${theme.followButtonBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={theme.followButtonBorder}
              width="32"
              height="32"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.mainTextColor,
              mb: 1,
            }}
          >
            Message Sent!
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: theme.secondaryTextColor,
            }}
          >
            {bandName} will get back to you soon.
          </Typography>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <Box
              component="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              sx={{
                ...inputStyles,
                flex: 1,
              }}
            />
            <Box
              component="input"
              type="email"
              placeholder="Your email *"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              sx={{
                ...inputStyles,
                flex: 1,
              }}
            />
          </Box>

          <Box
            component="textarea"
            placeholder="Your message... *"
            required
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(e.target.value)
            }
            rows={4}
            sx={{
              ...inputStyles,
              width: '100%',
              resize: 'vertical',
              minHeight: 100,
              mb: 1.5,
              boxSizing: 'border-box',
            }}
          />

          {status === 'error' && (
            <Typography
              sx={{
                fontSize: 13,
                color: '#ef4444',
                mb: 1.5,
              }}
            >
              {errorMessage}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: theme.secondaryTextColor,
                opacity: 0.7,
              }}
            >
              We typically respond within 48 hours
            </Typography>
            <Box
              component="button"
              type="submit"
              disabled={status === 'loading'}
              sx={{
                background: theme.followButtonBg,
                border: `1px solid ${theme.followButtonBorder}`,
                borderRadius: '10px',
                padding: '12px 28px',
                color: theme.followButtonTextColor,
                fontSize: 14,
                fontWeight: 700,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                transition: 'all 0.2s ease',
                opacity: status === 'loading' ? 0.7 : 1,
                '&:hover': {
                  transform: status === 'loading' ? 'none' : 'translateY(-2px)',
                  boxShadow:
                    status === 'loading'
                      ? 'none'
                      : dark
                      ? '0 8px 20px rgba(0,0,0,0.4)'
                      : '0 8px 20px rgba(0,0,0,0.15)',
                },
              }}
            >
              {status === 'loading' ? (
                <CircularProgress
                  size={20}
                  sx={{ color: theme.followButtonTextColor }}
                />
              ) : (
                <>
                  <SendIcon />
                  Send Message
                </>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

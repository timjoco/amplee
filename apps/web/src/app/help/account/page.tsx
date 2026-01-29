export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Account & Login • Amplee Help Center',
  description: 'Learn how to create an account and log in to Amplee',
};

const colors = {
  bg: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#F3F4F6',
  },
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    muted: '#9CA3AF',
  },
  purple: {
    main: '#8B5CF6',
    light: '#A78BFA',
    lighter: '#EDE9FE',
    dark: '#7C3AED',
  },
  accent: {
    green: '#34d399',
    pink: '#f472b6',
    blue: '#38bdf8',
    yellow: '#f59e0b',
    red: '#ef4444',
  },
};

export default function AccountHelpPage() {
  return (
    <Box
      sx={{
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: colors.bg.secondary,
          borderBottom: `1px solid ${colors.bg.tertiary}`,
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Button
              component={Link}
              href="/help"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: colors.text.secondary,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  bgcolor: colors.bg.tertiary,
                },
              }}
            >
              Help Center
            </Button>
            <Image
              src="/logo.png"
              alt="Amplee"
              width={40}
              height={40}
              style={{ borderRadius: 10 }}
            />
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, py: { xs: 5, md: 8 } }}>
        <Container maxWidth="lg">
          {/* Page Header */}
          <Stack spacing={2.5} sx={{ mb: { xs: 5, md: 7 } }}>
            <Chip
              label="GETTING STARTED"
              sx={{
                bgcolor: colors.purple.lighter,
                color: colors.purple.main,
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '1px',
                alignSelf: 'flex-start',
                py: 2,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '-0.02em',
                color: colors.text.primary,
              }}
            >
              Account & Login
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Create your account and sign in using just your email—no password required.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* Creating an Account */}
            <HelpSection
              icon={<PersonAddIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="Creating an account"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Amplee uses <strong style={{ color: colors.text.primary }}>passwordless login</strong>—you sign in with a one-time code sent to your email. No password to remember or reset.
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Download Amplee from the <strong style={{ color: colors.text.primary }}>App Store</strong> or <strong style={{ color: colors.text.primary }}>Google Play</strong>
                </StepItem>
                <StepItem number={2}>
                  Open the app and enter your <strong style={{ color: colors.text.primary }}>email address</strong>
                </StepItem>
                <StepItem number={3}>
                  Check your inbox for a <strong style={{ color: colors.text.primary }}>6-digit code</strong>
                </StepItem>
                <StepItem number={4}>
                  Enter the code in the app—you're in!
                </StepItem>
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.purple.lighter,
                  borderLeft: `4px solid ${colors.purple.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  First time? You'll set up your profile
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  If it's your first time signing in, you'll be asked to add your name and optionally a profile photo. This helps your bandmates recognize you.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Logging In */}
            <HelpSection
              icon={<LoginIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Logging in"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Every time you sign in, you'll use the same email verification flow:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Open Amplee and enter your <strong style={{ color: colors.text.primary }}>email address</strong>
                </StepItem>
                <StepItem number={2}>
                  Check your email for the <strong style={{ color: colors.text.primary }}>6-digit code</strong>
                </StepItem>
                <StepItem number={3}>
                  Enter the code—you're back in
                </StepItem>
              </Stack>

              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                The code expires after <strong style={{ color: colors.text.primary }}>10 minutes</strong>, so enter it promptly. If it expires, just request a new one.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Email Delivery */}
            <HelpSection
              icon={<EmailIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Not getting the code?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                If you're not seeing the verification email, try these steps:
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <TipCard
                  title="Check spam/junk"
                  description="The email might have landed in your spam folder. Check there and mark it as 'not spam' so future emails arrive in your inbox."
                />
                <TipCard
                  title="Wait a minute"
                  description="Sometimes emails take a moment to arrive. Wait 1-2 minutes before requesting another code."
                />
                <TipCard
                  title="Check your email address"
                  description="Make sure you typed your email correctly. A small typo means the code goes somewhere else."
                />
                <TipCard
                  title="Try a different email"
                  description="If you're using iCloud's Hide My Email or a forwarding service, try signing in with your actual email address instead."
                />
              </Stack>

              <Box
                sx={{
                  bgcolor: colors.accent.yellow + '15',
                  borderLeft: `4px solid ${colors.accent.yellow}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  Still not working?
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Email us at <a href="mailto:hello.amplee@gmail.com" style={{ color: colors.purple.main, fontWeight: 600 }}>hello.amplee@gmail.com</a> with the email address you're trying to use and we'll help you out.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Common Questions */}
            <HelpSection
              icon={<HelpOutlineIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="Common questions"
            >
              <Stack spacing={3}>
                <FAQItem
                  question="Why no password?"
                  answer="Passwordless login is more secure and convenient. You can't forget a password that doesn't exist, and there's nothing for hackers to steal. Your email is your key."
                />
                <FAQItem
                  question="Can I use a different email?"
                  answer="Your account is tied to your email address. If you need to change it, contact support and we can help migrate your account."
                />
                <FAQItem
                  question="Can I stay logged in?"
                  answer="Yes! Once you sign in, you'll stay logged in until you explicitly log out or clear the app's data. You won't need to enter a code every time you open the app."
                />
                <FAQItem
                  question="How do I log out?"
                  answer="Go to your Profile tab, tap the settings icon, and scroll down to find 'Log Out'. You'll need to verify your email again next time you sign in."
                />
                <FAQItem
                  question="How do I delete my account?"
                  answer="Go to Profile → Settings → Account → Delete My Account. This permanently removes all your data including band memberships, messages, and uploaded files."
                />
              </Stack>
            </HelpSection>
          </Stack>

          {/* Related Articles */}
          <Box sx={{ mt: 8 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: colors.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 3,
              }}
            >
              Next Steps
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <RelatedCard
                title="Bands"
                description="Create or join your first band"
                href="/help/bands"
                color={colors.purple.main}
              />
              <RelatedCard
                title="Events"
                description="Start scheduling shows and practices"
                href="/help/events"
                color={colors.accent.green}
              />
            </Stack>
          </Box>

          {/* Still need help */}
          <Box
            sx={{
              mt: 8,
              p: { xs: 4, md: 5 },
              bgcolor: colors.bg.secondary,
              borderRadius: 4,
              border: `1px solid ${colors.bg.tertiary}`,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5, fontSize: { xs: '1.15rem', md: '1.35rem' } }}>
              Can't get in?
            </Typography>
            <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              Email us and we'll help you access your account.
            </Typography>
            <Button
              href="mailto:hello.amplee@gmail.com?subject=Help%20Logging%20In"
              variant="contained"
              size="large"
              sx={{
                bgcolor: colors.purple.main,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { bgcolor: colors.purple.dark },
              }}
            >
              Contact Support
            </Button>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

function HelpSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: colors.bg.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.85rem' },
            color: colors.text.primary,
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Box sx={{ pl: { xs: 0, md: 8.5 } }}>{children}</Box>
    </Box>
  );
}

function StepItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2.5} alignItems="flex-start">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: colors.purple.lighter,
          color: colors.purple.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          flexShrink: 0,
        }}
      >
        {number}
      </Box>
      <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, pt: 0.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
        {children}
      </Typography>
    </Stack>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1rem', md: '1.1rem' }, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' }, mb: 1 }}>
        {question}
      </Typography>
      <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '1rem', md: '1.075rem' }, lineHeight: 1.7 }}>
        {answer}
      </Typography>
    </Box>
  );
}

function RelatedCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Card
      component={Link}
      href={href}
      elevation={0}
      sx={{
        flex: 1,
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 3,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: color,
            mb: 2,
          }}
        />
        <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 0.75 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

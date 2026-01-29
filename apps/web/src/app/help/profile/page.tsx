export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BrushIcon from '@mui/icons-material/Brush';
import CollectionsIcon from '@mui/icons-material/Collections';
import EventIcon from '@mui/icons-material/Event';
import LinkIcon from '@mui/icons-material/Link';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PublicIcon from '@mui/icons-material/Public';
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
  title: 'Public Page • Amplee Help Center',
  description: 'Learn how to set up your band\'s public page in Amplee',
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
    teal: '#14b8a6',
  },
};

export default function PublicPageHelpPage() {
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
              label="PROMOTION"
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
              Public Page
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                color: colors.text.secondary,
                maxWidth: 700,
                lineHeight: 1.6,
              }}
            >
              Your band's free landing page. Think Linktree meets MySpace—showcase your music, share your links, and let fans know where to find you.
            </Typography>
          </Stack>

          {/* Content Sections */}
          <Stack spacing={6}>
            {/* What is the Public Page */}
            <HelpSection
              icon={<PublicIcon sx={{ fontSize: 28, color: colors.purple.main }} />}
              title="What is the public page?"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Every band on Amplee gets a free <strong style={{ color: colors.text.primary }}>public page</strong>—a shareable landing page where fans, venues, and bookers can learn about your band and find all your links in one place.
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 2.5, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your public page includes:
              </Typography>
              <Box component="ul" sx={{ color: colors.text.secondary, pl: 2.5, mt: 1.5, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.8, '& li': { mb: 1 } }}>
                <li><strong style={{ color: colors.text.primary }}>Band image & bio</strong> — Your band's identity at a glance</li>
                <li><strong style={{ color: colors.text.primary }}>Music links</strong> — Spotify, Apple Music, Bandcamp, etc.</li>
                <li><strong style={{ color: colors.text.primary }}>Social links</strong> — Instagram, TikTok, YouTube, and more</li>
                <li><strong style={{ color: colors.text.primary }}>Photo gallery</strong> — Up to 4 images to showcase your band</li>
                <li><strong style={{ color: colors.text.primary }}>Featured video</strong> — Embed a YouTube or other video</li>
                <li><strong style={{ color: colors.text.primary }}>Upcoming shows</strong> — Public events you choose to display</li>
                <li><strong style={{ color: colors.text.primary }}>Contact info</strong> — Let venues and bookers reach out</li>
              </Box>
              <Box
                sx={{
                  bgcolor: colors.purple.lighter,
                  borderLeft: `4px solid ${colors.purple.main}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.purple.dark, fontWeight: 600, fontSize: { xs: '1.05rem', md: '1.15rem' } }}>
                  One link to share everywhere
                </Typography>
                <Typography sx={{ color: colors.purple.main, fontSize: { xs: '1rem', md: '1.075rem' }, mt: 1, lineHeight: 1.7 }}>
                  Put your Amplee page link in your Instagram bio, on your flyers, or send it to venues. Everything about your band in one place.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Band Identity */}
            <HelpSection
              icon={<BrushIcon sx={{ fontSize: 28, color: colors.accent.pink }} />}
              title="Band image, bio & theme"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Make your page look like your band. Customize your identity and theme:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <FeatureCard
                  title="Band image"
                  description="Your main photo that appears at the top of the page"
                />
                <FeatureCard
                  title="Bio"
                  description="A short description of your band—genre, vibe, origin story"
                />
                <FeatureCard
                  title="Page theme"
                  description="Choose colors that match your band's aesthetic"
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                To edit, go to your band's <strong style={{ color: colors.text.primary }}>Public Page</strong> tab and tap <strong style={{ color: colors.text.primary }}>Edit</strong>.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Links */}
            <HelpSection
              icon={<LinkIcon sx={{ fontSize: 28, color: colors.accent.blue }} />}
              title="Music, socials & website"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Add all your important links so fans can find your music and follow you:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <LinkTypeCard
                  title="Music platforms"
                  examples="Spotify, Apple Music, Bandcamp, SoundCloud"
                />
                <LinkTypeCard
                  title="Social media"
                  examples="Instagram, TikTok, Facebook, Twitter/X"
                />
                <LinkTypeCard
                  title="Video"
                  examples="YouTube, Vimeo"
                />
                <LinkTypeCard
                  title="Website"
                  examples="Your band's website or EPK"
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Links appear as buttons on your public page. Add as many as you need.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Gallery & Video */}
            <HelpSection
              icon={<CollectionsIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
              title="Gallery & featured video"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Show off your band with photos and video:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <FeatureCard
                  title="Photo gallery"
                  description="Upload up to 4 images—live shots, promo photos, album art"
                />
                <FeatureCard
                  title="Featured video"
                  description="Embed a music video, live performance, or promo clip"
                />
              </Stack>
              <Box
                sx={{
                  bgcolor: colors.accent.green + '15',
                  borderLeft: `4px solid ${colors.accent.green}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1rem', md: '1.075rem' } }}>
                  Tip: Use your best shots
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 1, lineHeight: 1.6 }}>
                  Quality over quantity. Pick 4 photos that really capture your band's energy and style.
                </Typography>
              </Box>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Contact */}
            <HelpSection
              icon={<MailOutlineIcon sx={{ fontSize: 28, color: colors.accent.yellow }} />}
              title="Contact & inquiries"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Make it easy for venues, bookers, and press to reach you:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <FeatureCard
                  title="Booking email"
                  description="Where venues and promoters can send gig inquiries"
                />
                <FeatureCard
                  title="General contact"
                  description="For press, fans, or other inquiries"
                />
              </Stack>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, mt: 4, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Your contact info is displayed on your public page so people can reach out directly.
              </Typography>
            </HelpSection>

            <Divider sx={{ borderColor: colors.bg.tertiary }} />

            {/* Public Shows */}
            <HelpSection
              icon={<EventIcon sx={{ fontSize: 28, color: colors.accent.teal }} />}
              title="Showing upcoming events"
            >
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                Let fans know where to catch you live by displaying your upcoming shows on your public page:
              </Typography>
              <Stack spacing={2.5} sx={{ mt: 3 }}>
                <StepItem number={1}>
                  Go to an <strong style={{ color: colors.text.primary }}>event</strong> in your band
                </StepItem>
                <StepItem number={2}>
                  Open the event's <strong style={{ color: colors.text.primary }}>settings</strong>
                </StepItem>
                <StepItem number={3}>
                  Toggle <strong style={{ color: colors.text.primary }}>Show on public page</strong> to on
                </StepItem>
              </Stack>
              <Box
                sx={{
                  bgcolor: colors.accent.teal + '15',
                  borderLeft: `4px solid ${colors.accent.teal}`,
                  borderRadius: '0 12px 12px 0',
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography sx={{ color: colors.text.primary, fontWeight: 600, fontSize: { xs: '1rem', md: '1.075rem' } }}>
                  You control what's public
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontSize: { xs: '0.95rem', md: '1rem' }, mt: 1, lineHeight: 1.6 }}>
                  Only events you explicitly mark as public will appear. Private gigs, rehearsals, and practices stay hidden.
                </Typography>
              </Box>
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
              Related Articles
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <RelatedCard
                title="Bands"
                description="Creating and managing your band"
                href="/help/bands"
                color={colors.accent.blue}
              />
              <RelatedCard
                title="Events"
                description="Managing shows and practices"
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
              Still have questions?
            </Typography>
            <Typography sx={{ color: colors.text.secondary, mb: 3, fontSize: { xs: '1rem', md: '1.1rem' } }}>
              We're here to help you set up your public page.
            </Typography>
            <Button
              href="mailto:hello.amplee@gmail.com?subject=Help%20with%20Public%20Page"
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

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: '1rem', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.95rem', lineHeight: 1.6 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function LinkTypeCard({
  title,
  examples,
}: {
  title: string;
  examples: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: colors.bg.secondary,
        border: `1px solid ${colors.bg.tertiary}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontWeight: 700, color: colors.text.primary, fontSize: '1rem' }}>
              {title}
            </Typography>
            <Typography sx={{ color: colors.text.muted, fontSize: '0.9rem', mt: 0.25 }}>
              {examples}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Help Center • Amplee',
  description: 'Learn how to use Amplee to organize your band',
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
  },
  green: {
    main: '#34d399',
    lighter: '#D1FAE5',
  },
  yellow: {
    main: '#f59e0b',
    lighter: '#FEF3C7',
  },
  pink: {
    main: '#f472b6',
    lighter: '#FCE7F3',
  },
  blue: {
    main: '#38bdf8',
    lighter: '#E0F2FE',
  },
  teal: {
    main: '#14b8a6',
    lighter: '#CCFBF1',
  },
};

const gettingStarted = [
  {
    id: 'download',
    title: 'Download Amplee',
    description: 'Get the app on iPhone, iPad, Android, or tablet',
    href: '/help/download',
    icon: <DownloadIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
  {
    id: 'account',
    title: 'Account & Login',
    description: 'Create an account, sign in, and manage your profile',
    href: '/help/account',
    icon: <LoginIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
  {
    id: 'profile-settings',
    title: 'Profile & Settings',
    description: 'Edit your profile, set availability, and manage your account',
    href: '/help/profile-settings',
    icon: <PersonIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
];

const yourEvents = [
  {
    id: 'event-chat',
    title: 'Chat',
    description: 'Message your band about a specific event with emoji reactions and song tagging',
    href: '/help/events/chat',
    icon: <ForumOutlinedIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'event-details',
    title: 'Details',
    description: 'Event info, Google Calendar sync, and attendance status at a glance',
    href: '/help/events/details',
    icon: <InfoOutlinedIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'event-rollcall',
    title: 'Roll Call',
    description: "Mark your availability and see who's confirmed for the event",
    href: '/help/events/rollcall',
    icon: <HowToRegIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'event-setlist',
    title: 'Setlist',
    description: 'Build and share the song order for your show',
    href: '/help/events/setlist',
    icon: <QueueMusicIcon sx={{ fontSize: 36 }} />,
    color: colors.pink.main,
    bgColor: colors.pink.lighter,
    available: true,
  },
  {
    id: 'event-notes',
    title: 'Notes',
    description: 'Add load-in times, parking info, and other need-to-know details',
    href: '/help/events/notes',
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'event-files',
    title: 'Files',
    description: 'Attach flyers, contracts, stage plots, and more',
    href: '/help/events/files',
    icon: <FolderOutlinedIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'event-settings',
    title: 'Settings',
    description: 'Add or remove members, edit details, or delete the event',
    href: '/help/events/settings',
    icon: <SettingsIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
];

const yourBand = [
  {
    id: 'bands',
    title: 'Bands',
    description: 'Create your band, invite members, and manage roles',
    href: '/help/bands',
    icon: <GroupsIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
  {
    id: 'proposals',
    title: 'Proposals',
    description: 'Float potential gigs and let the band vote',
    href: '/help/proposals',
    icon: <AssignmentIcon sx={{ fontSize: 36 }} />,
    color: colors.yellow.main,
    bgColor: colors.yellow.lighter,
    available: true,
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Manage confirmed shows, practices, and rehearsals',
    href: '/help/events',
    icon: <CalendarTodayIcon sx={{ fontSize: 36 }} />,
    color: colors.green.main,
    bgColor: colors.green.lighter,
    available: true,
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Manage your songs and build setlists for shows',
    href: '/help/library',
    icon: <LibraryMusicIcon sx={{ fontSize: 36 }} />,
    color: colors.pink.main,
    bgColor: colors.pink.lighter,
    available: true,
  },
  {
    id: 'roster',
    title: 'Roster',
    description: 'Save different lineups and invite the right people to each event',
    href: '/help/roster',
    icon: <PeopleIcon sx={{ fontSize: 36 }} />,
    color: colors.blue.main,
    bgColor: colors.blue.lighter,
    available: true,
  },
  {
    id: 'availability',
    title: 'Availability',
    description: "Share when you're free so the band can book smarter",
    href: '/help/availability',
    icon: <CalendarMonthIcon sx={{ fontSize: 36 }} />,
    color: colors.teal.main,
    bgColor: colors.teal.lighter,
    available: true,
  },
  {
    id: 'public-page',
    title: 'Public Page',
    description: "Your band's free landing page with bio, links, photos, and upcoming shows",
    href: '/help/profile',
    icon: <PublicIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
  {
    id: 'band-settings',
    title: 'Band Settings',
    description: 'Set your role, update the band profile, manage admins, or delete the band',
    href: '/help/bands/settings',
    icon: <SettingsIcon sx={{ fontSize: 36 }} />,
    color: colors.purple.main,
    bgColor: colors.purple.lighter,
    available: true,
  },
];

export default function HelpCenterPage() {
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
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
              }}
            >
              <Image
                src="/logo.png"
                alt="Amplee"
                width={40}
                height={40}
                style={{ borderRadius: 10 }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: colors.text.primary,
                }}
              >
                Amplee
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          {/* Page Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: colors.purple.main,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Help Center
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.25rem', md: '3rem' },
                color: colors.text.primary,
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              How can we help?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: colors.text.secondary,
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              Choose a topic below to learn how Amplee can help you organize your band.
            </Typography>
          </Box>

          {/* Getting Started Section */}
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: colors.text.muted,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                mb: 3,
              }}
            >
              Getting Started
            </Typography>
            <Grid container spacing={3}>
              {gettingStarted.map((category) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                  <CategoryCard {...category} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Your Bands Section */}
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: colors.text.muted,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                mb: 3,
              }}
            >
              Your Bands
            </Typography>
            <Grid container spacing={3}>
              {yourBand.map((category) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                  <CategoryCard {...category} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Your Events Section */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: colors.text.muted,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                mb: 3,
              }}
            >
              Your Events
            </Typography>
            <Grid container spacing={3}>
              {yourEvents.map((category) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                  <CategoryCard {...category} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Still need help */}
          <Box
            sx={{
              mt: { xs: 8, md: 10 },
              p: { xs: 4, md: 5 },
              bgcolor: colors.bg.secondary,
              borderRadius: 4,
              border: `1px solid ${colors.bg.tertiary}`,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                mb: 1.5,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
              }}
            >
              Can't find what you're looking for?
            </Typography>
            <Typography
              sx={{
                color: colors.text.secondary,
                mb: 3,
                fontSize: { xs: '1rem', md: '1.1rem' },
              }}
            >
              Reach out and we'll get back to you as soon as possible.
            </Typography>
            <Box
              component="a"
              href="mailto:hello.amplee@gmail.com"
              sx={{
                display: 'inline-block',
                bgcolor: colors.purple.main,
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: colors.purple.light,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Contact Support
            </Box>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

function CategoryCard({
  title,
  description,
  href,
  icon,
  color,
  bgColor,
  available,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  available: boolean;
}) {
  const content = (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        bgcolor: available ? colors.bg.secondary : colors.bg.tertiary,
        borderRadius: 4,
        border: `1px solid ${colors.bg.tertiary}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: available ? 'pointer' : 'default',
        opacity: available ? 1 : 0.6,
        transition: 'all 0.2s ease',
        ...(available && {
          '&:hover': {
            borderColor: color,
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px -8px ${color}25`,
          },
        }),
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          bgcolor: available ? bgColor : colors.bg.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: available ? color : colors.text.muted,
          mb: 3,
        }}
      >
        {available ? icon : <LockIcon sx={{ fontSize: 32 }} />}
      </Box>

      {/* Title */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.25rem', md: '1.4rem' },
          color: available ? colors.text.primary : colors.text.muted,
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        sx={{
          fontSize: { xs: '0.95rem', md: '1rem' },
          color: available ? colors.text.secondary : colors.text.muted,
          lineHeight: 1.6,
          flex: 1,
        }}
      >
        {available ? description : 'Coming soon'}
      </Typography>

      {/* Coming soon badge for unavailable */}
      {!available && (
        <Box
          sx={{
            mt: 2,
            display: 'inline-flex',
            alignSelf: 'flex-start',
            px: 1.5,
            py: 0.5,
            bgcolor: colors.bg.primary,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Coming Soon
        </Box>
      )}
    </Box>
  );

  if (!available) {
    return content;
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      {content}
    </Link>
  );
}

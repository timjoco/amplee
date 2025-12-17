export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import LegalHeader from '@/components/Legal/LegalHeader';
import { Box, Container, Stack, Typography } from '@mui/material';

export const metadata = {
  title: 'Community Guidelines • Amplee',
};

export default function CommunityGuidelinesPage() {
  return (
    <Box
      sx={{
        bgcolor: '#0B0A0F',
        color: '#E8E6F0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flex: 1, py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Stack spacing={3}>
            {/* Header */}
            <LegalHeader title="Community Guidelines" />

            {/* Body */}
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: '18px',
                border: '1px solid rgba(139, 92, 246, 0.16)',
                background:
                  'linear-gradient(145deg, rgba(20, 18, 28, 0.85), rgba(10, 8, 15, 0.92))',
                lineHeight: 1.75,
              }}
            >
              <Typography paragraph>
                Amplee exists to help musicians collaborate, stay organized, and
                create together. These Community Guidelines explain what is and
                isn’t allowed on Amplee, and apply to all use of the Service,
                including messages, profiles, band spaces, files, setlists,
                events, and public pages.
              </Typography>

              <Typography paragraph sx={{ color: 'rgba(232, 230, 240, 0.75)' }}>
                These Guidelines are incorporated into and form part of Amplee’s
                Terms of Service. Violations may result in content removal,
                account restrictions, or termination.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                1. Be respectful
              </Typography>
              <ul>
                <li>Harassment, threats, or bullying are not allowed.</li>
                <li>
                  Hate speech or conduct targeting individuals or groups based
                  on protected characteristics (including race, ethnicity,
                  religion, gender identity, sexual orientation, disability, or
                  nationality) is prohibited.
                </li>
                <li>
                  Do not encourage, glorify, or threaten violence or self-harm.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                2. No illegal or dangerous activity
              </Typography>
              <ul>
                <li>
                  Don’t use Amplee to plan, promote, or facilitate illegal
                  activity.
                </li>
                <li>
                  Content involving exploitation, abuse, or sexual content
                  involving minors is strictly prohibited and may be reported to
                  authorities as required by law.
                </li>
                <li>
                  Don’t share instructions or tools for hacking, malware, or
                  bypassing safeguards.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                3. Appropriate content
              </Typography>
              <ul>
                <li>
                  Explicit sexual content, graphic violence, or shock content is
                  not allowed.
                </li>
                <li>
                  Content should not intentionally disrupt collaboration or
                  community spaces.
                </li>
                <li>
                  We may restrict or remove content that undermines the purpose
                  of the Service.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                4. Intellectual property
              </Typography>
              <ul>
                <li>
                  Only upload or share content you own or have permission to
                  use.
                </li>
                <li>
                  Respect copyrights, trademarks, and other intellectual
                  property rights.
                </li>
                <li>
                  We respond to valid copyright and IP complaints in accordance
                  with applicable law.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                5. Privacy and personal data
              </Typography>
              <ul>
                <li>
                  Don’t share private or sensitive personal information about
                  others without consent.
                </li>
                <li>
                  This includes addresses, phone numbers, private messages, or
                  financial data.
                </li>
                <li>
                  Impersonation of another person, band, or organization is not
                  allowed.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                6. Platform integrity
              </Typography>
              <ul>
                <li>
                  Don’t attempt to exploit, disrupt, or reverse engineer the
                  Service.
                </li>
                <li>
                  Don’t scrape data, use bots, or automate access without
                  explicit permission.
                </li>
                <li>
                  Circumventing access controls, rate limits, or security
                  measures is prohibited.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                7. Spam and abuse
              </Typography>
              <ul>
                <li>
                  Don’t send spam, mass invites, or repetitive promotional
                  content.
                </li>
                <li>
                  Repeated unwanted contact or solicitation is not allowed.
                </li>
                <li>
                  Use band invites, messaging, and collaboration tools
                  responsibly.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                8. Enforcement
              </Typography>
              <Typography paragraph>
                We may take action if content or behavior violates these
                Guidelines or the Terms of Service. Enforcement actions may
                include:
              </Typography>
              <ul>
                <li>Content removal or visibility restrictions</li>
                <li>Warnings or temporary feature limitations</li>
                <li>Temporary account suspension</li>
                <li>Permanent account termination</li>
              </ul>
              <Typography paragraph sx={{ color: 'rgba(232, 230, 240, 0.75)' }}>
                We consider context, severity, and prior behavior when enforcing
                these rules and may use automated or manual review.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                9. Reporting violations
              </Typography>
              <Typography paragraph>
                If you encounter content or behavior that violates these
                Guidelines, please report it or contact us at{' '}
                <a href="mailto:hello.amplee@gmail.com">
                  hello.amplee@gmail.com
                </a>
                .
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                10. Changes to these Guidelines
              </Typography>
              <Typography paragraph>
                We may update these Community Guidelines from time to time.
                Continued use of Amplee after updates means you agree to the
                revised Guidelines.
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

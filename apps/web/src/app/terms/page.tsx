export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SiteFooter from '@/components/Footers/SiteFooter';
import LegalHeader from '@/components/Legal/LegalHeader';
import { Box, Container, Stack, Typography } from '@mui/material';

export const metadata = { title: 'Terms of Service • Amplee' };

export default function TermsPage() {
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
            <LegalHeader title="Terms of Service" />

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
              {/* ---- paste your terms body here (same content you already have) ---- */}
              <Typography paragraph>
                These Terms of Service (“Terms”) govern your access to and use
                of Amplee’s websites, mobile apps, and related services
                (collectively, the “Service”). “Amplee,” “we,” “us,” and “our”
                refers to Amplee LLC and its affiliates. By creating an account,
                accessing, or using the Service, you agree to these Terms and
                our Privacy Policy.
              </Typography>

              <Typography paragraph sx={{ color: 'rgba(232, 230, 240, 0.75)' }}>
                If you do not agree, do not use the Service.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                1. Eligibility and age requirements
              </Typography>
              <Typography paragraph>
                You must be at least 13 years old to use the Service. If you are
                under the age of majority where you live, you may use the
                Service only if your parent or legal guardian agrees to these
                Terms and is responsible for your use.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                2. Your account
              </Typography>
              <ul>
                <li>
                  <strong>Account security.</strong> You’re responsible for
                  safeguarding your login credentials and for all activity on
                  your account.
                </li>
                <li>
                  <strong>Accurate information.</strong> You agree to provide
                  accurate information and keep it up to date.
                </li>
                <li>
                  <strong>Account sharing and impersonation.</strong> Don’t
                  share accounts, misrepresent your identity, or impersonate
                  others.
                </li>
                <li>
                  <strong>Team/band access.</strong> Bands, rosters, and shared
                  workspaces may have multiple users. Admins may be able to
                  manage members, permissions, and settings for that workspace.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                3. The Service
              </Typography>
              <ul>
                <li>
                  <strong>What we provide.</strong> Amplee helps bands and
                  artists coordinate events, availability, setlists, files,
                  messages, and related workflows.
                </li>
                <li>
                  <strong>Changes.</strong> We may add, remove, or change
                  features over time. We’ll try to avoid changes that materially
                  reduce paid features during an active billing period, but the
                  Service may evolve.
                </li>
                <li>
                  <strong>Beta features.</strong> Some features may be marked
                  beta/preview and may be less reliable or subject to change.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                4. Your content
              </Typography>
              <Typography paragraph>
                “Your Content” includes text, images, audio, files, links, event
                details, setlists, messages, and other materials you submit to
                the Service.
              </Typography>
              <ul>
                <li>
                  <strong>You keep ownership.</strong> You retain any rights you
                  have in Your Content.
                </li>
                <li>
                  <strong>License to operate the Service.</strong> You grant
                  Amplee a worldwide, non-exclusive, royalty-free license to
                  host, store, reproduce, display, perform, and distribute Your
                  Content solely to operate, improve, and secure the Service
                  (including sharing Your Content with people you choose, like
                  band members).
                </li>
                <li>
                  <strong>Your responsibility.</strong> You are responsible for
                  Your Content and confirm you have the rights needed to upload
                  and share it.
                </li>
                <li>
                  <strong>Moderation.</strong> We may remove or restrict content
                  that violates these Terms or applicable law, and we may
                  suspend or terminate accounts for violations.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                5. Amplee’s content and software
              </Typography>
              <ul>
                <li>
                  <strong>Our IP.</strong> The Service, including software,
                  design, and trademarks, is owned by Amplee or its licensors
                  and is protected by law.
                </li>
                <li>
                  <strong>Limited license.</strong> We grant you a limited,
                  revocable, non-transferable license to use the Service in
                  accordance with these Terms.
                </li>
                <li>
                  <strong>Feedback.</strong> If you provide feedback or
                  suggestions, you grant us permission to use it without
                  restriction or compensation.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                6. Paid plans, trials, and billing
              </Typography>
              <ul>
                <li>
                  <strong>Subscriptions.</strong> Some features may require
                  payment (e.g., premium plans). If you subscribe, you agree to
                  pay the prices and applicable taxes shown at purchase.
                </li>
                <li>
                  <strong>Auto-renewal.</strong> Unless you cancel,
                  subscriptions may renew automatically at the end of each
                  billing period.
                </li>
                <li>
                  <strong>Trials and promos.</strong> Trials or promotional
                  pricing may convert to paid plans unless you cancel before the
                  trial ends.
                </li>
                <li>
                  <strong>Refunds.</strong> Refunds, if any, are handled
                  according to the rules of the platform you purchased through
                  (e.g., Apple App Store / Google Play) and any refund policy we
                  publish.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                7. Acceptable use
              </Typography>
              <Typography paragraph>
                You agree not to misuse the Service. For example, you will not:
              </Typography>
              <ul>
                <li>
                  Violate laws or infringe others’ rights (including IP and
                  privacy).
                </li>
                <li>Harass, threaten, or promote violence or hate.</li>
                <li>
                  Upload malware, attempt to disrupt the Service, or probe/scan
                  systems for vulnerabilities.
                </li>
                <li>
                  Reverse engineer, scrape, or access the Service using
                  automated means except as permitted by us in writing.
                </li>
                <li>
                  Attempt to access accounts, bands, or data you do not have
                  permission to access.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                8. Third-party services and links
              </Typography>
              <Typography paragraph>
                The Service may integrate with or link to third-party services
                (e.g., music platforms, calendars, payment providers). We are
                not responsible for third-party content, policies, or practices.
                Your use of third-party services is governed by their terms.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                9. Termination
              </Typography>
              <ul>
                <li>
                  <strong>By you.</strong> You may stop using the Service at any
                  time. You can request account deletion subject to legal and
                  operational requirements.
                </li>
                <li>
                  <strong>By us.</strong> We may suspend or terminate access if
                  we reasonably believe you violated these Terms, pose risk to
                  the Service or others, or as required by law.
                </li>
                <li>
                  <strong>Effect.</strong> Upon termination, your license to use
                  the Service ends. Some provisions of these Terms survive
                  termination (e.g., IP, disclaimers, limitation of liability,
                  dispute resolution).
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                10. Indemnification
              </Typography>
              <Typography paragraph>
                To the extent permitted by law, you agree to indemnify and hold
                harmless Amplee from claims, liabilities, damages, losses, and
                expenses (including reasonable attorneys’ fees) arising from (a)
                Your Content, (b) your use of the Service, or (c) your violation
                of these Terms.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                11. Disclaimers
              </Typography>
              <Typography paragraph>
                The Service is provided “as is” and “as available.” To the
                maximum extent permitted by law, Amplee disclaims all
                warranties, express or implied, including implied warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement. We do not guarantee the Service will be
                uninterrupted, secure, or error-free, or that content will be
                accurate.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                12. Limitation of liability
              </Typography>
              <Typography paragraph>
                To the maximum extent permitted by law, Amplee will not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits, revenues, data,
                goodwill, or other intangible losses arising from or related to
                your use of (or inability to use) the Service.
              </Typography>
              <Typography paragraph>
                To the extent permitted by law, Amplee’s total liability for any
                claim arising out of or relating to these Terms or the Service
                will not exceed the greater of (a) the amount you paid to Amplee
                for the Service in the 3 months before the event giving rise to
                the claim, or (b) $100.
              </Typography>
              <Typography paragraph sx={{ color: 'rgba(232, 230, 240, 0.75)' }}>
                Some jurisdictions do not allow certain limitations. In those
                jurisdictions, our liability is limited to the greatest extent
                permitted by law.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                13. Settling disputes, arbitration, and class-action waiver
                (U.S.)
              </Typography>
              <Typography
                paragraph
                sx={{ fontWeight: 900, textTransform: 'uppercase' }}
              >
                Please read carefully. This section may significantly affect
                your legal rights.
              </Typography>
              <ul>
                <li>
                  <strong>Informal resolution first.</strong> Before filing a
                  claim, you agree to contact us at{' '}
                  <a href="mailto:hello.amplee@gmail.com">
                    hello.amplee@gmail.com
                  </a>{' '}
                  with your name, the email on your account, a description of
                  the issue, and how you want it resolved. We’ll try to resolve
                  disputes informally.
                </li>
                <li>
                  <strong>Arbitration.</strong> If we can’t resolve a dispute
                  informally, you and Amplee agree that any dispute arising out
                  of or relating to these Terms or the Service will be resolved
                  by binding arbitration on an individual basis, except that
                  either party may bring claims in small claims court if
                  eligible. (The arbitration will be administered by a
                  recognized arbitration provider under its rules.)
                </li>
                <li>
                  <strong>No class actions.</strong> You and Amplee agree to
                  bring disputes only in an individual capacity, and not as a
                  plaintiff or class member in any purported class or
                  representative proceeding.
                </li>
                <li>
                  <strong>Opt-out.</strong> You may opt out of arbitration by
                  emailing{' '}
                  <a href="mailto:hello.amplee@gmail.com">
                    hello.amplee@gmail.com
                  </a>{' '}
                  within 30 days of first accepting these Terms, stating you
                  want to opt out of arbitration.
                </li>
              </ul>
              <Typography paragraph sx={{ color: 'rgba(232, 230, 240, 0.75)' }}>
                If you are outside the U.S., mandatory consumer protections in
                your country may apply, and this section applies only to the
                extent permitted by local law.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                14. Governing law and venue
              </Typography>
              <Typography paragraph>
                These Terms are governed by the laws of the State of Missouri
                and applicable U.S. federal law, without regard to
                conflict-of-law rules. For disputes not subject to arbitration
                (or if arbitration is not permitted), you agree to exclusive
                jurisdiction and venue in state or federal courts located in
                Missouri, unless applicable law says otherwise.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                15. Changes to these Terms
              </Typography>
              <Typography paragraph>
                We may update these Terms from time to time. If we make material
                changes, we’ll provide notice (for example, by posting an
                updated date or through the Service). By continuing to use the
                Service after changes take effect, you agree to the updated
                Terms.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                16. Miscellaneous
              </Typography>
              <ul>
                <li>
                  <strong>Severability.</strong> If any provision is held
                  unenforceable, the remaining provisions remain in effect.
                </li>
                <li>
                  <strong>Assignment.</strong> You may not assign your rights
                  under these Terms without our consent. We may assign our
                  rights as part of a merger, acquisition, or asset sale.
                </li>
                <li>
                  <strong>No waiver.</strong> Our failure to enforce a provision
                  is not a waiver.
                </li>
              </ul>

              <Typography variant="h6" sx={{ fontWeight: 800, mt: 3 }}>
                17. Contact
              </Typography>
              <Typography paragraph>
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:hello.amplee@gmail.com">
                  hello.amplee@gmail.com
                </a>
                .
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  partnerName?: string
  affiliateId?: string
  email?: string
  phone?: string
  businessName?: string
  referralSource?: string
  message?: string
}

const Email = ({
  partnerName, affiliateId, email, phone, businessName, referralSource, message,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New Partner Signup: {partnerName || 'New partner'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ paddingBottom: '20px' }}>
          <Text style={logo}>Ryland Partners</Text>
        </Section>
        <Heading style={h1}>New Partner Signup</Heading>
        <Text style={text}>
          A new referral partner just signed up on the portal.
        </Text>
        <Hr style={divider} />
        <Row label="Name" value={partnerName} />
        <Row label="Affiliate ID" value={affiliateId} />
        <Row label="Email" value={email} />
        <Row label="Phone" value={phone} />
        <Row label="Business" value={businessName} />
        <Row label="Referral Source" value={referralSource} />
        {message ? <Row label="Message" value={message} /> : null}
        <Hr style={divider} />
        <Text style={footer}>
          Review this partner in Admin → Affiliates.
        </Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Section style={row}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={rowValue}>{value || '—'}</Text>
  </Section>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `New Partner Signup: ${d.partnerName || 'New partner'}`,
  to: 'info@rylandpartners.com',
  displayName: 'Partner Signup Notification',
  previewData: {
    partnerName: 'Jane Doe',
    affiliateId: 'JDoe1',
    email: 'jane@example.com',
    phone: '(555) 555-5555',
    businessName: 'Doe Consulting',
    referralSource: 'LinkedIn',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial','Helvetica',sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const logo = { fontSize: '20px', fontWeight: '700' as const, color: '#003A70', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1f36', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const divider = { borderColor: '#e2e8f0', margin: '20px 0' }
const row = { marginBottom: '10px' }
const rowLabel = { fontSize: '12px', color: '#94a3b8', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }
const rowValue = { fontSize: '15px', color: '#1a1f36', margin: 0, fontWeight: '500' as const }
const footer = { fontSize: '12px', color: '#a0aec0', margin: '0 0 8px' }

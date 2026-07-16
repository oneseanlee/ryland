import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  leadName?: string
  leadEmail?: string
  leadPhone?: string
  companyName?: string
  notes?: string
  partnerName?: string
  partnerAffiliateId?: string
  partnerEmail?: string
}

const Email = ({
  leadName, leadEmail, leadPhone, companyName, notes,
  partnerName, partnerAffiliateId, partnerEmail,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New client referral from {partnerName || 'a partner'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ paddingBottom: '20px' }}>
          <Text style={logo}>Ryland Partners</Text>
        </Section>
        <Heading style={h1}>New Partner Client Referral</Heading>
        <Text style={text}>
          <strong>{partnerName || 'A partner'}</strong> just submitted a new client.
        </Text>

        <Hr style={divider} />
        <Heading as="h2" style={h2}>Client</Heading>
        <Row label="Name" value={leadName} />
        <Row label="Email" value={leadEmail} />
        <Row label="Phone" value={leadPhone} />
        <Row label="Company" value={companyName} />
        {notes ? <Row label="Notes" value={notes} /> : null}

        <Hr style={divider} />
        <Heading as="h2" style={h2}>Referred By</Heading>
        <Row label="Partner" value={partnerName} />
        <Row label="Affiliate ID" value={partnerAffiliateId} />
        <Row label="Partner Email" value={partnerEmail} />

        <Hr style={divider} />
        <Text style={footer}>
          This lead was also added to GHL and placed in the Funding pipeline
          under the New Lead stage.
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
    `New Client Referral from ${d.partnerName || 'Partner'}: ${d.leadName || 'New lead'}`,
  to: 'info@rylandpartners.com',
  displayName: 'Partner New Lead Notification',
  previewData: {
    leadName: 'John Smith',
    leadEmail: 'john@example.com',
    leadPhone: '(555) 555-5555',
    partnerName: 'Jane Doe',
    partnerAffiliateId: 'JDoe1',
    partnerEmail: 'jane@example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Arial','Helvetica',sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const logo = { fontSize: '20px', fontWeight: '700' as const, color: '#003A70', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1f36', margin: '0 0 12px' }
const h2 = { fontSize: '13px', fontWeight: '600' as const, color: '#1a1f36', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const divider = { borderColor: '#e2e8f0', margin: '20px 0' }
const row = { marginBottom: '10px' }
const rowLabel = { fontSize: '12px', color: '#94a3b8', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }
const rowValue = { fontSize: '15px', color: '#1a1f36', margin: 0, fontWeight: '500' as const }
const footer = { fontSize: '12px', color: '#a0aec0', margin: '0 0 8px' }

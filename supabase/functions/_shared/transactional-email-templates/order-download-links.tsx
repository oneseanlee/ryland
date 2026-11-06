import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Ryland Partners"

interface DownloadLink {
  title: string
  url: string
}

interface OrderDownloadLinksProps {
  customerName?: string
  orderNumber?: string
  downloadLinks?: DownloadLink[]
  libraryUrl?: string
}

const OrderDownloadLinksEmail = ({
  customerName,
  orderNumber,
  downloadLinks = [],
  libraryUrl,
}: OrderDownloadLinksProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your download links for Order {orderNumber || '#'}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={headerSection}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {customerName ? `Hey ${customerName},` : 'Hey there,'}
        </Heading>
        <Text style={text}>
          Thank you for your purchase! Your digital products are ready to download.
          {orderNumber ? ` (Order ${orderNumber})` : ''}
        </Text>

        <Hr style={divider} />

        <Heading as="h2" style={h2}>Your Downloads</Heading>

        {downloadLinks.map((link, i) => (
          <Section key={i} style={downloadItem}>
            <Text style={itemTitle}>{link.title}</Text>
            <Button style={downloadButton} href={link.url}>
              Download Now
            </Button>
          </Section>
        ))}

        <Hr style={divider} />

        <Text style={text}>
          You can also access all your downloads anytime from your personal library:
        </Text>
        {libraryUrl && (
          <Button style={libraryButton} href={libraryUrl}>
            Go to My Downloads
          </Button>
        )}

        <Hr style={divider} />

        <Text style={footer}>
          If you have any questions, reply to this email or contact us at{' '}
          <Link href="mailto:support@rylandpartners.com" style={footerLink}>
            support@rylandpartners.com
          </Link>
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderDownloadLinksEmail,
  subject: (data: Record<string, any>) =>
    `Your downloads are ready — Order ${data.orderNumber || '#'}`,
  displayName: 'Order download links',
  previewData: {
    customerName: 'Jane',
    orderNumber: '#1001',
    downloadLinks: [
      { title: 'Business Credit Basics 101', url: 'https://rylandpartners.com/download/abc123' },
      { title: 'Net-30 Account Guide', url: 'https://rylandpartners.com/download/def456' },
    ],
    libraryUrl: 'https://rylandpartners.com/my-orders',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Arial', 'Helvetica', sans-serif" }
const container = { padding: '40px 24px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '24px' }
const logoText = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1f36',
  margin: '0',
  letterSpacing: '-0.5px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1f36',
  margin: '0 0 12px',
  lineHeight: '1.3',
}
const h2 = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1f36',
  margin: '0 0 16px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const text = {
  fontSize: '15px',
  color: '#4a5568',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const divider = { borderColor: '#e2e8f0', margin: '24px 0' }
const downloadItem = {
  backgroundColor: '#f7fafc',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '12px',
}
const itemTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1a1f36',
  margin: '0 0 10px',
}
const downloadButton = {
  backgroundColor: '#1a1f36',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '10px 20px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const libraryButton = {
  backgroundColor: '#ffffff',
  color: '#1a1f36',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  borderRadius: '6px',
  border: '2px solid #1a1f36',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = {
  fontSize: '12px',
  color: '#a0aec0',
  lineHeight: '1.5',
  margin: '0 0 8px',
}
const footerLink = { color: '#a0aec0', textDecoration: 'underline' }

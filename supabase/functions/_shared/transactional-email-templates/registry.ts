/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderDownloadLinks } from './order-download-links.tsx'
import { template as partnerSignupNotification } from './partner-signup-notification.tsx'
import { template as partnerNewLeadNotification } from './partner-new-lead-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-download-links': orderDownloadLinks,
  'partner-signup-notification': partnerSignupNotification,
  'partner-new-lead-notification': partnerNewLeadNotification,
}

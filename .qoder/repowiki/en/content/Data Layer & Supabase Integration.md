# Data Layer & Supabase Integration

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [client.ts](file://src/integrations/supabase/client.ts)
- [types.ts](file://src/integrations/supabase/types.ts)
- [useAuth.tsx](file://src/hooks/useAuth.tsx)
- [useAffiliateLeads.ts](file://src/hooks/useAffiliateLeads.ts)
- [useAdminRole.ts](file://src/hooks/useAdminRole.ts)
- [ResetPassword.tsx](file://src/pages/ResetPassword.tsx)
- [PortalLogin.tsx](file://src/pages/portal/PortalLogin.tsx)
- [AdminGuard.tsx](file://src/components/admin/AdminGuard.tsx)
- [AdminLayout.tsx](file://src/components/admin/AdminLayout.tsx)
- [AdminSidebar.tsx](file://src/components/admin/AdminSidebar.tsx)
- [AdminDashboard.tsx](file://src/pages/admin/AdminDashboard.tsx)
- [AdminLeads.tsx](file://src/pages/admin/AdminLeads.tsx)
- [AdminCommissions.tsx](file://src/pages/admin/AdminCommissions.tsx)
- [AdminAffiliates.tsx](file://src/pages/admin/AdminAffiliates.tsx)
- [AdminPayouts.tsx](file://src/pages/admin/AdminPayouts.tsx)
- [AdminReports.tsx](file://src/pages/admin/AdminReports.tsx)
- [index.ts](file://supabase/functions/ghl-affiliate-webhook/index.ts)
- [index.ts](file://supabase/functions/ghl-calendar/index.ts)
- [ConsultationCalendar.tsx](file://src/components/funnel/ConsultationCalendar.tsx)
- [PartnerOnboardingCalendar.tsx](file://src/components/funnel/PartnerOnboardingCalendar.tsx)
- [20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql](file://supabase/migrations/20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql)
- [20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql](file://supabase/migrations/20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql)
- [20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql](file://supabase/migrations/20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql)
- [20260320000000_admin_policies.sql](file://supabase/migrations/20260320000000_admin_policies.sql)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql)
- [20260325024643_email_infra.sql](file://supabase/migrations/20260325024643_email_infra.sql)
- [20260325035304_c2ee4398-7ffa-4021-bbda-9671e2f04eb7.sql](file://supabase/migrations/20260325035304_c2ee4398-7ffa-4021-bbda-9671e2f04eb7.sql)
- [20260325042306_4ee0e761-11f9-4bbb-a6b4-4438b51fe81b.sql](file://supabase/migrations/20260325042306_4ee0e761-11f9-4bbb-a6b4-4438b51fe81b.sql)
- [index.html](file://index.html)
- [config.toml](file://supabase/config.toml)
- [index.ts](file://supabase/functions/process-email-queue/index.ts)
- [index.ts](file://supabase/functions/send-transactional-email/index.ts)
- [index.ts](file://supabase/functions/handle-email-suppression/index.ts)
- [index.ts](file://supabase/functions/handle-email-unsubscribe/index.ts)
- [index.ts](file://supabase/functions/shopify-order-webhook/index.ts)
- [order-download-links.tsx](file://supabase/functions/_shared/transactional-email-templates/order-download-links.tsx)
- [registry.ts](file://supabase/functions/_shared/transactional-email-templates/registry.ts)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive email infrastructure with transactional email system
- Implemented email queue system using pgmq with auth and transactional priority queues
- Added suppression management with suppressed_emails, email_unsubscribe_tokens, and email_send_log tables
- Enhanced Shopify order webhook with bundle purchase handling and download email integration
- Created transactional email template system with React Email components
- Implemented email processing pipeline with rate limiting, retry logic, and dead letter queues
- Added comprehensive email suppression handling and unsubscribe token management

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Administrative Framework](#administrative-framework)
7. [Email Infrastructure](#email-infrastructure)
8. [External API Integration](#external-api-integration)
9. [Network Optimization & Performance](#network-optimization--performance)
10. [Dependency Analysis](#dependency-analysis)
11. [Performance Considerations](#performance-considerations)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Conclusion](#conclusion)
14. [Appendices](#appendices)

## Introduction
This document describes the data model and Supabase integration for the project. It focuses on the database schema design, entity relationships, field definitions for user accounts, affiliate leads, and application data. It also documents authentication setup, real-time features, data validation rules, data access patterns, caching strategies, performance considerations, data lifecycle, security measures, access control mechanisms, synchronization, offline capabilities, and error handling strategies for database operations.

**Updated**: The system now includes a comprehensive email infrastructure with transactional email processing, queue management, suppression handling, and integration with Shopify order processing for automated download email delivery.

## Project Structure
The project is a frontend-first React application that integrates with Supabase for authentication and data persistence. Key integration points include:
- Supabase client initialization and configuration
- Strongly typed database schema definitions with enhanced role-based access control
- Authentication hooks and pages with admin guard components
- Data access hooks for affiliate leads
- Supabase functions for webhook-driven data updates
- Database migrations defining RLS policies and schema evolution
- **New**: Comprehensive email infrastructure with transactional email processing
- **New**: Email queue system with priority handling and rate limiting
- **New**: Suppression management for bounce, complaint, and unsubscribe handling
- **New**: Shopify order webhook with bundle purchase detection and download email automation
- Network optimization through preconnect hints for reduced latency
- External API integration with GHL for calendar management and appointment booking
- Administrative dashboard with comprehensive management capabilities

```mermaid
graph TB
subgraph "Frontend"
Auth["Auth Provider<br/>useAuth.tsx"]
AdminGuard["Admin Guard<br/>AdminGuard.tsx"]
AdminLayout["Admin Layout<br/>AdminLayout.tsx"]
AdminSidebar["Admin Sidebar<br/>AdminSidebar.tsx"]
LeadsHook["Leads Query Hook<br/>useAffiliateLeads.ts"]
LoginPage["Portal Login Page<br/>PortalLogin.tsx"]
ResetPage["Reset Password Page<br/>ResetPassword.tsx"]
ConsultCal["Consultation Calendar<br/>ConsultationCalendar.tsx"]
PartnerCal["Partner Calendar<br/>PartnerOnboardingCalendar.tsx"]
HTML["HTML Entry Point<br/>index.html"]
end
subgraph "Supabase Integration"
Client["Supabase Client<br/>client.ts"]
Types["Typed Schema<br/>types.ts"]
Func["Webhook Function<br/>ghl-affiliate-webhook/index.ts"]
CalFunc["Calendar Function<br/>ghl-calendar/index.ts"]
ShopifyWebhook["Shopify Order Webhook<br/>shopify-order-webhook/index.ts"]
end
subgraph "Email Infrastructure"
EmailQueue["Email Queue System<br/>pgmq"]
SendLog["Send Log<br/>email_send_log"]
Suppressed["Suppressed Emails<br/>suppressed_emails"]
Tokens["Unsubscribe Tokens<br/>email_unsubscribe_tokens"]
ProcessQueue["Queue Processor<br/>process-email-queue/index.ts"]
SendEmail["Transactional Sender<br/>send-transactional-email/index.ts"]
SuppressHandler["Suppression Handler<br/>handle-email-suppression/index.ts"]
UnsubscribeHandler["Unsubscribe Handler<br/>handle-email-unsubscribe/index.ts"]
Templates["Email Templates<br/>React Email Components"]
end
subgraph "Database"
Migs["Migrations<br/>RLS Policies"]
AdminMig["Admin Policies<br/>20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql"]
EmailMig["Email Infrastructure<br/>20260325024643_email_infra.sql"]
Tables["Tables<br/>affiliates, affiliate_leads, commissions, payouts, speaker_requests, orders, order_items, user_roles, email_send_log, suppressed_emails, email_unsubscribe_tokens"]
end
subgraph "External APIs"
GHL["GHL Services<br/>LeadConnectorHQ"]
Shopify["Shopify Commerce"]
Lovable["Lovable Email API"]
end
HTML --> Client
Auth --> Client
AdminGuard --> Client
AdminLayout --> Client
AdminSidebar --> Client
LeadsHook --> Client
LoginPage --> Client
ResetPage --> Client
ConsultCal --> Client
PartnerCal --> Client
Client --> Types
Func --> Client
CalFunc --> Client
ShopifyWebhook --> Client
Client --> Tables
Migs --> Tables
AdminMig --> Tables
EmailMig --> Tables
Client --> GHL
Client --> Shopify
Client --> Lovable
Client --> EmailQueue
Client --> SendLog
Client --> Suppressed
Client --> Tokens
ProcessQueue --> EmailQueue
SendEmail --> Templates
SuppressHandler --> Suppressed
UnsubscribeHandler --> Tokens
```

**Diagram sources**
- [client.ts:1-17](file://src/integrations/supabase/client.ts#L1-L17)
- [types.ts:9-657](file://src/integrations/supabase/types.ts#L9-L657)
- [useAuth.tsx:1-143](file://src/hooks/useAuth.tsx#L1-L143)
- [AdminGuard.tsx:1-35](file://src/components/admin/AdminGuard.tsx#L1-L35)
- [AdminLayout.tsx:1-40](file://src/components/admin/AdminLayout.tsx#L1-L40)
- [AdminSidebar.tsx:1-67](file://src/components/admin/AdminSidebar.tsx#L1-L67)
- [useAffiliateLeads.ts:1-31](file://src/hooks/useAffiliateLeads.ts#L1-L31)
- [PortalLogin.tsx:95-125](file://src/pages/portal/PortalLogin.tsx#L95-L125)
- [ResetPassword.tsx:1-60](file://src/pages/ResetPassword.tsx#L1-L60)
- [ConsultationCalendar.tsx:1-461](file://src/components/funnel/ConsultationCalendar.tsx#L1-L461)
- [PartnerOnboardingCalendar.tsx:1-357](file://src/components/funnel/PartnerOnboardingCalendar.tsx#L1-L357)
- [index.ts:41-174](file://supabase/functions/ghl-affiliate-webhook/index.ts#L41-L174)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)
- [index.ts:74-105](file://supabase/functions/shopify-order-webhook/index.ts#L74-L105)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)
- [order-download-links.tsx:1-174](file://supabase/functions/_shared/transactional-email-templates/order-download-links.tsx#L1-L174)
- [20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql:1-8](file://supabase/migrations/20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql#L1-L8)
- [20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql:1-5](file://supabase/migrations/20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql#L1-L5)
- [20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql:1-5](file://supabase/migrations/20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql#L1-L5)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:1-82](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L1-L82)
- [20260325024643_email_infra.sql:1-293](file://supabase/migrations/20260325024643_email_infra.sql#L1-L293)
- [index.html:17](file://index.html#L17)

**Section sources**
- [README.md:1-74](file://README.md#L1-L74)
- [package.json:1-95](file://package.json#L1-L95)

## Core Components
- Supabase client configured with local storage-backed session persistence and automatic token refresh.
- Strongly typed schema exposing tables, enums, and helper types for type-safe database operations.
- Authentication provider managing user/session state and affiliate profile lookup.
- Data access hook for retrieving affiliate-specific leads with reactive queries.
- Webhook function integrating with external systems to create/update affiliate leads.
- Calendar management function integrating with GHL services for appointment scheduling and availability checking.
- Database migrations establishing row-level security (RLS) policies for data isolation.
- **New**: Comprehensive email infrastructure with transactional email processing pipeline.
- **New**: Email queue system using pgmq with priority handling for auth and transactional emails.
- **New**: Suppression management system for handling bounces, complaints, and unsubscribes.
- **New**: Shopify order webhook with bundle purchase detection and automated download email delivery.
- Network optimization through preconnect hints for reduced database connection latency.
- External API integration with GHL for calendar management and appointment booking.
- Administrative dashboard with comprehensive management capabilities.

**Section sources**
- [client.ts:1-17](file://src/integrations/supabase/client.ts#L1-L17)
- [types.ts:9-657](file://src/integrations/supabase/types.ts#L9-L657)
- [useAuth.tsx:1-143](file://src/hooks/useAuth.tsx#L1-L143)
- [AdminGuard.tsx:1-35](file://src/components/admin/AdminGuard.tsx#L1-L35)
- [AdminLayout.tsx:1-40](file://src/components/admin/AdminLayout.tsx#L1-L40)
- [AdminSidebar.tsx:1-67](file://src/components/admin/AdminSidebar.tsx#L1-L67)
- [useAffiliateLeads.ts:1-31](file://src/hooks/useAffiliateLeads.ts#L1-L31)
- [index.ts:41-174](file://supabase/functions/ghl-affiliate-webhook/index.ts#L41-L174)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)
- [index.ts:74-105](file://supabase/functions/shopify-order-webhook/index.ts#L74-L105)
- [20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql:1-5](file://supabase/migrations/20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql#L1-L5)
- [20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql:1-5](file://supabase/migrations/20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql#L1-L5)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:1-82](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L1-L82)
- [20260325024643_email_infra.sql:1-293](file://supabase/migrations/20260325024643_email_infra.sql#L1-L293)

## Architecture Overview
The data layer architecture centers on a typed Supabase client, React Query for caching and reactivity, and Supabase RLS for access control. Authentication events drive state updates, while external webhooks synchronize data into affiliate leads. The architecture now includes comprehensive external API integration with GHL services for calendar management and appointment booking, and **New**: a complete email infrastructure with transactional email processing, queue management, and suppression handling. The email system uses a priority-based queue system with pgmq, rate limiting, and dead letter queues for reliable email delivery. Network optimization through preconnect hints reduces latency for database operations and improves real-time feature responsiveness.

**Updated**: The architecture now incorporates a comprehensive administrative framework with role-based access control, enabling granular permissions for different user roles.

```mermaid
sequenceDiagram
participant HTML as "HTML Entry Point<br/>index.html"
participant UI as "UI Components"
participant Auth as "Auth Provider<br/>useAuth.tsx"
participant AdminGuard as "Admin Guard<br/>AdminGuard.tsx"
participant Client as "Supabase Client<br/>client.ts"
participant CalComp as "Calendar Components<br/>ConsultationCalendar.tsx"
participant DB as "PostgreSQL Tables<br/>types.ts"
participant Func as "Webhook Function<br/>index.ts"
participant CalFunc as "Calendar Function<br/>ghl-calendar/index.ts"
participant Shopify as "Shopify Order Webhook<br/>shopify-order-webhook/index.ts"
participant EmailProc as "Email Processor<br/>process-email-queue/index.ts"
participant EmailSend as "Email Sender<br/>send-transactional-email/index.ts"
participant GHL as "GHL Services"
HTML->>Client : Preconnect hint for Supabase domain
UI->>Auth : Initialize auth state
Auth->>Client : Subscribe to auth state changes
Client-->>Auth : User/session events
Auth->>Client : Lookup affiliate profile
Client->>DB : SELECT affiliates WHERE user_id
DB-->>Client : Affiliate record
Client-->>Auth : Affiliate data
UI->>AdminGuard : Check admin permissions
AdminGuard->>Client : Check has_role(auth.uid(), 'admin')
Client->>DB : SELECT user_roles WHERE user_id
DB-->>Client : Role check result
Client-->>AdminGuard : Permission granted/denied
UI->>Client : Query affiliate_leads
Client->>DB : SELECT affiliate_leads WHERE affiliate_id
DB-->>Client : Lead rows
Client-->>UI : Typed leads data
Func->>Client : Service role insert/update
Client->>DB : INSERT/UPDATE affiliate_leads
DB-->>Client : Acknowledgement
CalComp->>Client : Invoke ghl-calendar function
Client->>CalFunc : Function invocation
CalFunc->>GHL : GET free-slots with timestamp conversion
GHL-->>CalFunc : Available slots
CalFunc-->>Client : Calendar data
Client-->>UI : Calendar availability
Shopify->>Client : Order webhook
Client->>DB : UPSERT orders + INSERT order_items
DB-->>Client : Order data
Client->>EmailSend : Send download links email
EmailSend->>EmailProc : Enqueue transactional email
EmailProc->>EmailProc : Process queue with rate limiting
EmailProc->>DB : Update email_send_log
EmailProc-->>EmailSend : Email delivered
EmailSend-->>Client : Success
Client-->>UI : Order processed with email
```

**Diagram sources**
- [index.html:17](file://index.html#L17)
- [useAuth.tsx:68-106](file://src/hooks/useAuth.tsx#L68-L106)
- [AdminGuard.tsx:10-35](file://src/components/admin/AdminGuard.tsx#L10-L35)
- [client.ts:11-17](file://src/integrations/supabase/client.ts#L11-L17)
- [ConsultationCalendar.tsx:76-96](file://src/components/funnel/ConsultationCalendar.tsx#L76-L96)
- [types.ts:16-147](file://src/integrations/supabase/types.ts#L16-L147)
- [index.ts:155-166](file://supabase/functions/ghl-affiliate-webhook/index.ts#L155-L166)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)
- [index.ts:74-105](file://supabase/functions/shopify-order-webhook/index.ts#L74-L105)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)

## Detailed Component Analysis

### Supabase Client and Configuration
- Initializes the Supabase client with environment variables for URL and publishable key.
- Configures auth storage to use localStorage, persists sessions, and auto-refreshes tokens.

**Section sources**
- [client.ts:5-17](file://src/integrations/supabase/client.ts#L5-L17)

### Authentication and Access Control
- Authentication provider subscribes to auth state changes and loads affiliate data after session resolution.
- Uses a helper function to resolve the current affiliate ID for row-level security enforcement.
- Provides sign-in, sign-out, and password update operations.
- **Updated**: Integrated with role-based access control system for administrative permissions.

```mermaid
sequenceDiagram
participant Page as "PortalLogin.tsx"
participant Auth as "useAuth.tsx"
participant Client as "client.ts"
participant DB as "affiliates table"
Page->>Auth : signIn(email, password)
Auth->>Client : auth.signInWithPassword
Client-->>Auth : Session
Auth->>DB : SELECT affiliates WHERE user_id
DB-->>Auth : Affiliate record
Auth-->>Page : Auth state updated
```

**Diagram sources**
- [PortalLogin.tsx:112-121](file://src/pages/portal/PortalLogin.tsx#L112-L121)
- [useAuth.tsx:114-127](file://src/hooks/useAuth.tsx#L114-L127)
- [client.ts:11-17](file://src/integrations/supabase/client.ts#L11-L17)
- [types.ts:97-147](file://src/integrations/supabase/types.ts#L97-L147)

**Section sources**
- [useAuth.tsx:32-127](file://src/hooks/useAuth.tsx#L32-L127)
- [PortalLogin.tsx:95-125](file://src/pages/portal/PortalLogin.tsx#L95-L125)
- [ResetPassword.tsx:24-60](file://src/pages/ResetPassword.tsx#L24-L60)

### Data Access Hooks
- Affiliate leads hook performs a PostgREST query filtered by the authenticated affiliate's ID and sorted by last update.
- Integrates with React Query for caching, refetching, and error propagation.

```mermaid
sequenceDiagram
participant Hook as "useAffiliateLeads.ts"
participant Client as "client.ts"
participant DB as "affiliate_leads table"
Hook->>Client : FROM affiliate_leads SELECT * WHERE affiliate_id
Client->>DB : Query with filters
DB-->>Client : Rows
Client-->>Hook : Typed leads array
Hook-->>UI : leads, isLoading, error, refetch
```

**Diagram sources**
- [useAffiliateLeads.ts:14-27](file://src/hooks/useAffiliateLeads.ts#L14-L27)
- [types.ts:16-96](file://src/integrations/supabase/types.ts#L16-L96)

**Section sources**
- [useAffiliateLeads.ts:1-31](file://src/hooks/useAffiliateLeads.ts#L1-L31)

### Webhook Integration and Data Synchronization
- A Supabase Edge Function listens to external events and synchronizes affiliate leads.
- Supports creating leads from affiliate signups and updating leads from opportunity/contact stage changes.
- Uses service role credentials for secure database writes.

```mermaid
sequenceDiagram
participant Ext as "External System"
participant Func as "ghl-affiliate-webhook/index.ts"
participant Client as "client.ts"
participant DB as "affiliate_leads table"
Ext->>Func : POST webhook payload
Func->>Client : createClient(service_role)
alt New lead creation
Func->>DB : INSERT affiliate_leads
else Opportunity update
Func->>DB : UPDATE affiliate_leads SET pipeline_stage,status,deal_amount
end
DB-->>Func : Success
Func-->>Ext : JSON response
```

**Diagram sources**
- [index.ts:41-174](file://supabase/functions/ghl-affiliate-webhook/index.ts#L41-L174)
- [types.ts:16-96](file://src/integrations/supabase/types.ts#L16-L96)

**Section sources**
- [index.ts:41-174](file://supabase/functions/ghl-affiliate-webhook/index.ts#L41-L174)

### Database Schema and Entity Relationships
The schema defines core tables and enums used by the application. Below is a focused ER diagram for the most relevant entities in the data layer.

**Updated**: Enhanced with user_roles table for comprehensive role-based access control and new email infrastructure tables.

```mermaid
erDiagram
AFFILIATES {
string id PK
string affiliate_id
string full_name
string email
string phone
string company_name
string website
string payment_email
string w9_file_url
string ghl_contact_id
string user_id
enum status
timestamp created_at
timestamp updated_at
}
USER_ROLES {
uuid id PK
uuid user_id FK
enum role
}
AFFILIATE_LEADS {
string id PK
string affiliate_id FK
string full_name
string email
string phone
string company_name
string ghl_contact_id
string ghl_opportunity_id
string status
string pipeline_stage
number deal_amount
number commission_amount
string commission_status
string assigned_rep
timestamptz next_appointment_at
string next_step
string latest_update
timestamp created_at
timestamp updated_at
}
COMMISSIONS {
string id PK
string affiliate_id FK
string lead_id FK
string commission_type
number commission_amount
enum commission_status
timestamp created_at
timestamp updated_at
timestamp payout_date
}
PAYOUTS {
string id PK
string affiliate_id FK
number amount
enum status
string payout_period
string payment_method
timestamp created_at
timestamp updated_at
}
SPEAKER_REQUESTS {
string id PK
string affiliate_id FK
string full_name
string email
string event_name
string audience_description
string organization_name
string event_location
string requested_date
string notes
enum status
timestamp created_at
timestamp updated_at
}
ORDERS {
string id PK
string shopify_order_id
string shopify_order_number
string customer_name
string email
timestamp created_at
}
ORDER_ITEMS {
string id PK
string order_id FK
string shopify_product_handle
string product_title
string download_token
timestamp created_at
timestamp downloaded_at
}
EMAIL_SEND_LOG {
uuid id PK
text message_id
text template_name
text recipient_email
text status
text error_message
jsonb metadata
timestamptz created_at
}
SUPPRESSED_EMAILS {
uuid id PK
text email
text reason
jsonb metadata
timestamptz created_at
}
EMAIL_UNSUBSCRIBE_TOKENS {
uuid id PK
text token
text email
timestamptz created_at
timestamptz used_at
}
AFFILIATES ||--o{ AFFILIATE_LEADS : "owns"
AFFILIATES ||--o{ COMMISSIONS : "generates"
AFFILIATE_LEADS ||--o{ COMMISSIONS : "triggers"
AFFILIATES ||--o{ PAYOUTS : "receives"
AFFILIATES ||--o{ SPEAKER_REQUESTS : "submits"
ORDERS ||--o{ ORDER_ITEMS : "contains"
USER_ROLES ||--|| AFFILIATES : "grants"
```

**Diagram sources**
- [types.ts:97-640](file://src/integrations/supabase/types.ts#L97-L640)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:5-11](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L5-L11)
- [20260325024643_email_infra.sql:27-271](file://supabase/migrations/20260325024643_email_infra.sql#L27-L271)

**Section sources**
- [types.ts:9-657](file://src/integrations/supabase/types.ts#L9-L657)

### Field Definitions and Validation Rules
- Enumerations define constrained statuses for affiliates, commissions, payouts, and speaker requests.
- **Updated**: Added app_role enumeration with 'admin' and 'user' values for role-based access control.
- **Updated**: Email infrastructure includes status validation for email_send_log with 'pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq' values.
- **Updated**: Suppressed emails table includes reason validation for 'unsubscribe', 'bounce', 'complaint'.
- Strong typing ensures compile-time safety for inserts and updates.
- Migrations add columns and default values to support evolving business needs.

**Section sources**
- [types.ts:647-652](file://src/integrations/supabase/types.ts#L647-L652)
- [20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql:1-8](file://supabase/migrations/20260319010259_635fecdc-5214-464e-93b5-b88f56743424.sql#L1-L8)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:2-3](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L2-L3)
- [20260325024643_email_infra.sql:32-84](file://supabase/migrations/20260325024643_email_infra.sql#L32-L84)
- [20260325024643_email_infra.sql:212-216](file://supabase/migrations/20260325024643_email_infra.sql#L212-L216)

### Real-Time Features and Data Lifecycle
- Auth state changes trigger immediate UI updates and background affiliate profile loading.
- Webhooks continuously synchronize external opportunities into affiliate leads.
- RLS policies enforce per-affiliate data isolation for inserts and updates.
- **Updated**: Role-based access control enforces administrative permissions across all tables.
- **Updated**: Email processing system provides asynchronous transactional email delivery with queue management.
- **Updated**: Suppression handling automatically manages email suppression lists and unsubscribe tokens.
- **Updated**: Shopify order webhook processes purchases, detects bundles, generates download links, and triggers email delivery.

**Section sources**
- [useAuth.tsx:68-106](file://src/hooks/useAuth.tsx#L68-L106)
- [index.ts:74-105](file://supabase/functions/ghl-affiliate-webhook/index.ts#L74-L105)
- [20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql:1-5](file://supabase/migrations/20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql#L1-L5)
- [20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql:1-5](file://supabase/migrations/20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql#L1-L5)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:37-51](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L37-L51)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:74-105](file://supabase/functions/shopify-order-webhook/index.ts#L74-L105)

## Administrative Framework

### Role-Based Access Control System
**New**: The system now implements a comprehensive role-based access control framework using the user_roles table and has_role function.

#### User Roles Table
The user_roles table serves as the central authority for role assignments:
- Stores unique combinations of user_id and role
- Enforces referential integrity with auth.users table
- Supports CASCADE deletion for cleanup
- Enabled Row Level Security for fine-grained access control

#### Has Role Function
The has_role function provides efficient role checking:
- Security definer function for elevated privileges
- Stable function signature for consistent caching
- Uses EXISTS clause for optimal performance
- Supports dynamic role checking with app_role enum

#### App Role Enumeration
The app_role enum defines available roles:
- 'admin': Full administrative access across all tables
- 'user': Standard user access with affiliate-specific restrictions

```mermaid
sequenceDiagram
participant User as "Authenticated User"
participant Client as "Supabase Client"
participant DB as "PostgreSQL Database"
User->>Client : has_role(auth.uid(), 'admin')
Client->>DB : SELECT user_roles WHERE user_id AND role
DB-->>Client : EXISTS check result
Client-->>User : Boolean permission result
```

**Diagram sources**
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:15-29](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L15-L29)
- [types.ts:662-671](file://src/integrations/supabase/types.ts#L662-L671)

**Section sources**
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:2-29](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L2-L29)
- [types.ts:640-657](file://src/integrations/supabase/types.ts#L640-L657)

### Admin Guard Components
**New**: Role-based navigation and access control through admin guard components.

#### AdminGuard Component
Provides comprehensive role-based access control:
- Checks both authentication and administrative permissions
- Handles loading states with spinner animations
- Redirects unauthorized users to portal login
- Integrates with useAuth and useAdminRole hooks

#### AdminLayout Component
Manages administrative interface layout:
- Wraps protected routes with admin guard
- Provides responsive sidebar navigation
- Includes top navigation bar with menu controls
- Supports lazy loading with content loader

#### AdminSidebar Component
Delivers comprehensive administrative navigation:
- Dynamic menu items for all admin sections
- Active state highlighting for current route
- Responsive sidebar with collapsible icons
- Integration with Lucide React icons

**Section sources**
- [AdminGuard.tsx:1-35](file://src/components/admin/AdminGuard.tsx#L1-L35)
- [AdminLayout.tsx:1-40](file://src/components/admin/AdminLayout.tsx#L1-L40)
- [AdminSidebar.tsx:1-67](file://src/components/admin/AdminSidebar.tsx#L1-L67)

### Admin Dashboard and Management Pages
**New**: Comprehensive administrative interface with multiple management capabilities.

#### AdminDashboard
Provides overview statistics and recent activity:
- Total affiliates, pending approvals, leads, and commissions
- Revenue tracking and trend analysis
- Recent affiliate registrations and pending commissions
- Interactive cards with trend indicators

#### AdminLeads
Manages and tracks affiliate leads:
- Comprehensive lead listing with filtering
- Status-based filtering and search functionality
- Statistics cards for pipeline value and conversion rates
- Detailed lead information with affiliate associations

#### AdminCommissions
Handles commission management:
- Commission tracking with status filtering
- Bulk operations and status updates
- Affiliate and lead associations
- Payment processing capabilities

#### AdminAffiliates
Manages affiliate relationships:
- Affiliate listing with performance metrics
- Commission rate management
- Status updates and approval workflows
- Performance analytics and reporting

#### AdminPayouts and Reports
Provides financial oversight:
- Payout management and tracking
- Comprehensive reporting dashboards
- Performance analytics and trend analysis
- Export capabilities for financial records

**Section sources**
- [AdminDashboard.tsx:1-206](file://src/pages/admin/AdminDashboard.tsx#L1-L206)
- [AdminLeads.tsx:53-205](file://src/pages/admin/AdminLeads.tsx#L53-L205)
- [AdminCommissions.tsx:49-99](file://src/pages/admin/AdminCommissions.tsx#L49-L99)
- [AdminAffiliates.tsx:54-96](file://src/pages/admin/AdminAffiliates.tsx#L54-L96)
- [AdminReports.tsx:76-114](file://src/pages/admin/AdminReports.tsx#L76-L114)

## Email Infrastructure

### Transactional Email System
**New**: The system now includes a comprehensive transactional email infrastructure built on Supabase Edge Functions and PostgreSQL queues.

#### Email Queue System
The email infrastructure uses pgmq for reliable queue management:
- Two priority queues: `auth_emails` (high priority) and `transactional_emails` (normal priority)
- Dead letter queues (`auth_emails_dlq`, `transactional_emails_dlq`) for failed messages
- Queue RPC wrappers (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`) for Edge Function access
- Service role-only execution for security isolation

#### Email Processing Pipeline
The `process-email-queue` function orchestrates email delivery:
- Reads batches from queues with configurable size and visibility timeout
- Applies rate limiting with configurable retry-after cooldown
- Handles TTL expiration for stale messages
- Implements retry logic with maximum attempts (5)
- Supports both 429 rate limits and 403 forbidden responses
- Moves failed messages to dead letter queues with detailed error logging

#### Email Templates and Rendering
**New**: Built-in template system using React Email components:
- Centralized template registry (`_shared/transactional-email-templates/registry.ts`)
- Order download links template (`order-download-links.tsx`) for automated ebook delivery
- Subject line generation supporting both static strings and dynamic functions
- HTML and plain text rendering with React Email components

#### Suppression Management
**New**: Comprehensive suppression handling system:
- `suppressed_emails` table tracks unsubscribes, bounces, and complaints
- `email_unsubscribe_tokens` table manages unsubscribe tokens per email
- `email_send_log` table provides audit trail for all send attempts
- Automatic suppression checking before email delivery
- Real-time suppression event handling via webhook

#### Unsubscribe Management
**New**: Two-way unsubscribe handling:
- One-click unsubscribe via email clients (RFC 8058 compliance)
- Web-based unsubscribe page with token validation
- Atomic unsubscribe processing to prevent race conditions
- Automatic suppression list updates upon unsubscribe

```mermaid
sequenceDiagram
participant Client as "Supabase Client"
participant SendFunc as "send-transactional-email"
participant Queue as "pgmq Queue"
participant ProcFunc as "process-email-queue"
participant Lovable as "Lovable Email API"
participant SuppFunc as "handle-email-suppression"
participant UnsubFunc as "handle-email-unsubscribe"
participant DB as "PostgreSQL Database"
Client->>SendFunc : Request to send email
SendFunc->>DB : Check suppressed_emails
DB-->>SendFunc : Suppression status
alt Email suppressed
SendFunc->>DB : Insert email_send_log (suppressed)
else Email allowed
SendFunc->>DB : Get/create unsubscribe token
SendFunc->>DB : Insert email_send_log (pending)
SendFunc->>Queue : enqueue_email(transactional_emails)
end
ProcFunc->>Queue : read_email_batch
Queue-->>ProcFunc : Email payload
ProcFunc->>Lovable : sendLovableEmail
alt Success
ProcFunc->>DB : Insert email_send_log (sent)
ProcFunc->>Queue : delete_email
else Rate limited (429)
ProcFunc->>DB : Insert email_send_log (rate_limited)
ProcFunc->>DB : Update email_send_state (retry_after_until)
else Forbidden (403)
ProcFunc->>Queue : move_to_dlq
else Other failure
ProcFunc->>DB : Insert email_send_log (failed)
end
SuppFunc->>DB : Upsert suppressed_emails
SuppFunc->>DB : Insert email_send_log (bounced/complained/suppressed)
UnsubFunc->>DB : Mark token as used
UnsubFunc->>DB : Upsert suppressed_emails
```

**Diagram sources**
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)
- [20260325024643_email_infra.sql:131-205](file://supabase/migrations/20260325024643_email_infra.sql#L131-L205)

### Shopify Order Webhook Integration
**New**: Enhanced Shopify order webhook with comprehensive bundle handling and automated email delivery.

#### Bundle Purchase Detection
The webhook includes a comprehensive bundle mapping system:
- Business Credit Quickstart Kit Bundle
- Ultimate Business Funding Credit Bundle
- Credit Business Accelerator Pack
- Credit Authority Bundle
- Ultimate Credit Business Vault

#### Automated Download Email Delivery
**New**: Seamless integration between order processing and email delivery:
- Automatic detection of bundle purchases
- Generation of individual ebook download links for each included item
- Direct invocation of transactional email system for download links
- Idempotent email delivery with order-specific idempotency keys
- Integration with GHL CRM for customer tracking

#### Order and Item Processing
The webhook processes orders with comprehensive error handling:
- UPSERT operation for order creation/update
- Individual order item processing with download token generation
- Bundle expansion into constituent ebooks
- Download link generation with token-based URLs
- GHL contact update with order information and download links

```mermaid
sequenceDiagram
participant Shopify as "Shopify Commerce"
participant Webhook as "shopify-order-webhook"
participant DB as "PostgreSQL Database"
participant EmailFunc as "send-transactional-email"
participant EmailQueue as "pgmq Queue"
participant EmailProc as "process-email-queue"
Shopify->>Webhook : Order webhook
Webhook->>DB : UPSERT orders
DB-->>Webhook : Order ID
loop For each line item
Webhook->>DB : INSERT order_items (with download_token)
DB-->>Webhook : Item with download_token
alt Bundle purchase
Webhook->>Webhook : Expand bundle to individual ebooks
end
Webhook->>EmailFunc : POST send-transactional-email
EmailFunc->>DB : Check suppressed_emails
EmailFunc->>DB : Get/create unsubscribe token
EmailFunc->>DB : Insert email_send_log (pending)
EmailFunc->>EmailQueue : enqueue_email(transactional_emails)
EmailProc->>EmailQueue : read_email_batch
EmailProc->>DB : Insert email_send_log (sent)
EmailProc->>EmailQueue : delete_email
end
Webhook->>DB : Update GHL contact (if configured)
Webhook-->>Shopify : Success response
```

**Diagram sources**
- [index.ts:74-251](file://supabase/functions/shopify-order-webhook/index.ts#L74-L251)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)

**Section sources**
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)
- [index.ts:74-251](file://supabase/functions/shopify-order-webhook/index.ts#L74-L251)
- [order-download-links.tsx:1-174](file://supabase/functions/_shared/transactional-email-templates/order-download-links.tsx#L1-L174)
- [registry.ts:1-17](file://supabase/functions/_shared/transactional-email-templates/registry.ts#L1-L17)
- [20260325024643_email_infra.sql:1-293](file://supabase/migrations/20260325024643_email_infra.sql#L1-L293)

## External API Integration

### GHL Calendar API Integration
The application integrates with GHL (LeadConnectorHQ) services for comprehensive calendar management and appointment booking. The integration handles two distinct calendar types: consultation bookings and partner onboarding appointments.

#### Enhanced GHL Calendar Edge Function
**Updated**: The GHL calendar Edge Function has been significantly enhanced with improved environment variable validation, optional user ID support, sophisticated data transformation capabilities, and comprehensive operational logging for better monitoring and debugging.

##### Environment Variable Validation and Configuration
The function now implements robust environment variable validation with detailed logging:
- Validates presence of GHL_API_KEY, GHL_LOCATION_ID, and GHL_CALENDAR_ID/GHL_PARTNER_CALENDAR_ID
- Supports dual calendar configurations through calendarType parameter
- Implements comprehensive error logging with context information
- Provides detailed diagnostic information for troubleshooting

##### Optional User ID Support
**New**: The function now supports optional user ID for round-robin and collective calendar types:
- Automatically detects calendar type (consultation vs partner)
- Sets appropriate calendar ID based on calendarType
- Conditionally includes user ID in GHL API requests when configured
- Enables advanced calendar routing and assignment scenarios

##### Sophisticated Data Transformation Capabilities
**Enhanced**: The function implements comprehensive data transformation for contact management and appointment booking:
- Advanced contact creation/upsert with duplicate detection
- Intelligent name parsing and normalization
- Tag-based lead attribution for funnel tracking
- Source attribution for reporting and analytics
- Phone number normalization and validation

##### Comprehensive Operational Logging
**New**: Enhanced logging provides detailed operational insights:
- Request/response logging with sanitized data
- Diagnostic warnings for common configuration issues
- Performance metrics and trace information
- Error categorization and recovery guidance
- Real-time monitoring and debugging capabilities

```mermaid
sequenceDiagram
participant UI as "ConsultationCalendar.tsx"
participant Supabase as "Supabase Functions"
participant GHL as "GHL Services"
UI->>Supabase : Direct fetch to /functions/v1/ghl-calendar
Note over UI : Using custom invokeEdgeFunction
Supabase->>Supabase : Convert milliseconds to seconds
Supabase->>GHL : GET free-slots with timestamp conversion
GHL-->>Supabase : Available slots data
Supabase-->>UI : Calendar availability
UI->>Supabase : Direct fetch to book appointment
Supabase->>GHL : POST appointment with contact
GHL-->>Supabase : Appointment confirmation
Supabase-->>UI : Booking success
```

**Diagram sources**
- [ConsultationCalendar.tsx:12-38](file://src/components/funnel/ConsultationCalendar.tsx#L12-L38)
- [ConsultationCalendar.tsx:82-96](file://src/components/funnel/ConsultationCalendar.tsx#L82-L96)
- [ConsultationCalendar.tsx:141-150](file://src/components/funnel/ConsultationCalendar.tsx#L141-L150)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)

#### Calendar Management Workflow
The GHL calendar integration consists of two primary actions:
- **Free Slots Retrieval**: Fetches available appointment slots within a specified date range
- **Appointment Booking**: Creates appointments with contact management and timezone handling

#### Timestamp Conversion and Timezone Handling
**Updated**: The integration now properly converts JavaScript timestamps from milliseconds to seconds for GHL API compatibility. This critical fix addresses external API compatibility issues where GHL expects timestamps in seconds rather than milliseconds.

The implementation includes comprehensive timezone handling:
- **Automatic timezone detection**: Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` for accurate timezone detection
- **Proper timestamp formatting**: Converts JavaScript Date objects to ISO strings for API compatibility
- **Timezone parameter passing**: Passes timezone information to GHL API for accurate slot calculation

```mermaid
sequenceDiagram
participant UI as "Calendar Component"
participant Supabase as "Supabase Functions"
participant GHL as "GHL Services"
UI->>Supabase : Invoke ghl-calendar get-slots
Supabase->>Supabase : Convert milliseconds to seconds
Supabase->>GHL : GET free-slots with timestamp conversion
GHL-->>Supabase : Available slots data
Supabase-->>UI : Calendar availability
UI->>Supabase : Invoke ghl-calendar book
Supabase->>GHL : POST appointment with contact
GHL-->>Supabase : Appointment confirmation
Supabase-->>UI : Booking success
```

**Diagram sources**
- [ConsultationCalendar.tsx:76-96](file://src/components/funnel/ConsultationCalendar.tsx#L76-L96)
- [PartnerOnboardingCalendar.tsx:40-63](file://src/components/funnel/PartnerOnboardingCalendar.tsx#L40-L63)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)

#### Calendar Types and Configuration
**Enhanced**: The system now supports dual calendar configurations with sophisticated routing:
- **Consultation Calendar**: Standard client consultation appointments
- **Partner Calendar**: Partner onboarding and partnership meetings
- **Dynamic Calendar Selection**: Automatic calendar ID selection based on calendarType
- **Environment Variable Management**: Separate configuration for each calendar type

Each calendar type uses separate environment variables for configuration and maintains distinct availability patterns.

#### Contact Management Integration
**Enhanced**: The calendar function seamlessly integrates with GHL's contact management system:
- Automatic contact creation/upsert for new users
- Duplicate contact detection and handling with intelligent recovery
- Tagging and source attribution for lead tracking and analytics
- Phone number normalization and validation
- Advanced name parsing and organization

**Section sources**
- [ConsultationCalendar.tsx:12-38](file://src/components/funnel/ConsultationCalendar.tsx#L12-L38)
- [ConsultationCalendar.tsx:82-96](file://src/components/funnel/ConsultationCalendar.tsx#L82-L96)
- [ConsultationCalendar.tsx:141-150](file://src/components/funnel/ConsultationCalendar.tsx#L141-L150)
- [PartnerOnboardingCalendar.tsx:40-63](file://src/components/funnel/PartnerOnboardingCalendar.tsx#L40-L63)
- [index.ts:16-240](file://supabase/functions/ghl-calendar/index.ts#L16-L240)

### Shopify Commerce Integration
**New**: Comprehensive Shopify order processing with automated email delivery:
- HMAC verification for secure webhook reception
- Bundle detection and expansion for multi-item purchases
- Automated download email generation and delivery
- GHL CRM integration for customer tracking
- Idempotent order processing with conflict resolution

**Section sources**
- [index.ts:74-251](file://supabase/functions/shopify-order-webhook/index.ts#L74-L251)

## Network Optimization & Performance

### Supabase Preconnect Optimization
The application implements proactive network optimization through HTML preconnect hints to reduce database connection latency and improve real-time feature responsiveness. The optimization specifically targets the Supabase domain (`gkowxzoadsljkpdzrlue.supabase.co`) to establish early connections for database operations.

**Implementation Details:**
- Added `<link rel="preconnect" href="https://gkowxzoadsljkpdzrlue.supabase.co" />` in the HTML head section
- This allows the browser to establish DNS resolution and TCP handshake in advance
- Reduces connection establishment time for subsequent Supabase API calls
- Improves real-time feature responsiveness and overall application performance

**Benefits:**
- Reduced first-byte latency for database operations
- Faster authentication and data fetching responses
- Improved real-time feature performance (subscriptions, live updates)
- Better user experience during peak traffic periods

### Direct Fetch Implementation Performance
**Updated**: The new direct fetch implementation provides several performance benefits:
- **Reduced overhead**: Eliminates Supabase SDK wrapper overhead
- **Better error handling**: Enables more efficient error recovery and retry logic
- **Improved debugging**: Direct HTTP requests allow for better performance monitoring
- **Consistent behavior**: Eliminates SDK-specific quirks and inconsistencies
- **Enhanced reliability**: Eliminates SDK AbortError exceptions that plagued previous implementations

### External API Performance Optimization
**Updated**: The GHL calendar integration includes several performance optimizations:
- **Timestamp Conversion Caching**: Results are cached locally to avoid repeated conversions
- **Batch Request Handling**: Multiple calendar operations are batched when possible
- **Connection Pooling**: Reuses connections for multiple GHL API calls
- **Timeout Management**: Implements appropriate timeout values for external API calls
- **Direct HTTP Requests**: Eliminates SDK overhead for better performance
- **Enhanced Error Recovery**: Comprehensive error handling with detailed logging
- **Input Validation**: Robust input sanitization and validation prevents API errors

### Email Infrastructure Performance Considerations
**New**: Email system performance optimizations:
- **Queue Priority Processing**: Auth emails processed before transactional emails
- **Batch Size Configuration**: Configurable batch sizes for optimal throughput
- **Rate Limiting**: Automatic retry-after cooldown for external API rate limits
- **Dead Letter Queues**: Failed messages isolated to prevent blocking successful deliveries
- **Idempotent Operations**: Duplicate suppression and atomic token updates
- **Index Optimization**: Strategic indexing on email_send_log and suppression tables

**Section sources**
- [index.html:17](file://index.html#L17)
- [ConsultationCalendar.tsx:12-38](file://src/components/funnel/ConsultationCalendar.tsx#L12-L38)
- [index.ts:37-45](file://supabase/functions/ghl-calendar/index.ts#L37-L45)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)

### Network Optimization Best Practices
- Implement preconnect for critical third-party domains (Supabase, external APIs)
- Use DNS prefetch for frequently accessed domains
- Leverage HTTP/2 server push for static assets
- Implement connection pooling and keep-alive settings
- Monitor network performance metrics and adjust optimization strategies
- **Updated**: Cache external API responses when appropriate to reduce latency
- **Updated**: Use direct HTTP requests for better performance and error control
- **Updated**: Implement comprehensive logging for network debugging and monitoring
- **Updated**: Optimize role-based access control queries with proper indexing
- **Updated**: Cache email queue RPC wrapper results to reduce function call overhead
- **Updated**: Implement email processing batching for improved throughput

**Section sources**
- [index.html:15-18](file://index.html#L15-L18)

## Dependency Analysis
The frontend depends on Supabase for identity and data, React Query for caching, and TypeScript for type safety. Supabase functions depend on the Supabase runtime and service role credentials. External API integrations depend on GHL services and proper environment configuration. Network optimization through preconnect hints provides transparent performance benefits across all Supabase operations.

**Updated**: Enhanced dependency graph includes role-based access control components, administrative framework, and comprehensive email infrastructure.

```mermaid
graph LR
Package["package.json deps"]
Client["client.ts"]
Types["types.ts"]
Auth["useAuth.tsx"]
AdminGuard["AdminGuard.tsx"]
AdminLayout["AdminLayout.tsx"]
AdminSidebar["AdminSidebar.tsx"]
Leads["useAffiliateLeads.ts"]
Func["ghl-affiliate-webhook/index.ts"]
CalFunc["ghl-calendar/index.ts"]
ShopifyWebhook["shopify-order-webhook/index.ts"]
EmailProc["process-email-queue/index.ts"]
EmailSend["send-transactional-email/index.ts"]
SuppressHandler["handle-email-suppression/index.ts"]
UnsubscribeHandler["handle-email-unsubscribe/index.ts"]
ConsultCal["ConsultationCalendar.tsx"]
PartnerCal["PartnerOnboardingCalendar.tsx"]
HTML["index.html"]
GHL["GHL Services"]
Shopify["Shopify Commerce"]
Lovable["Lovable Email API"]
AdminPages["Admin Pages<br/>AdminDashboard.tsx, AdminLeads.tsx, etc."]
AdminMig["Admin Policies<br/>20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql"]
EmailMig["Email Infrastructure<br/>20260325024643_email_infra.sql"]
Package --> Client
Package --> Auth
Package --> AdminGuard
Package --> AdminLayout
Package --> AdminSidebar
Package --> Leads
Package --> ConsultCal
Package --> PartnerCal
HTML --> Client
Client --> Types
Auth --> Client
AdminGuard --> Client
AdminLayout --> Client
AdminSidebar --> Client
Leads --> Client
Func --> Client
CalFunc --> Client
ShopifyWebhook --> Client
EmailProc --> Client
EmailSend --> Client
SuppressHandler --> Client
UnsubscribeHandler --> Client
ConsultCal --> Client
PartnerCal --> Client
Client --> AdminPages
Client --> AdminMig
Client --> EmailMig
Client --> GHL
Client --> Shopify
Client --> Lovable
```

**Diagram sources**
- [package.json:15-69](file://package.json#L15-L69)
- [client.ts:1-17](file://src/integrations/supabase/client.ts#L1-L17)
- [types.ts:1-14](file://src/integrations/supabase/types.ts#L1-L14)
- [useAuth.tsx:1-4](file://src/hooks/useAuth.tsx#L1-L4)
- [AdminGuard.tsx:1-4](file://src/components/admin/AdminGuard.tsx#L1-L4)
- [AdminLayout.tsx:1-4](file://src/components/admin/AdminLayout.tsx#L1-L4)
- [AdminSidebar.tsx:1-4](file://src/components/admin/AdminSidebar.tsx#L1-L4)
- [useAffiliateLeads.ts:1-4](file://src/hooks/useAffiliateLeads.ts#L1-L4)
- [ConsultationCalendar.tsx:1-14](file://src/components/funnel/ConsultationCalendar.tsx#L1-L14)
- [PartnerOnboardingCalendar.tsx:1-14](file://src/components/funnel/PartnerOnboardingCalendar.tsx#L1-L14)
- [index.ts:42-44](file://supabase/functions/ghl-affiliate-webhook/index.ts#L42-L44)
- [index.ts:21-51](file://supabase/functions/ghl-calendar/index.ts#L21-L51)
- [index.ts:74-105](file://supabase/functions/shopify-order-webhook/index.ts#L74-L105)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)
- [index.html:17](file://index.html#L17)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:1-82](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L1-L82)
- [20260325024643_email_infra.sql:1-293](file://supabase/migrations/20260325024643_email_infra.sql#L1-L293)

**Section sources**
- [package.json:15-69](file://package.json#L15-L69)

## Performance Considerations
- Prefer selective queries with equality filters on indexed columns (e.g., affiliate_id) to minimize scan costs.
- Use ordering by updated_at to surface recent records efficiently.
- Leverage React Query caching to avoid redundant network calls and reduce latency.
- Keep payloads minimal by selecting only required columns where possible.
- Use migrations to add appropriate indexes for frequently queried columns.
- Batch external webhook updates to reduce write amplification.
- **Updated**: Implement preconnect optimization for Supabase domain to reduce connection establishment latency.
- **Updated**: Monitor network performance metrics to validate preconnect effectiveness.
- **Updated**: Consider connection pooling and keep-alive settings for optimal database performance.
- **Updated**: Implement timestamp conversion caching for external API integrations to reduce computational overhead.
- **Updated**: Optimize external API call frequency and implement appropriate retry mechanisms.
- **Updated**: Use direct HTTP requests instead of SDK-based calls for better performance and error control.
- **Updated**: Implement comprehensive logging for performance monitoring and debugging.
- **Updated**: Validate environment variables thoroughly to prevent runtime configuration errors.
- **Updated**: Optimize role-based access control queries with proper indexing on user_id and role columns.
- **Updated**: Implement caching strategies for role check results to reduce database load.
- **Updated**: Configure email queue batch sizes based on throughput requirements and rate limit constraints.
- **Updated**: Monitor email queue depths and adjust processing intervals for optimal performance.
- **Updated**: Implement email suppression list caching to reduce database lookups during send operations.
- **Updated**: Use connection pooling for external email API calls to improve throughput.

## Troubleshooting Guide
Common issues and strategies:
- Authentication session not persisting: Verify localStorage availability and environment variable configuration for the Supabase URL and publishable key.
- Affiliate profile not loading: Confirm the user_id-to-affiliate mapping and check for timeouts during background fetch.
- Webhook not updating leads: Inspect the external payload fields and ensure the function has service role access to write to affiliate_leads.
- RLS policy errors: Validate that the authenticated user's affiliate_id matches the record being inserted/updated.
- **Updated**: Role-based access control failures: Check user_roles table entries and has_role function execution.
- **Updated**: Admin guard not redirecting properly: Verify AdminGuard component integration and useAdminRole hook implementation.
- **Updated**: Preconnect optimization not taking effect: Verify the preconnect link is present in the HTML head and check browser developer tools for connection establishment timing improvements.
- **Updated**: GHL calendar integration failures: Check environment variables (GHL_API_KEY, GHL_LOCATION_ID, GHL_CALENDAR_ID, GHL_PARTNER_CALENDAR_ID, GHL_USER_ID) and verify timestamp conversion logic.
- **Updated**: External API timeout errors: Implement proper error handling and consider implementing exponential backoff for retry mechanisms.
- **Updated**: Calendar booking conflicts: Verify timezone handling and ensure proper timestamp formatting for GHL API compatibility.
- **Updated**: Direct fetch implementation issues: Check that the SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables are correctly configured and accessible to the frontend.
- **Updated**: SDK AbortError exceptions: The new direct fetch implementation eliminates these issues by bypassing the Supabase SDK's internal error handling.
- **Updated**: Environment variable validation failures: Check the enhanced logging output for detailed error context and configuration verification.
- **Updated**: Calendar type routing issues: Verify calendarType parameter and corresponding environment variable configuration.
- **Updated**: Contact management errors: Review duplicate contact handling and GHL API response processing.
- **Updated**: Admin dashboard not loading: Verify role-based access control and ensure admin users have proper user_roles entries.
- **Updated**: Email queue processing failures: Check email_send_state configuration and queue RPC wrapper permissions.
- **Updated**: Email delivery rate limiting: Monitor retry_after_until field and adjust batch sizes accordingly.
- **Updated**: Suppression handling issues: Verify suppression event webhook configuration and email_send_log updates.
- **Updated**: Unsubscribe token processing failures: Check atomic update logic and token uniqueness constraints.
- **Updated**: Shopify order webhook errors: Verify HMAC signatures, bundle mappings, and email delivery status.
- **Updated**: Template rendering failures: Check React Email component compilation and template registry configuration.

**Section sources**
- [client.ts:5-17](file://src/integrations/supabase/client.ts#L5-L17)
- [useAuth.tsx:40-63](file://src/hooks/useAuth.tsx#L40-L63)
- [AdminGuard.tsx:10-35](file://src/components/admin/AdminGuard.tsx#L10-L35)
- [index.ts:74-105](file://supabase/functions/ghl-affiliate-webhook/index.ts#L74-L105)
- [index.ts:37-45](file://supabase/functions/ghl-calendar/index.ts#L37-L45)
- [20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql:1-5](file://supabase/migrations/20260319185554_6f53c4fa-7f98-496d-afe9-1bf39f92ae3a.sql#L1-L5)
- [20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql:1-5](file://supabase/migrations/20260319194628_4e5f50a6-8cb3-40d1-b56d-a5bacde2a132.sql#L1-L5)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:31-82](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L31-L82)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)
- [index.ts:74-251](file://supabase/functions/shopify-order-webhook/index.ts#L74-L251)

## Conclusion
The data layer leverages a strongly typed Supabase client, robust authentication, and RLS policies to provide secure, scalable data access. React Query enables efficient caching and reactivity, while Supabase functions facilitate reliable synchronization from external systems. **Updated**: The GHL calendar integration provides comprehensive appointment management with proper timestamp conversion for external API compatibility and enhanced environment variable validation. **Updated**: The new direct fetch implementation eliminates SDK-related issues and provides better performance and error control. **Updated**: Network optimization through preconnect hints significantly reduces database connection latency and improves real-time feature responsiveness. **Updated**: External API integration patterns ensure reliable communication with third-party services while maintaining performance and error resilience. **Updated**: Enhanced logging and monitoring capabilities provide comprehensive operational visibility and debugging support. **Updated**: The comprehensive administrative framework with role-based access control provides granular permissions and secure management capabilities. **Updated**: The new admin guard components and dashboard provide intuitive management interfaces with proper access control enforcement. **Updated**: The comprehensive email infrastructure provides reliable transactional email delivery with queue management, suppression handling, and automated bundle purchase processing. **Updated**: The Shopify order webhook integration delivers seamless automated download email delivery for bundle purchases. Adhering to the outlined patterns and safeguards ensures predictable performance, maintainability, and security.

## Appendices

### Sample Data Structures
Representative row shapes for key tables (descriptive only):
- Affiliate: identifier, personal/company contact info, status, timestamps
- Affiliate Lead: association to affiliate, contact details, opportunity metadata, pipeline and status fields, timestamps
- Commission: affiliate and optional lead linkage, amounts, status, timestamps, payout date
- Payout: affiliate linkage, amount, period, method, status, timestamps
- Speaker Request: affiliate linkage, event details, status, timestamps
- **Updated**: User Role: unique combination of user_id and role for access control
- **Updated**: Email Send Log: audit trail for email delivery attempts with status tracking
- **Updated**: Suppressed Emails: records of email suppression for unsubscribes, bounces, and complaints
- **Updated**: Email Unsubscribe Tokens: token-based unsubscribe management with usage tracking

**Section sources**
- [types.ts:97-640](file://src/integrations/supabase/types.ts#L97-L640)
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:5-11](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L5-L11)
- [20260325024643_email_infra.sql:27-271](file://supabase/migrations/20260325024643_email_infra.sql#L27-L271)

### GHL Calendar API Endpoints
**Updated**: The GHL calendar integration exposes the following endpoints:
- `GET /calendars/{calendarId}/free-slots`: Retrieves available appointment slots
- `POST /calendars/events/appointments`: Creates new appointments
- `POST /contacts`: Manages contact records for users

**Section sources**
- [index.ts:69-81](file://supabase/functions/ghl-calendar/index.ts#L69-L81)
- [index.ts:215-231](file://supabase/functions/ghl-calendar/index.ts#L215-L231)

### Direct Fetch Implementation Details
**Updated**: The ConsultationCalendar component uses a custom `invokeEdgeFunction` that:
- Constructs URLs using `SUPABASE_URL` and `/functions/v1/ghl-calendar`
- Sends requests with proper authorization headers including `Authorization: Bearer ${SUPABASE_PUBLISHABLE_KEY}`
- Handles error responses with proper error messages
- Logs detailed debug information for troubleshooting
- Eliminates SDK overhead and potential AbortError exceptions
- Provides comprehensive error handling and user feedback

**Section sources**
- [ConsultationCalendar.tsx:12-38](file://src/components/funnel/ConsultationCalendar.tsx#L12-L38)
- [ConsultationCalendar.tsx:82-96](file://src/components/funnel/ConsultationCalendar.tsx#L82-L96)
- [ConsultationCalendar.tsx:141-150](file://src/components/funnel/ConsultationCalendar.tsx#L141-L150)

### Enhanced Environment Variable Configuration
**New**: The GHL calendar function supports the following environment variables:
- `GHL_API_KEY`: API key for GHL authentication
- `GHL_LOCATION_ID`: Location identifier for GHL operations
- `GHL_CALENDAR_ID`: Default calendar identifier for consultation bookings
- `GHL_PARTNER_CALENDAR_ID`: Calendar identifier for partner onboarding
- `GHL_USER_ID`: Optional user identifier for round-robin assignments
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key

**Section sources**
- [index.ts:21-51](file://supabase/functions/ghl-calendar/index.ts#L21-L51)
- [index.ts:32-35](file://supabase/functions/ghl-calendar/index.ts#L32-L35)
- [index.ts:78-81](file://supabase/functions/ghl-calendar/index.ts#L78-L81)

### Role-Based Access Control Configuration
**New**: The role-based access control system requires the following setup:
- User roles table with unique constraints on (user_id, role)
- has_role function for efficient role checking
- RLS policies on all tables using has_role(auth.uid(), 'admin')
- Admin guard components for route protection
- Admin dashboard pages with role-aware data access

**Section sources**
- [20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql:2-82](file://supabase/migrations/20260324201245_4681ef67-2bf0-4686-a4b6-1ae6c54189f9.sql#L2-L82)
- [AdminGuard.tsx:1-35](file://src/components/admin/AdminGuard.tsx#L1-L35)
- [AdminLayout.tsx:1-40](file://src/components/admin/AdminLayout.tsx#L1-L40)
- [AdminSidebar.tsx:1-67](file://src/components/admin/AdminSidebar.tsx#L1-L67)

### Email Infrastructure Configuration
**New**: The email infrastructure requires the following setup:
- PostgreSQL extensions: pg_net, pg_cron, supabase_vault, pgmq
- Queue creation: auth_emails, transactional_emails with dead letter queues
- Email send state configuration with rate limiting parameters
- RPC wrapper functions with service role permissions
- Suppression handling webhook configuration
- Unsubscribe token management and validation
- Template registry and React Email component setup

**Section sources**
- [20260325024643_email_infra.sql:1-293](file://supabase/migrations/20260325024643_email_infra.sql#L1-L293)
- [index.ts:1-361](file://supabase/functions/process-email-queue/index.ts#L1-L361)
- [index.ts:1-360](file://supabase/functions/send-transactional-email/index.ts#L1-L360)
- [index.ts:1-163](file://supabase/functions/handle-email-suppression/index.ts#L1-L163)
- [index.ts:1-131](file://supabase/functions/handle-email-unsubscribe/index.ts#L1-L131)

### Shopify Order Webhook Configuration
**New**: The Shopify order webhook requires the following environment variables:
- `SHOPIFY_WEBHOOK_SECRET`: HMAC verification secret
- `SHOPIFY_ACCESS_TOKEN`: Shopify Admin API access token
- Optional: `GHL_API_KEY` and `GHL_LOCATION_ID` for CRM integration
- Site URL configuration for download link generation

**Section sources**
- [index.ts:95-98](file://supabase/functions/shopify-order-webhook/index.ts#L95-L98)
- [index.ts:263-278](file://supabase/functions/shopify-order-webhook/index.ts#L263-L278)

### Email Template System
**New**: The transactional email template system includes:
- Centralized template registry with component registration
- Order download links template with React Email components
- Subject line generation supporting static strings and dynamic functions
- Preview data configuration for template testing
- HTML and plain text rendering with consistent styling

**Section sources**
- [registry.ts:1-17](file://supabase/functions/_shared/transactional-email-templates/registry.ts#L1-L17)
- [order-download-links.tsx:1-174](file://supabase/functions/_shared/transactional-email-templates/order-download-links.tsx#L1-L174)
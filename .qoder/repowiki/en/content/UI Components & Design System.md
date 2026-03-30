# UI Components & Design System

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [components.json](file://components.json)
- [tailwind.config.ts](file://tailwind.config.ts)
- [src/index.css](file://src/index.css)
- [src/App.css](file://src/App.css)
- [vite.config.ts](file://vite.config.ts)
- [postcss.config.js](file://postcss.config.js)
- [eslint.config.js](file://eslint.config.js)
- [vitest.config.ts](file://vitest.config.ts)
- [src/components/portal/LeadsTable.tsx](file://src/components/portal/LeadsTable.tsx)
- [src/pages/portal/PortalLeads.tsx](file://src/pages/portal/PortalLeads.tsx)
- [src/hooks/useAffiliateLeads.ts](file://src/hooks/useAffiliateLeads.ts)
- [src/types/leads.ts](file://src/types/leads.ts)
- [src/components/funnel/ConsultationCalendar.tsx](file://src/components/funnel/ConsultationCalendar.tsx)
- [src/components/funnel/PartnerOnboardingCalendar.tsx](file://src/components/funnel/PartnerOnboardingCalendar.tsx)
- [src/components/ui/calendar.tsx](file://src/components/ui/calendar.tsx)
- [src/integrations/supabase/client.ts](file://src/integrations/supabase/client.ts)
- [supabase/functions/ghl-calendar/index.ts](file://supabase/functions/ghl-calendar/index.ts)
- [src/pages/funnel/FunnelConsultation.tsx](file://src/pages/funnel/FunnelConsultation.tsx)
- [src/components/NotificationBell.tsx](file://src/components/NotificationBell.tsx)
- [src/components/admin/AdminLayout.tsx](file://src/components/admin/AdminLayout.tsx)
- [src/components/portal/PortalLayout.tsx](file://src/components/portal/PortalLayout.tsx)
- [src/components/admin/affiliate-detail/AffiliateProfileTab.tsx](file://src/components/admin/affiliate-detail/AffiliateProfileTab.tsx)
- [src/components/admin/affiliate-detail/AffiliateSettingsTab.tsx](file://src/components/admin/affiliate-detail/AffiliateSettingsTab.tsx)
- [src/pages/admin/AdminAffiliateDetail.tsx](file://src/pages/admin/AdminAffiliateDetail.tsx)
- [supabase/migrations/20260328_notifications.sql](file://supabase/migrations/20260328_notifications.sql)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new NotificationBell component with real-time notifications
- Enhanced affiliate profile management documentation with detailed editing capabilities and validation
- Updated notification system documentation covering Supabase integration and real-time updates
- Added affiliate settings management with commission rate editing and status control
- Expanded component integration patterns showing NotificationBell usage in Admin and Portal layouts

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Notification System](#notification-system)
7. [Affiliate Management Components](#affiliate-management-components)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document describes the UI components and design system used in the Ryland application. The project is a Vite + React + TypeScript application that integrates shadcn/ui component library with Radix UI primitives and Tailwind CSS. It leverages design tokens, a color system, typography scale, and spacing conventions configured via Tailwind to provide accessible, customizable building blocks. The document explains how components are structured, how theming and composition work, and how to use and extend the design system effectively.

## Project Structure
The repository includes configuration files for Tailwind CSS, PostCSS, ESLint, Vite, and Vitest, along with the shadcn/ui configuration. The application depends on numerous Radix UI primitives and shadcn/ui components, indicating a component-driven UI architecture.

```mermaid
graph TB
A["package.json<br/>dependencies and scripts"] --> B["Tailwind CSS<br/>tailwind.config.ts"]
A --> C["PostCSS<br/>postcss.config.js"]
A --> D["Vite<br/>vite.config.ts"]
A --> E["ESLint<br/>eslint.config.js"]
A --> F["Vitest<br/>vitest.config.ts"]
G["components.json<br/>shadcn/ui config"] --> B
B --> H["src/index.css<br/>global styles"]
B --> I["src/App.css<br/>app-level styles"]
```

**Diagram sources**
- [package.json:15-69](file://package.json#L15-L69)
- [tailwind.config.ts](file://tailwind.config.ts)
- [postcss.config.js](file://postcss.config.js)
- [vite.config.ts](file://vite.config.ts)
- [eslint.config.js](file://eslint.config.js)
- [vitest.config.ts](file://vitest.config.ts)
- [components.json:1-20](file://components.json#L1-L20)
- [src/index.css](file://src/index.css)
- [src/App.css](file://src/App.css)

**Section sources**
- [README.md:53-61](file://README.md#L53-L61)
- [package.json:15-69](file://package.json#L15-L69)
- [components.json:1-20](file://components.json#L1-L20)

## Core Components
The design system centers around:
- Radix UI primitives for accessible base components (e.g., dialogs, dropdowns, tooltips, tabs, sliders, switches, progress indicators).
- shadcn/ui components built on top of Radix UI and styled with Tailwind CSS, configured via components.json.
- Tailwind CSS for design tokens, color system, typography scale, and spacing conventions.

Key integration points:
- shadcn/ui configuration defines aliases and Tailwind settings, including CSS variables for base colors.
- Tailwind configuration controls the design system's foundational tokens and enables consistent theming.

**Section sources**
- [components.json:1-20](file://components.json#L1-L20)
- [package.json:17-43](file://package.json#L17-L43)
- [README.md:60](file://README.md#L60)

## Architecture Overview
The UI architecture composes Radix UI primitives into shadcn/ui components, which are themed and customized using Tailwind utilities. The design system is driven by:
- Tailwind CSS configuration for color palette, typography, and spacing.
- CSS variables for theme-aware tokens.
- Component aliases enabling consistent imports across the app.

```mermaid
graph TB
subgraph "Design System"
TW["Tailwind CSS<br/>tailwind.config.ts"]
CSSV["CSS Variables<br/>color tokens"]
TWT["Typography Scale"]
SP["Spacing Scale"]
end
subgraph "Components Layer"
RUI["Radix UI Primitives<br/>dialogs, dropdowns,<br/>tooltips, tabs, etc."]
SHAD["shadcn/ui Components<br/>styled variants"]
end
subgraph "App"
APP["React Components<br/>usage of SHAD + RUI"]
NOTIF["Notification System<br/>Real-time updates"]
AFF["Affiliate Management<br/>Profile editing"]
END["Supabase Backend<br/>Database + Auth"]
end
TW --> CSSV
TW --> TWT
TW --> SP
CSSV --> SHAD
TWT --> SHAD
SP --> SHAD
SHAD --> APP
RUI --> SHAD
APP --> NOTIF
APP --> AFF
NOTIF --> END
AFF --> END
```

**Diagram sources**
- [tailwind.config.ts](file://tailwind.config.ts)
- [components.json:6-12](file://components.json#L6-L12)
- [package.json:17-43](file://package.json#L17-L43)

## Detailed Component Analysis
This section outlines the component categories and their roles in the design system. While specific component APIs are not present in the repository snapshot, the integration pattern and customization approach are defined by the configuration and dependencies.

### Calendar Components and Integration
**Updated** The ConsultationCalendar component demonstrates advanced integration patterns with external calendar services through Supabase Edge Functions.

#### ConsultationCalendar Component
The ConsultationCalendar component provides a sophisticated booking interface with comprehensive logging and debugging capabilities:

- **Enhanced Logging System**: Implements detailed console logging with "[GHL Debug]" prefix for all API interactions
- **Direct Edge Function Integration**: Uses custom `invokeEdgeFunction` instead of Supabase SDK to avoid AbortError issues
- **Comprehensive Error Handling**: Structured try-catch blocks with detailed error messages and fallback mechanisms
- **Real-time Debugging**: Console logs for fetch requests, responses, and error conditions
- **Environment Variable Management**: Secure handling of Supabase credentials and API endpoints

Key features:
- **Multi-step Booking Process**: Three-step process (select date/time, enter details, confirmation)
- **Dynamic Slot Availability**: Real-time slot fetching with caching and retry mechanisms
- **Timezone Awareness**: Automatic timezone detection and handling
- **Session Storage Integration**: Persists lead information across component lifecycle
- **Animation Transitions**: Smooth transitions between booking steps using Framer Motion

#### Calendar UI Component
The Calendar component serves as the foundation for both consultation and partner onboarding calendars:

- **Shadcn/ui Integration**: Built on top of react-day-picker with Tailwind styling
- **Custom Styling**: Extensive customization of day selection, navigation, and appearance
- **Accessibility Compliance**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapts to different screen sizes and orientations

#### Edge Function Integration
The calendar system integrates with GHL (Get Human Life) calendar services through Supabase Edge Functions:

- **Dual Calendar Support**: Separate configurations for consultation and partner onboarding
- **Environment-based Routing**: Different calendar IDs based on calendar type
- **Comprehensive Logging**: Detailed request/response logging for debugging
- **Input Validation**: Strict validation of all incoming parameters
- **Error Propagation**: Proper error handling and user-friendly error messages

**Section sources**
- [src/components/funnel/ConsultationCalendar.tsx:13-38](file://src/components/funnel/ConsultationCalendar.tsx#L13-L38)
- [src/components/funnel/ConsultationCalendar.tsx:76-96](file://src/components/funnel/ConsultationCalendar.tsx#L76-L96)
- [src/components/funnel/ConsultationCalendar.tsx:131-169](file://src/components/funnel/ConsultationCalendar.tsx#L131-L169)
- [src/components/ui/calendar.tsx:10-51](file://src/components/ui/calendar.tsx#L10-L51)
- [supabase/functions/ghl-calendar/index.ts:16-145](file://supabase/functions/ghl-calendar/index.ts#L16-L145)

### Dialogs and Overlays
- Radix UI dialog and alert dialog provide accessible overlay patterns.
- shadcn/ui offers styled variants for consistent appearance and behavior.
- Composition: use Radix triggers and shadcn/ui dialog components together for accessible, themed modals.

Accessibility and customization:
- Ensure focus management and keyboard interactions align with Radix UI defaults.
- Customize sizes, paddings, and animations via Tailwind utilities and CSS variables.

**Section sources**
- [package.json:24-25](file://package.json#L24-L25)
- [package.json:18-19](file://package.json#L18-L19)

### Menus and Popovers
- Radix UI context menu, dropdown menu, hover card, and popover enable flexible overlay interactions.
- shadcn/ui provides styled variants for menus and popovers.

Composition patterns:
- Combine trigger elements with overlay components and apply consistent padding and typography scales.

**Section sources**
- [package.json:23-26](file://package.json#L23-L26)
- [package.json:26-27](file://package.json#L26-L27)

### Tabs and Navigation
- Radix UI tabs and navigation menu offer accessible tabbed interfaces and navigation patterns.
- shadcn/ui provides styled variants for consistent UX.

Customization:
- Adjust indicator styles, spacing, and typography using Tailwind utilities and CSS variables.

**Section sources**
- [package.json:29](file://package.json#L29)
- [package.json:39](file://package.json#L39)

### Form Controls
- Radix UI checkbox, radio group, switch, slider, select, and toggle components form the foundation of interactive forms.
- shadcn/ui adds styled variants and consistent spacing.

Accessibility:
- Ensure labels, ARIA attributes, and keyboard navigation are properly handled per Radix UI guidelines.

**Section sources**
- [package.json:21-22](file://package.json#L21-L22)
- [package.json:32-33](file://package.json#L32-L33)
- [package.json:34-38](file://package.json#L34-L38)
- [package.json:40](file://package.json#L40)

### Feedback and Indicators
- Radix UI progress and toast components provide feedback and status updates.
- shadcn/ui offers styled variants for progress bars and toast notifications.

Customization:
- Use color tokens and spacing scales to match brand guidelines.

**Section sources**
- [package.json:31](file://package.json#L31)
- [package.json:40](file://package.json#L40)

### Layout and Scroll Areas
- Radix UI scroll area and aspect ratio help manage layout constraints and proportions.
- shadcn/ui components integrate seamlessly with these primitives.

**Section sources**
- [package.json:19](file://package.json#L19)
- [package.json:33](file://package.json#L33)

### Component-Level Memoization Optimization
**Updated** The LeadsTable component demonstrates advanced performance optimization through React.memo wrapper and named function exports.

The LeadsTable component implements several performance optimization strategies:

- **Component-level memoization**: Wrapped with `React.memo()` to prevent unnecessary re-renders when props remain unchanged
- **Named function export**: Converted from default export to named function (`export default memo(LeadsTable)`) for better tree-shaking and debugging
- **Large dataset optimization**: Particularly beneficial for applications handling extensive lead data with frequent updates
- **State isolation**: Local state management (`approvingId`, `setApprovingId`) is scoped to component boundaries

Performance benefits:
- Reduced render cycles for static data tables
- Improved scrolling performance in large datasets
- Better memory usage patterns for frequently updated lists
- Enhanced user experience during bulk operations

**Section sources**
- [src/components/portal/LeadsTable.tsx:35-147](file://src/components/portal/LeadsTable.tsx#L35-L147)
- [src/pages/portal/PortalLeads.tsx:55](file://src/pages/portal/PortalLeads.tsx#L55)

### Theming and Composition Patterns
- CSS variables in Tailwind configuration enable theme-aware tokens.
- shadcn/ui aliases streamline imports and promote consistent usage across the app.

Responsive design:
- Apply responsive utilities from Tailwind to adjust spacing, typography, and component sizing.

Accessibility compliance:
- Follow Radix UI accessibility guidelines for focus order, ARIA roles, and keyboard interactions.

**Section sources**
- [components.json:6-12](file://components.json#L6-L12)
- [components.json:13-19](file://components.json#L13-L19)
- [tailwind.config.ts](file://tailwind.config.ts)

## Notification System
**New** The Ryland application now includes a comprehensive notification system powered by Supabase Realtime, providing real-time updates and user-centric messaging.

### NotificationBell Component
The NotificationBell component serves as the central hub for user notifications, featuring a dropdown interface with comprehensive management capabilities.

#### Core Features
- **Real-time Updates**: Instant notification delivery via Supabase Realtime subscriptions
- **Multiple Notification Types**: Support for lead, commission, payout, system, and order notifications
- **Interactive Management**: Mark all read, clear notifications, and individual marking
- **Type-specific Styling**: Distinct icons, colors, and backgrounds for different notification types
- **Unread Tracking**: Visual indicators for unread notifications with intelligent counting

#### Technical Implementation
- **Supabase Integration**: Direct database queries and Realtime subscriptions for live updates
- **Local State Management**: Client-side state synchronization with server-side persistence
- **Click-to-Action**: Optional navigation links for actionable notifications
- **Performance Optimization**: Efficient rendering with loading states and empty state handling

#### Notification Types and Styling
The system supports five notification types with distinct visual treatments:

| Type | Icon | Color | Background |
|------|------|-------|------------|
| lead | Users | Blue-600 | Blue-50 |
| commission | DollarSign | Green-600 | Green-50 |
| payout | DollarSign | Amber-600 | Amber-50 |
| system | AlertCircle | Slate-600 | Slate-50 |
| order | ShoppingCart | Purple-600 | Purple-50 |

#### Real-time Subscription Management
The component establishes persistent Realtime connections for each user:

- **INSERT Events**: Automatically prepend new notifications to the list
- **UPDATE Events**: Sync read/unread status across all connected clients
- **DELETE Events**: Remove notifications when users clear them
- **Connection Cleanup**: Proper channel removal on component unmount

**Section sources**
- [src/components/NotificationBell.tsx:1-218](file://src/components/NotificationBell.tsx#L1-L218)
- [supabase/migrations/20260328_notifications.sql:1-61](file://supabase/migrations/20260328_notifications.sql#L1-L61)

### Database Schema and Security
The notification system is backed by a secure database schema with row-level security policies.

#### Database Structure
- **UUID Primary Keys**: Unique identifiers for notification persistence
- **User References**: Foreign key relationships to auth.users table
- **Type Classification**: Enum-like text field for notification categorization
- **Optional Links**: Support for navigation URLs within notifications
- **Timestamp Tracking**: Creation timestamps with timezone support

#### Security Policies
- **Row Level Security**: Enabled for user data isolation
- **View Permissions**: Users can only access their own notifications
- **Update/Delete Protection**: Prevent unauthorized modifications
- **Insert Restrictions**: Controlled creation through defined policies
- **Realtime Publication**: Supabase Realtime enabled for live updates

#### Helper Functions
The system includes database helper functions for consistent notification creation:

- **create_notification Function**: Standardized notification creation with type and link support
- **Flexible Parameters**: Supports all notification properties with sensible defaults
- **Security Context**: Executes with appropriate permissions for system-generated notifications

**Section sources**
- [supabase/migrations/20260328_notifications.sql:4-60](file://supabase/migrations/20260328_notifications.sql#L4-L60)

### Integration Patterns
The NotificationBell integrates seamlessly into the application's layout systems.

#### Admin Layout Integration
- **Positioning**: Integrated into the admin top navigation bar
- **User Context**: Receives authenticated user ID for personalized notifications
- **Consistent Styling**: Matches the admin theme with appropriate spacing and colors

#### Portal Layout Integration
- **Affiliate Context**: Works within both admin and affiliate portal layouts
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Accessibility**: Maintains keyboard navigation and screen reader compatibility

**Section sources**
- [src/components/admin/AdminLayout.tsx:31](file://src/components/admin/AdminLayout.tsx#L31)
- [src/components/portal/PortalLayout.tsx:32](file://src/components/portal/PortalLayout.tsx#L32)

## Affiliate Management Components
**Updated** The affiliate management system has been enhanced with comprehensive profile editing capabilities and administrative controls.

### AffiliateProfileTab Component
The AffiliateProfileTab provides a dual-mode interface for viewing and editing affiliate profile information with robust validation and user feedback.

#### Editing Mode Features
- **Form Validation**: Required field validation with immediate user feedback
- **Real-time Changes**: Visual indicators for unsaved changes
- **Discard Confirmation**: AlertDialog for preventing accidental data loss
- **Loading States**: Visual feedback during save and reset operations
- **Success/Error Messaging**: Toast notifications for operation results

#### Profile Information Categories
The component organizes affiliate information into two main sections:

**Personal Information**
- Full Name (required)
- Email address
- Phone number with formatting
- Affiliate ID display
- Account status badge
- Join date display

**Business Information**
- Company name
- Website URL with external link handling
- Payment email for payouts
- GHL contact ID for CRM integration
- Referral link generation

#### Status Management
The system supports three affiliate statuses with appropriate visual indicators:
- **Approved**: Green badge with active status
- **Pending**: Yellow badge awaiting approval
- **Suspended**: Red badge with restricted access

#### Password Management
Integrated password reset functionality with:
- One-click reset email sending
- Loading states during reset operations
- User feedback through toast notifications
- Security-conscious redirect URLs

**Section sources**
- [src/components/admin/affiliate-detail/AffiliateProfileTab.tsx:1-304](file://src/components/admin/affiliate-detail/AffiliateProfileTab.tsx#L1-L304)

### AffiliateSettingsTab Component
The AffiliateSettingsTab focuses on administrative controls for commission rates, status management, and internal notes.

#### Commission Rate Management
Administrative interface for setting affiliate compensation:
- **Upfront Commission Rate**: Percentage paid when leads convert to funded clients
- **Backend Commission Rate**: Recurring percentage on subsequent revenue
- **Decimal Precision**: Support for half-percent increments (0.5% granularity)
- **Validation**: Input constraints ensuring realistic commission rates

#### Status Control Interface
Administrative actions for affiliate account management:
- **Approval Workflow**: Pending → Approved transitions
- **Suspension Controls**: Approved → Suspended with destructive styling
- **Reactivation**: Suspended → Approved restoration
- **Visual Feedback**: Status badges with appropriate color coding

#### Administrative Notes
Internal documentation system:
- **Rich Text Area**: Multi-line text input for detailed notes
- **Save Operations**: Individual save buttons for each setting type
- **Loading States**: Visual feedback during save operations
- **Success Confirmation**: Toast notifications for successful updates

**Section sources**
- [src/components/admin/affiliate-detail/AffiliateSettingsTab.tsx:1-187](file://src/components/admin/affiliate-detail/AffiliateSettingsTab.tsx#L1-L187)

### Affiliate Detail Page Integration
The affiliate detail page orchestrates multiple tabs for comprehensive affiliate management.

#### Tab Structure
The detail page provides five distinct management areas:
- **Profile**: Personal and business information editing
- **Commissions**: Commission rate and payment history
- **Leads**: Lead tracking and conversion analytics
- **Payouts**: Payment processing and tax documentation
- **Settings**: Administrative controls and status management

#### Data Flow
- **Centralized Fetching**: Single source of truth for affiliate data
- **Real-time Updates**: Tab content updates when parent components refresh
- **Error Handling**: Graceful degradation if individual tab data fails
- **Loading States**: Skeleton loaders for improved perceived performance

**Section sources**
- [src/pages/admin/AdminAffiliateDetail.tsx:144-177](file://src/pages/admin/AdminAffiliateDetail.tsx#L144-L177)

## Dependency Analysis
The UI stack relies on a set of core libraries that define the component ecosystem and styling pipeline.

```mermaid
graph LR
P["package.json<br/>dependencies"] --> RUI["@radix-ui/*"]
P --> SHAD["shadcn/ui"]
P --> TW["Tailwind CSS"]
P --> TS["TypeScript"]
P --> VITE["Vite"]
P --> REACT["React"]
P --> UTILS["Utilities<br/>class-variance-authority, clsx,<br/>tailwind-merge, lucide-react,<br/>next-themes, framer-motion, etc."]
P --> SUPA["Supabase<br/>Realtime + Auth"]
SUPA --> DB["PostgreSQL<br/>Notifications Table"]
SUPA --> REALTIME["Realtime Subscriptions"]
```

**Diagram sources**
- [package.json:15-69](file://package.json#L15-L69)
- [supabase/functions/ghl-calendar/index.ts:16-145](file://supabase/functions/ghl-calendar/index.ts#L16-L145)

**Section sources**
- [package.json:15-69](file://package.json#L15-L69)

## Performance Considerations
**Updated** The application implements comprehensive performance optimization strategies across multiple layers, including the new notification system.

### Calendar Component Performance
- **Edge Function Optimization**: Direct fetch implementation avoids SDK AbortError and improves reliability
- **Caching Strategies**: Slot data caching prevents redundant API calls during month navigation
- **Loading States**: Skeleton loaders provide visual feedback during data fetching
- **Error Recovery**: Retry mechanisms and user-friendly error messages improve user experience

### Notification System Performance
- **Real-time Efficiency**: Supabase Realtime minimizes polling overhead
- **State Optimization**: Local state updates prevent unnecessary re-renders
- **Connection Management**: Proper channel cleanup prevents memory leaks
- **Limited Fetch Size**: Database queries limit to 50 most recent notifications

### Component-Level Optimizations
- **React.memo implementation**: The LeadsTable component uses `React.memo()` wrapper to prevent unnecessary re-renders when props remain unchanged
- **Named function exports**: Converted from default exports to named functions for improved tree-shaking and debugging capabilities
- **State management optimization**: Local state is scoped appropriately to minimize re-render triggers

### Data Flow Optimization
- **Efficient data fetching**: The useAffiliateLeads hook implements React Query for efficient caching and background updates
- **Conditional rendering**: Loading states and empty state handling prevent unnecessary DOM manipulation
- **Event delegation**: Click handlers are optimized to prevent event bubbling when not needed

### Large Dataset Handling
- **Virtualization considerations**: For extremely large datasets, consider implementing virtualized lists using libraries like react-window
- **Pagination strategies**: Implement server-side pagination for datasets exceeding 1000+ records
- **Memory management**: Proper cleanup of subscriptions and event listeners in useEffect hooks

### Rendering Performance
- **Minimal re-renders**: Use stable prop references and memoized callbacks to reduce component updates
- **Optimized loops**: Efficient map operations with stable keys and minimal component nesting
- **CSS-in-JS optimization**: Leverage Tailwind utility classes instead of dynamic styled components for better performance

Best practices:
- Monitor component render frequency using React DevTools Profiler
- Implement performance budgets for critical components
- Use React.lazy for non-critical components to improve initial load times
- Consider code splitting for large feature modules

**Section sources**
- [src/components/funnel/ConsultationCalendar.tsx:13-38](file://src/components/funnel/ConsultationCalendar.tsx#L13-L38)
- [src/components/portal/LeadsTable.tsx:5](file://src/components/portal/LeadsTable.tsx#L5)
- [src/components/portal/LeadsTable.tsx:147](file://src/components/portal/LeadsTable.tsx#L147)
- [src/hooks/useAffiliateLeads.ts:6-30](file://src/hooks/useAffiliateLeads.ts#L6-L30)
- [src/components/NotificationBell.tsx:47-96](file://src/components/NotificationBell.tsx#L47-L96)

## Troubleshooting Guide
**Updated** Common issues and resolutions with enhanced calendar integration debugging and notification system troubleshooting.

### Calendar Integration Issues
- **Edge Function Failures**: Check Supabase Edge Function logs for "[GHL Debug]" prefixed entries
- **API Authentication Errors**: Verify SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables
- **Calendar Service Connectivity**: Monitor GHL API responses and error codes in edge function logs
- **Slot Availability Problems**: Review calendar service configuration and timezone settings

### Notification System Issues
- **Real-time Connection Failures**: Verify Supabase Realtime connectivity and authentication
- **Notification Delivery Problems**: Check database permissions and row-level security policies
- **Subscription Not Working**: Ensure proper channel naming and filter syntax
- **Performance Degradation**: Monitor database query performance and connection limits

### Component Performance Issues
- **Excessive re-renders**: Verify that components are properly memoized using React.memo wrapper
- **Large dataset lag**: Implement pagination or virtualization for tables with more than 100 records
- **Memory leaks**: Ensure proper cleanup of subscriptions and event listeners in useEffect hooks

### Calendar Component Debugging
- **Logging Verification**: Look for "[GHL Debug]" console messages in browser developer tools
- **Network Requests**: Check fetch requests to `/functions/v1/ghl-calendar` endpoint
- **Response Analysis**: Examine slot availability data structure and error responses
- **Timezone Issues**: Verify timezone parameter matches user's local timezone

### Component-Level Memoization Problems
- **Missing memoization**: Check that components using React.memo are exported as named functions
- **Prop comparison issues**: Ensure props passed to memoized components are stable references
- **Context provider conflicts**: Verify that memoized components aren't consuming unstable context values

### Shadcn/UI Integration Issues
- Missing shadcn/ui components after installation: verify aliases and Tailwind configuration in components.json and tailwind.config.ts
- Theme inconsistencies: ensure CSS variables are applied and Tailwind is generating utilities for the configured base color
- Accessibility regressions: confirm Radix UI ARIA attributes and focus management are intact when customizing components

### Edge Function Troubleshooting
- **Environment Variables**: Verify GHL_API_KEY, GHL_LOCATION_ID, and calendar ID environment variables
- **Request Validation**: Check that startDate, endDate, and timezone parameters are properly formatted
- **Response Processing**: Monitor slot data structure and error propagation from GHL API
- **Rate Limiting**: Implement retry logic for temporary GHL API errors

### Database and Security Issues
- **Permission Denied**: Verify user has proper permissions for notifications table access
- **RLS Policy Conflicts**: Check row-level security policies for notification access restrictions
- **Realtime Publication Issues**: Ensure notifications table is included in supabase_realtime publication
- **Connection Limits**: Monitor Supabase connection limits for Realtime subscriptions

### Performance Debugging
- Use React DevTools Profiler to identify components causing excessive re-renders
- Monitor bundle size using webpack-bundle-analyzer for optimization opportunities
- Implement performance monitoring in production using tools like Sentry or LogRocket
- Analyze network performance for calendar API calls and edge function responses
- Track database query performance for notification retrieval and updates

**Section sources**
- [src/components/funnel/ConsultationCalendar.tsx:13-38](file://src/components/funnel/ConsultationCalendar.tsx#L13-L38)
- [supabase/functions/ghl-calendar/index.ts:83-131](file://supabase/functions/ghl-calendar/index.ts#L83-L131)
- [components.json:1-20](file://components.json#L1-L20)
- [tailwind.config.ts](file://tailwind.config.ts)
- [src/components/portal/LeadsTable.tsx:147](file://src/components/portal/LeadsTable.tsx#L147)
- [src/components/NotificationBell.tsx:47-96](file://src/components/NotificationBell.tsx#L47-L96)
- [supabase/migrations/20260328_notifications.sql:20-42](file://supabase/migrations/20260328_notifications.sql#L20-L42)

## Conclusion
The Ryland application employs a robust UI design system that combines Radix UI primitives with shadcn/ui components and Tailwind CSS. The system emphasizes accessibility, customization, and consistency through a centralized configuration that defines color tokens, typography, and spacing. Recent enhancements to the ConsultationCalendar component demonstrate a commitment to comprehensive debugging and troubleshooting capabilities, particularly evident in the implementation of detailed logging, improved error handling, and enhanced edge function integration. These improvements significantly enhance the development experience and provide better visibility into calendar integration issues.

The addition of the comprehensive notification system represents a significant advancement in user communication and engagement. The NotificationBell component provides real-time, personalized notifications with sophisticated type-based styling and seamless integration with the Supabase Realtime infrastructure. The affiliate management system has been enhanced with powerful editing capabilities, validation, and administrative controls that streamline affiliate onboarding and management processes.

By leveraging the provided aliases, CSS variables, performance optimization patterns, comprehensive logging infrastructure, and the new notification system, developers can compose accessible, responsive interfaces that align with the design system's guidelines while maintaining optimal performance characteristics and reliable calendar integration. The notification system's real-time capabilities and the enhanced affiliate management features position the application to deliver a modern, professional user experience that supports both customer-facing and administrative workflows effectively.

## Appendices
- Global styles and app-level styling are defined in the CSS files referenced below.

**Section sources**
- [src/index.css](file://src/index.css)
- [src/App.css](file://src/App.css)
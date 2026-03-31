# Bureau Status System

<cite>
**Referenced Files in This Document**
- [useBureauStatus.ts](file://src/hooks/useBureauStatus.ts)
- [BureauStatusCard.tsx](file://src/components/command-center/bureau/BureauStatusCard.tsx)
- [BureauOverview.tsx](file://src/components/command-center/bureau/BureauOverview.tsx)
- [BureauStatusTab.tsx](file://src/components/command-center/client-detail/BureauStatusTab.tsx)
- [InquiryRemovalList.tsx](file://src/components/command-center/bureau/InquiryRemovalList.tsx)
- [InquiryRemovalForm.tsx](file://src/components/command-center/bureau/InquiryRemovalForm.tsx)
- [ClientDetailView.tsx](file://src/pages/command-center/ClientDetailView.tsx)
- [types.ts](file://src/integrations/supabase/types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Data Model](#data-model)
5. [User Interface Components](#user-interface-components)
6. [Real-time Updates](#real-time-updates)
7. [Administrative Features](#administrative-features)
8. [Integration Points](#integration-points)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Conclusion](#conclusion)

## Introduction

The Bureau Status System is a comprehensive credit bureau monitoring and management solution integrated into the Ryland funding platform. This system tracks credit inquiry counts across the three major credit bureaus (Experian, Equifax, and TransUnion) and provides automated controls to prevent excessive inquiries that could negatively impact clients' credit scores.

The system operates on a threshold-based approach where each bureau maintains an inquiry count that triggers automatic pausing when the limit is reached. Administrators can override these pauses when necessary, and the system provides comprehensive audit trails through activity logging.

## System Architecture

The Bureau Status System follows a modular architecture with clear separation of concerns between data fetching, UI presentation, and administrative controls.

```mermaid
graph TB
subgraph "Client Detail View"
CDV[ClientDetailView]
BST[BureauStatusTab]
end
subgraph "Bureau Management Layer"
UBS[useBureauStatus Hook]
BO[BureauOverview]
BSC[BureauStatusCard]
end
subgraph "Inquiry Management"
IRL[InquiryRemovalList]
IRF[InquiryRemovalForm]
end
subgraph "Data Layer"
SUP[Supabase Client]
BS[bureau_status Table]
IR[inquiry_removals Table]
CAL[client_activity_log Table]
end
subgraph "UI Components"
CARD[Status Cards]
TABLE[Removal Table]
FORM[Removal Form]
end
CDV --> BST
BST --> UBS
BST --> BO
BO --> BSC
BO --> IRL
IRL --> IRF
UBS --> SUP
SUP --> BS
SUP --> IR
SUP --> CAL
BSC --> CARD
IRL --> TABLE
IRF --> FORM
```

**Diagram sources**
- [ClientDetailView.tsx:1-224](file://src/pages/command-center/ClientDetailView.tsx#L1-L224)
- [useBureauStatus.ts:278-385](file://src/hooks/useBureauStatus.ts#L278-L385)
- [BureauOverview.tsx:14-72](file://src/components/command-center/bureau/BureauOverview.tsx#L14-L72)

## Core Components

### Data Fetching and State Management

The system centers around the `useBureauStatus` custom React hook, which provides comprehensive state management for bureau status monitoring and control.

```mermaid
sequenceDiagram
participant Client as Client Application
participant Hook as useBureauStatus Hook
participant Supabase as Supabase Client
participant DB as Database Tables
Client->>Hook : Initialize with clientId
Hook->>Supabase : fetchBureauStatuses(clientId)
Supabase->>DB : SELECT * FROM bureau_status WHERE client_id = ?
DB-->>Supabase : Bureau status records
Supabase-->>Hook : Status data
Hook->>Supabase : fetchInquiryRemovals(clientId)
Supabase->>DB : SELECT * FROM inquiry_removals WHERE client_id = ?
DB-->>Supabase : Removal records
Supabase-->>Hook : Removal data
Note over Hook,DB : Real-time subscription setup
Hook->>DB : Subscribe to postgres_changes
DB-->>Hook : Live updates when records change
```

**Diagram sources**
- [useBureauStatus.ts:282-326](file://src/hooks/useBureauStatus.ts#L282-L326)

**Section sources**
- [useBureauStatus.ts:278-385](file://src/hooks/useBureauStatus.ts#L278-L385)

### Status Monitoring and Threshold Management

The system implements a sophisticated threshold-based monitoring system with three distinct states:

```mermaid
flowchart TD
Start([Inquiry Count Check]) --> Zero{Count = 0?}
Zero --> |Yes| Green[Green Status<br/>Normal Operations]
Zero --> |No| One{Count = 1?}
One --> |Yes| Yellow[Yellow Status<br/>Approaching Threshold]
One --> |No| Red[Red Status<br/>Threshold Exceeded]
Yellow --> Warning[Warning Display<br/>One more inquiry will pause]
Red --> Pause[Automatic Pause<br/>Bureau temporarily inactive]
Green --> Normal[Normal Operation<br/>Accept applications]
Warning --> Monitor[Monitor Closely<br/>Limit new inquiries]
Pause --> AdminOverride[Admin Override Available]
AdminOverride --> Reset[Reset to Zero<br/>Unpause Bureau]
```

**Diagram sources**
- [useBureauStatus.ts:388-392](file://src/hooks/useBureauStatus.ts#L388-L392)
- [BureauStatusCard.tsx:49-50](file://src/components/command-center/bureau/BureauStatusCard.tsx#L49-L50)

**Section sources**
- [useBureauStatus.ts:24-25](file://src/hooks/useBureauStatus.ts#L24-L25)
- [BureauStatusCard.tsx:49-63](file://src/components/command-center/bureau/BureauStatusCard.tsx#L49-L63)

## Data Model

The system relies on three primary database tables that work together to manage bureau status and inquiry removal processes.

```mermaid
erDiagram
FUNDING_CLIENTS {
string id PK
string full_name
string email
string phone
string current_stage
boolean is_archived
timestamp created_at
timestamp updated_at
}
BUREAU_STATUS {
string id PK
string client_id FK
string bureau
integer inquiry_count
boolean is_paused
timestamp paused_at
timestamp unpaused_at
}
INQUIRY_REMOVALS {
string id PK
string client_id FK
string bureau
string status
timestamp requested_at
timestamp completed_at
string assigned_to
text notes
}
CLIENT_ACTIVITY_LOG {
string id PK
string client_id FK
string user_id
string action_type
json details
timestamp created_at
}
FUNDING_CLIENTS ||--o{ BUREAU_STATUS : has
FUNDING_CLIENTS ||--o{ INQUIRY_REMOVALS : has
FUNDING_CLIENTS ||--o{ CLIENT_ACTIVITY_LOG : generates
```

**Diagram sources**
- [types.ts:1157-1276](file://src/integrations/supabase/types.ts#L1157-L1276)

### Bureau Status Records

Each client maintains three separate bureau status records, one for each credit bureau. These records track inquiry counts, pause states, and timestamps for transparency and auditability.

### Inquiry Removal Requests

The system manages inquiry removal requests through a structured workflow with three status states: Requested, InProgress, and Completed. Each request creates associated tasks and activity logs for complete traceability.

**Section sources**
- [types.ts:1157-1276](file://src/integrations/supabase/types.ts#L1157-L1276)

## User Interface Components

### Bureau Status Overview

The system presents a comprehensive dashboard showing the current status of all three bureaus with clear visual indicators and actionable controls.

```mermaid
classDiagram
class BureauStatusTab {
+clientId : string
+isAdmin : boolean
+bureauStatuses : BureauStatus[]
+inquiryRemovals : InquiryRemoval[]
+handleUnpause(bureau)
+handleCreateRemoval(bureau, notes)
+handleUpdateRemovalStatus(id, status)
}
class BureauOverview {
+bureauStatuses : BureauStatus[]
+isAdmin : boolean
+onUnpause : function
+isUnpausing : boolean
+renderSummary()
+renderCards()
}
class BureauStatusCard {
+status : BureauStatus
+isAdmin : boolean
+onUnpause : function
+isUnpausing : boolean
+renderStatusDisplay()
+renderProgress()
+renderControls()
}
class InquiryRemovalList {
+clientId : string
+inquiryRemovals : InquiryRemoval[]
+bureauStatuses : BureauStatus[]
+onCreateRemoval : function
+onUpdateStatus : function
+renderRemovalTable()
+renderStatusDropdown()
}
class InquiryRemovalForm {
+open : boolean
+onOpenChange : function
+onSubmit : function
+pausedBureaus : BureauName[]
+isSubmitting : boolean
+handleSubmit()
+handleCancel()
}
BureauStatusTab --> BureauOverview
BureauOverview --> BureauStatusCard
BureauOverview --> InquiryRemovalList
InquiryRemovalList --> InquiryRemovalForm
```

**Diagram sources**
- [BureauStatusTab.tsx:14-182](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L14-L182)
- [BureauOverview.tsx:14-72](file://src/components/command-center/bureau/BureauOverview.tsx#L14-L72)
- [BureauStatusCard.tsx:39-211](file://src/components/command-center/bureau/BureauStatusCard.tsx#L39-L211)

**Section sources**
- [BureauStatusTab.tsx:14-182](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L14-L182)
- [BureauOverview.tsx:14-72](file://src/components/command-center/bureau/BureauOverview.tsx#L14-L72)
- [BureauStatusCard.tsx:39-211](file://src/components/command-center/bureau/BureauStatusCard.tsx#L39-L211)

### Visual Status Indicators

The system uses a color-coded status system to immediately communicate bureau health:

- **Green**: Normal operation (0 inquiries)
- **Yellow**: Approaching threshold (1 inquiry)
- **Red**: Threshold exceeded (≥2 inquiries)

**Section sources**
- [BureauStatusCard.tsx:53-63](file://src/components/command-center/bureau/BureauStatusCard.tsx#L53-L63)
- [useBureauStatus.ts:388-392](file://src/hooks/useBureauStatus.ts#L388-L392)

## Real-time Updates

The system leverages Supabase's real-time capabilities to provide instant updates when bureau statuses change.

```mermaid
sequenceDiagram
participant Client as Client Browser
participant Supabase as Supabase Realtime
participant Channel as Postgres Channel
participant Hook as useBureauStatus Hook
participant UI as Status Components
Client->>Supabase : Establish connection
Supabase->>Channel : Create channel for client_id
Channel->>Hook : Subscribe to changes
Note over Channel : Listening for bureau_status changes
Database->>Channel : New inquiry recorded
Channel->>Hook : Change notification
Hook->>Hook : Invalidate query cache
Hook->>UI : Trigger re-render with updated data
Database->>Channel : Bureau paused
Channel->>Hook : Change notification
Hook->>Hook : Invalidate query cache
Hook->>UI : Update status cards and warnings
```

**Diagram sources**
- [useBureauStatus.ts:303-326](file://src/hooks/useBureauStatus.ts#L303-L326)

**Section sources**
- [useBureauStatus.ts:303-326](file://src/hooks/useBureauStatus.ts#L303-L326)

## Administrative Features

### Admin Override System

Administrators have the ability to override automatic bureau pauses when justified circumstances require immediate action.

```mermaid
flowchart TD
AdminAction[Admin Override Request] --> Verify[Verify Admin Role]
Verify --> |Authorized| CheckStatus[Check Current Status]
Verify --> |Unauthorized| Deny[Deny Access]
CheckStatus --> IsPaused{Is Bureau Paused?}
IsPaused --> |No| Inform[Inform Not Paused]
IsPaused --> |Yes| Confirm[Show Confirmation Dialog]
Confirm --> Proceed[Proceed with Override]
Proceed --> Reset[Reset Inquiry Count to Zero]
Reset --> Unpause[Set is_paused = false]
Unpause --> Log[Log Activity in client_activity_log]
Log --> Notify[Notify User]
Deny --> Error[Show Error Message]
Inform --> Error
Error --> End([End])
Notify --> End
```

**Diagram sources**
- [BureauStatusCard.tsx:157-190](file://src/components/command-center/bureau/BureauStatusCard.tsx#L157-L190)
- [useBureauStatus.ts:119-159](file://src/hooks/useBureauStatus.ts#L119-L159)

**Section sources**
- [BureauStatusCard.tsx:157-190](file://src/components/command-center/bureau/BureauStatusCard.tsx#L157-L190)
- [useBureauStatus.ts:119-159](file://src/hooks/useBureauStatus.ts#L119-L159)

### Inquiry Removal Workflow

The system provides a complete workflow for managing inquiry removal requests from creation to completion.

**Section sources**
- [InquiryRemovalList.tsx:52-192](file://src/components/command-center/bureau/InquiryRemovalList.tsx#L52-L192)
- [InquiryRemovalForm.tsx:33-159](file://src/components/command-center/bureau/InquiryRemovalForm.tsx#L33-L159)

## Integration Points

### Supabase Authentication and Authorization

The system integrates with Supabase's authentication system to provide role-based access control for administrative features.

**Section sources**
- [BureauStatusTab.tsx:18-21](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L18-L21)
- [types.ts:1316-1322](file://src/integrations/supabase/types.ts#L1316-L1322)

### Client Detail Integration

The bureau status system is seamlessly integrated into the broader client management interface, providing comprehensive client information in a unified view.

**Section sources**
- [ClientDetailView.tsx:177-183](file://src/pages/command-center/ClientDetailView.tsx#L177-L183)

## Error Handling

The system implements comprehensive error handling across all components to ensure robust operation under various failure scenarios.

```mermaid
flowchart TD
Error[Error Occurs] --> CheckType{Error Type?}
CheckType --> Network[Network Error]
CheckType --> Database[Database Error]
CheckType --> Validation[Validation Error]
Network --> Retry[Attempt Retry]
Database --> Fallback[Show Fallback UI]
Validation --> UserFeedback[Show User Feedback]
Retry --> Success[Operation Success]
Success --> Complete[Complete Operation]
Fallback --> Skeleton[Show Skeleton Loading]
UserFeedback --> Toast[Display Toast Message]
Skeleton --> End([End])
Toast --> End
```

**Diagram sources**
- [BureauStatusTab.tsx:137-148](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L137-L148)

**Section sources**
- [BureauStatusTab.tsx:104-148](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L104-L148)
- [useBureauStatus.ts:47-49](file://src/hooks/useBureauStatus.ts#L47-L49)

## Performance Considerations

### Optimized Data Fetching

The system uses React Query for efficient data caching and synchronization, minimizing unnecessary network requests while maintaining real-time updates.

### Lazy Loading Implementation

Components implement skeleton loading states during initial data fetch to provide responsive user experience while data loads asynchronously.

### Memory Management

The system properly cleans up Supabase subscriptions and React Query cache invalidations to prevent memory leaks and ensure optimal performance.

## Troubleshooting Guide

### Common Issues and Solutions

**Bureau Status Not Updating**
- Verify real-time subscription is active
- Check database connectivity
- Ensure proper client ID is passed to hooks

**Admin Override Not Working**
- Verify user has admin role
- Check Supabase authentication state
- Review console for permission errors

**Inquiry Removal Form Disabled**
- Confirm bureaus are properly paused
- Verify form validation passes
- Check for pending mutations

**Section sources**
- [useBureauStatus.ts:303-326](file://src/hooks/useBureauStatus.ts#L303-L326)
- [BureauStatusTab.tsx:38-57](file://src/components/command-center/client-detail/BureauStatusTab.tsx#L38-L57)

## Conclusion

The Bureau Status System provides a robust, scalable solution for managing credit bureau interactions within the Ryland funding platform. Through its threshold-based monitoring, comprehensive administrative controls, and real-time updates, the system ensures responsible credit inquiry management while maintaining operational flexibility for administrators.

The modular architecture enables easy maintenance and future enhancements, while the comprehensive error handling and performance optimizations ensure reliable operation in production environments. The system successfully balances automation with human oversight, providing the right level of control for different operational scenarios.
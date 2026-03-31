# Funding Pipeline Management

<cite>
**Referenced Files in This Document**
- [PipelineDashboard.tsx](file://src/pages/command-center/PipelineDashboard.tsx)
- [PipelineStageCard.tsx](file://src/components/command-center/pipeline/PipelineStageCard.tsx)
- [StageDrillDown.tsx](file://src/components/command-center/pipeline/StageDrillDown.tsx)
- [usePipelineData.ts](file://src/hooks/usePipelineData.ts)
- [command-center.ts](file://src/types/command-center.ts)
- [useClientApplications.ts](file://src/hooks/useClientApplications.ts)
- [ApplicationForm.tsx](file://src/components/command-center/applications/ApplicationForm.tsx)
- [ApplicationList.tsx](file://src/components/command-center/applications/ApplicationList.tsx)
- [ApplicationStatusUpdate.tsx](file://src/components/command-center/applications/ApplicationStatusUpdate.tsx)
- [ApprovedFundingTotal.tsx](file://src/components/command-center/applications/ApprovedFundingTotal.tsx)
- [ClientDetailView.tsx](file://src/pages/command-center/ClientDetailView.tsx)
- [20260330000000_command_center_schema.sql](file://supabase/migrations/20260330000000_command_center_schema.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Pipeline Management](#pipeline-management)
5. [Application Management](#application-management)
6. [Real-time Data Flow](#real-time-data-flow)
7. [Database Schema](#database-schema)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction

The Funding Pipeline Management system is a comprehensive client relationship management platform designed for financial services organizations. This system tracks clients through a structured funding pipeline with eight distinct stages, manages loan applications, monitors bureau status, and provides real-time analytics for funding operations.

The platform enables funding specialists and managers to oversee client progression from initial onboarding through final funding, while maintaining compliance with credit bureau regulations and managing application workflows efficiently.

## System Architecture

The Funding Pipeline Management system follows a modern React-based architecture with Supabase as the backend service, implementing real-time data synchronization and comprehensive client management capabilities.

```mermaid
graph TB
subgraph "Frontend Layer"
PD[PipelineDashboard]
CD[ClientDetailView]
AF[ApplicationForm]
AL[ApplicationList]
SDC[StageDrillDown]
end
subgraph "Hooks Layer"
UPD[usePipelineData]
UCA[useClientApplications]
UR[useReps]
end
subgraph "Components Layer"
PSC[PipelineStageCard]
ASU[ApplicationStatusUpdate]
AFT[ApprovedFundingTotal]
end
subgraph "Backend Services"
SUP[Supabase Realtime]
DB[(PostgreSQL Database)]
end
PD --> UPD
CD --> UCA
AF --> UCA
AL --> UCA
SDC --> UPD
UPD --> SUP
UCA --> SUP
SUP --> DB
```

**Diagram sources**
- [PipelineDashboard.tsx:63-168](file://src/pages/command-center/PipelineDashboard.tsx#L63-L168)
- [usePipelineData.ts:93-329](file://src/hooks/usePipelineData.ts#L93-L329)
- [useClientApplications.ts:484-549](file://src/hooks/useClientApplications.ts#L484-L549)

## Core Components

### Pipeline Management System

The pipeline management system organizes clients through eight distinct stages, each representing a specific phase in the funding process:

```mermaid
flowchart TD
O[Onboarding] --> A[Analysis]
A --> K[Kickoff Call]
K --> R[Remediation]
R --> PAC[Post-Audit Check]
PAC --> FE[Funding Execution]
FE --> CF[Closed/Funded]
CF --> IR[Inquiry Removal]
IR --> O
style O fill:#3b82f6
style A fill:#8b5cf6
style K fill:#f59e0b
style R fill:#ef4444
style PAC fill:#10b981
style FE fill:#06b6d4
style CF fill:#22c55e
style IR fill:#6366f1
```

**Diagram sources**
- [command-center.ts:11-20](file://src/types/command-center.ts#L11-L20)

Each stage is represented by dedicated UI components that provide visual indicators and status tracking for client progression.

**Section sources**
- [command-center.ts:1-106](file://src/types/command-center.ts#L1-L106)
- [PipelineStageCard.tsx:25-85](file://src/components/command-center/pipeline/PipelineStageCard.tsx#L25-L85)

### Client Application Management

The application management system handles the complete lifecycle of funding applications, from submission to approval tracking:

```mermaid
sequenceDiagram
participant User as Funding Specialist
participant Form as ApplicationForm
participant Hook as useClientApplications
participant DB as Supabase Database
participant Bureau as Bureau Status
User->>Form : Submit Application
Form->>Hook : createApplication()
Hook->>DB : Insert funding_applications
Hook->>Bureau : Update inquiry_count
Bureau->>DB : Upsert bureau_status
Hook->>DB : Insert client_activity_log
DB-->>Hook : Application Created
Hook-->>Form : Success Response
Form-->>User : Application Logged
```

**Diagram sources**
- [useClientApplications.ts:240-383](file://src/hooks/useClientApplications.ts#L240-L383)
- [ApplicationForm.tsx:110-124](file://src/components/command-center/applications/ApplicationForm.tsx#L110-L124)

**Section sources**
- [useClientApplications.ts:10-614](file://src/hooks/useClientApplications.ts#L10-L614)
- [ApplicationForm.tsx:1-396](file://src/components/command-center/applications/ApplicationForm.tsx#L1-L396)

## Pipeline Management

### Pipeline Dashboard

The Pipeline Dashboard serves as the central monitoring interface, displaying real-time client distribution across all pipeline stages with interactive filtering capabilities.

```mermaid
classDiagram
class PipelineDashboard {
+useState selectedStage
+usePipelineData() pipelineData
+useReps() reps
+render() JSX.Element
}
class PipelineStageCard {
+stage : PipelineStage
+count : number
+overdueCount : number
+isSelected : boolean
+onClick() : void
}
class StageDrillDown {
+stage : PipelineStage
+clients : ClientWithDetails[]
+reps : RepOption[]
+handleSort() : void
+handleBulkReassign() : void
}
PipelineDashboard --> PipelineStageCard : displays
PipelineDashboard --> StageDrillDown : renders
StageDrillDown --> ClientWithDetails : processes
```

**Diagram sources**
- [PipelineDashboard.tsx:63-168](file://src/pages/command-center/PipelineDashboard.tsx#L63-L168)
- [PipelineStageCard.tsx:87-142](file://src/components/command-center/pipeline/PipelineStageCard.tsx#L87-L142)
- [StageDrillDown.tsx:108-516](file://src/components/command-center/pipeline/StageDrillDown.tsx#L108-L516)

### Stage Drill-down Functionality

The Stage Drill-down component provides detailed client information for each pipeline stage, enabling bulk operations and comprehensive client management:

**Section sources**
- [PipelineDashboard.tsx:1-169](file://src/pages/command-center/PipelineDashboard.tsx#L1-L169)
- [StageDrillDown.tsx:1-516](file://src/components/command-center/pipeline/StageDrillDown.tsx#L1-L516)

## Application Management

### Application Lifecycle Tracking

The application management system provides comprehensive tracking of funding applications through five distinct status states:

```mermaid
stateDiagram-v2
[*] --> Applied
Applied --> Pending : Review Process
Applied --> Denied : Rejection
Applied --> Approved : Approval
Pending --> NeedsFollowUp : Additional Info Required
Pending --> Approved : Conditional Approval
Pending --> Denied : Final Denial
Approved --> [*] : Funding Complete
Denied --> [*] : Application Closed
NeedsFollowUp --> Pending : Additional Information Received
```

**Diagram sources**
- [useClientApplications.ts:11-16](file://src/hooks/useClientApplications.ts#L11-L16)

### Bureau Status Management

The system integrates with credit bureau systems to track inquiry counts and manage bureau pausing based on regulatory thresholds:

**Section sources**
- [useClientApplications.ts:225-237](file://src/hooks/useClientApplications.ts#L225-L237)
- [ApplicationForm.tsx:126-133](file://src/components/command-center/applications/ApplicationForm.tsx#L126-L133)

## Real-time Data Flow

The system implements real-time data synchronization using Supabase's realtime capabilities to ensure all stakeholders have access to current pipeline information.

```mermaid
sequenceDiagram
participant Client as Client Browser
participant Hook as usePipelineData
participant Supabase as Supabase Realtime
participant DB as PostgreSQL Database
Client->>Hook : usePipelineData()
Hook->>Supabase : Subscribe to funding_clients
Supabase->>DB : Listen for changes
DB-->>Supabase : postgres_changes
Supabase-->>Hook : Channel event
Hook->>Hook : Invalidate queries
Hook-->>Client : Updated pipeline data
```

**Diagram sources**
- [usePipelineData.ts:306-326](file://src/hooks/usePipelineData.ts#L306-L326)

**Section sources**
- [usePipelineData.ts:1-386](file://src/hooks/usePipelineData.ts#L1-L386)

## Database Schema

The database schema supports comprehensive funding pipeline management with strict row-level security policies and real-time publication capabilities.

```mermaid
erDiagram
FUNDING_CLIENTS {
uuid id PK
text full_name
text email
text phone
date dob
text ssn_encrypted
text current_stage
timestamptz stage_entered_at
boolean is_archived
timestamptz created_at
timestamptz updated_at
}
CLIENT_ASSIGNMENTS {
uuid id PK
uuid client_id FK
uuid user_id FK
boolean is_primary
timestamptz assigned_at
}
FUNDING_APPLICATIONS {
uuid id PK
uuid client_id FK
uuid bank_id FK
text product_type
text status
numeric approval_amount
text bureau_pulled
date applied_date
uuid created_by FK
timestamptz created_at
timestamptz updated_at
}
BUREAU_STATUS {
uuid id PK
uuid client_id FK
text bureau
integer inquiry_count
boolean is_paused
timestamptz paused_at
timestamptz unpaused_at
}
CLIENT_TASKS {
uuid id PK
uuid client_id FK
uuid application_id FK
text title
text status
timestamptz due_date
uuid assigned_to FK
timestamptz created_at
}
FUNDING_CLIENTS ||--o{ CLIENT_ASSIGNMENTS : has
FUNDING_CLIENTS ||--o{ FUNDING_APPLICATIONS : contains
FUNDING_CLIENTS ||--o{ BUREAU_STATUS : monitored_by
FUNDING_CLIENTS ||--o{ CLIENT_TASKS : assigned_to
FUNDING_APPLICATIONS ||--|| BUREAU_STATUS : affects
```

**Diagram sources**
- [20260330000000_command_center_schema.sql:37-217](file://supabase/migrations/20260330000000_command_center_schema.sql#L37-L217)

**Section sources**
- [20260330000000_command_center_schema.sql:1-870](file://supabase/migrations/20260330000000_command_center_schema.sql#L1-L870)

## Performance Considerations

The system implements several performance optimization strategies:

- **Query Caching**: React Query provides automatic caching with configurable stale times
- **Real-time Subscriptions**: Efficient channel-based updates minimize unnecessary data transfers
- **Index Optimization**: Strategic database indexing on frequently queried columns
- **Lazy Loading**: Component-level loading states prevent blocking UI updates

**Section sources**
- [usePipelineData.ts:303](file://src/hooks/usePipelineData.ts#L303)
- [useClientApplications.ts:516-548](file://src/hooks/useClientApplications.ts#L516-L548)

## Troubleshooting Guide

### Common Issues and Solutions

**Pipeline Data Not Loading**
- Verify Supabase connection and authentication
- Check network connectivity to Supabase realtime service
- Ensure proper RLS policies are configured

**Application Submission Failures**
- Validate bank selection and bureau status
- Check approval amount formatting for approved applications
- Verify user permissions for application creation

**Real-time Updates Not Working**
- Confirm Supabase realtime publication is enabled
- Check browser console for websocket connection errors
- Verify database triggers are properly configured

**Section sources**
- [usePipelineData.ts:105-107](file://src/hooks/usePipelineData.ts#L105-L107)
- [useClientApplications.ts:263-265](file://src/hooks/useClientApplications.ts#L263-L265)

## Conclusion

The Funding Pipeline Management system provides a robust, scalable solution for financial services organizations requiring comprehensive client relationship management. The system's real-time capabilities, comprehensive application tracking, and integrated bureau management make it an essential tool for modern funding operations.

The modular architecture ensures maintainability and extensibility, while the real-time data synchronization provides stakeholders with current insights into client progression through the funding pipeline. The integration with credit bureau systems ensures compliance with regulatory requirements while maintaining operational efficiency.
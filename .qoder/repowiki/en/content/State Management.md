# State Management

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [README.md](file://README.md)
- [src/main.tsx](file://src/main.tsx)
- [src/App.tsx](file://src/App.tsx)
- [src/stores/cartStore.ts](file://src/stores/cartStore.ts)
- [src/hooks/useCartSync.ts](file://src/hooks/useCartSync.ts)
- [src/lib/shopify.ts](file://src/lib/shopify.ts)
- [src/hooks/useAuth.tsx](file://src/hooks/useAuth.tsx)
- [src/hooks/useAdminRole.ts](file://src/hooks/useAdminRole.ts)
- [src/pages/ProductDetail.tsx](file://src/pages/ProductDetail.tsx)
- [src/components/ui/sonner.tsx](file://src/components/ui/sonner.tsx)
- [src/hooks/use-toast.ts](file://src/hooks/use-toast.ts)
- [src/components/ui/toaster.tsx](file://src/components/ui/toaster.tsx)
- [src/components/CartDrawer.tsx](file://src/components/CartDrawer.tsx)
- [src/pages/Store.tsx](file://src/pages/Store.tsx)
- [src/components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [src/components/portal/AuthGuard.tsx](file://src/components/portal/AuthGuard.tsx)
- [src/components/portal/PortalSidebar.tsx](file://src/components/portal/PortalSidebar.tsx)
- [src/pages/portal/PortalLogin.tsx](file://src/pages/portal/PortalLogin.tsx)
</cite>

## Update Summary
**Changes Made**
- Enhanced authentication state management with improved useAuth hook featuring synchronous initial state loading from localStorage, proper session restoration, and enhanced error handling
- Added new useAdminRole hook with retry logic for role verification and fallback mechanisms using user metadata
- Improved cart drawer with global state management via cartStore, converting it to a controlled component with isCartOpen state management
- Enhanced cart drawer auto-open functionality after adding items using both `useCartStore.getState().openCart()` and `openCart()` patterns
- Added new cart state management patterns with separate selector functions for better performance
- Enhanced authentication logout functionality with immediate localStorage cleanup, synchronous state clearing, and instant redirect
- Improved user experience during account sign-out by eliminating delays and ensuring immediate state cleanup
- Added background Supabase signOut for complete session termination
- Updated authentication state handling with enhanced error management and AbortController support

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the state management architecture in the Ryland application. The system uses a dual-state approach:
- Local state managed by Zustand for client-side concerns such as the shopping cart and UI state.
- Server state managed by React Query for remote data fetching, caching, and synchronization with Shopify.

It documents cart state management, authentication state handling, and the toast notification system. It also covers state synchronization patterns, data fetching strategies, persistence, performance considerations, debugging, and best practices for scalability.

**Updated** The cart drawer now implements a controlled component pattern with global state management via cartStore, providing enhanced auto-open functionality after adding items. The authentication system now implements a sophisticated dual-session restoration approach combining synchronous localStorage checks with asynchronous Supabase listeners, eliminating blank screen issues during page refreshes. The logout functionality has been enhanced with immediate localStorage cleanup, synchronous state clearing, and instant redirect to provide better user experience during account sign-out. The cart store provides enhanced selector functions for improved performance and fine-grained re-render control. A new useAdminRole hook has been added with retry logic for role verification and fallback mechanisms using user metadata.

## Project Structure
The project is a React + TypeScript application using Vite. State management is implemented primarily in:
- Zustand stores under src/stores/ with enhanced selector functions and controlled component patterns
- Custom hooks under src/hooks/ including the enhanced useAuth hook and new useAdminRole hook
- UI toast components under src/components/ui/
- Shopify integration under src/lib/shopify.ts
- Supabase authentication under src/integrations/supabase/

```mermaid
graph TB
subgraph "UI Layer"
PD["ProductDetail.tsx<br/>+ Auto-open Pattern"]
CD["CartDrawer.tsx<br/>+ Controlled Component"]
SONNER["components/ui/sonner.tsx"]
TOASTER["components/ui/toaster.tsx"]
PS["PortalSidebar.tsx"]
PL["PortalLogin.tsx"]
AG["AuthGuard.tsx"]
END
subgraph "Enhanced State Stores"
CART["stores/cartStore.ts<br/>+ Global State Management<br/>+ isCartOpen Control<br/>+ Separate Selectors"]
AUTH["hooks/useAuth.tsx<br/>+ Dual Session Restoration<br/>+ Enhanced Logout"]
ADMINROLE["hooks/useAdminRole.ts<br/>+ Retry Logic<br/>+ Fallback Mechanisms"]
END
subgraph "External Services"
SUPABASE["@supabase/supabase-js<br/>+ localStorage Sync"]
SHOP["lib/shopify.ts"]
END
PD --> CART
CD --> CART
SONNER --> TOASTER
PS --> AUTH
PL --> AUTH
AG --> AUTH
CART --> SHOP
AUTH --> SUPABASE
ADMINROLE --> SUPABASE
```

**Diagram sources**
- [src/pages/ProductDetail.tsx:210-224](file://src/pages/ProductDetail.tsx#L210-L224)
- [src/components/CartDrawer.tsx:1-215](file://src/components/CartDrawer.tsx#L1-L215)
- [src/components/ui/sonner.tsx:1-27](file://src/components/ui/sonner.tsx#L1-L27)
- [src/components/ui/toaster.tsx:1-24](file://src/components/ui/toaster.tsx#L1-L24)
- [src/stores/cartStore.ts:29-65](file://src/stores/cartStore.ts#L29-L65)
- [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)
- [src/components/portal/PortalSidebar.tsx:41-120](file://src/components/portal/PortalSidebar.tsx#L41-L120)
- [src/pages/portal/PortalLogin.tsx:20-35](file://src/pages/portal/PortalLogin.tsx#L20-L35)
- [src/components/portal/AuthGuard.tsx:10-27](file://src/components/portal/AuthGuard.tsx#L10-L27)

**Section sources**
- [README.md:53-74](file://README.md#L53-L74)
- [package.json:15-95](file://package.json#L15-L95)

## Core Components
- Zustand cart store: Manages cart items, cart ID, checkout URL, loading states, and **enhanced with isCartOpen state management** for controlled cart drawer components. Provides actions to add/update/remove items, synchronize with Shopify, and control cart drawer visibility. **Enhanced** with separate selector functions for improved performance.
- Authentication hook: Implements dual-session restoration using synchronous localStorage checks followed by asynchronous Supabase listeners, with enhanced error handling and AbortController support for affiliate data fetching. **Enhanced** with immediate logout functionality including localStorage cleanup and instant redirect.
- **New** Admin role hook: Implements retry logic for role verification using Supabase RPC calls with fallback mechanisms using user metadata when RPC calls fail.
- Toast system: A lightweight toast manager with a reducer-driven store and UI components for rendering notifications.

Key implementation references:
- Cart store definition and actions: [src/stores/cartStore.ts:23-171](file://src/stores/cartStore.ts#L23-L171)
- Cart synchronization hook: [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- Shopify API wrapper: [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)
- Auth provider and context: [src/hooks/useAuth.tsx:32-176](file://src/hooks/useAuth.tsx#L32-L176)
- Admin role hook: [src/hooks/useAdminRole.ts:5-68](file://src/hooks/useAdminRole.ts#L5-L68)
- Toast manager and UI: [src/hooks/use-toast.ts:1-186](file://src/hooks/use-toast.ts#L1-L186), [src/components/ui/sonner.tsx:1-27](file://src/components/ui/sonner.tsx#L1-L27), [src/components/ui/toaster.tsx:1-24](file://src/components/ui/toaster.tsx#L1-L24)

**Section sources**
- [src/stores/cartStore.ts:1-179](file://src/stores/cartStore.ts#L1-L179)
- [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)
- [src/hooks/useAuth.tsx:1-176](file://src/hooks/useAuth.tsx#L1-L176)
- [src/hooks/useAdminRole.ts:1-69](file://src/hooks/useAdminRole.ts#L1-L69)
- [src/hooks/use-toast.ts:1-186](file://src/hooks/use-toast.ts#L1-L186)
- [src/components/ui/sonner.tsx:1-27](file://src/components/ui/sonner.tsx#L1-L27)
- [src/components/ui/toaster.tsx:1-24](file://src/components/ui/toaster.tsx#L1-L24)

## Architecture Overview
The state architecture separates concerns:
- Local Zustand store for cart and UI state with persistence and **enhanced selector functions** for fine-grained re-render control.
- Server state via Shopify storefront API calls integrated into the cart store.
- Authentication state via Supabase with **dual-session restoration** (localStorage + Supabase listeners) and background affiliate metadata loading.
- **New** Admin role state via a dedicated hook with retry logic and fallback mechanisms.
- Notifications via a custom toast manager with Radix UI primitives and Sonner.

```mermaid
sequenceDiagram
participant UI as "ProductDetail.tsx"
participant Store as "cartStore.ts"
participant Drawer as "CartDrawer.tsx"
participant API as "shopify.ts"
UI->>Store : "addItem()"
Store->>API : "storefrontApiRequest(CART_QUERY, { id })"
API-->>Store : "Cart data"
Store->>Store : "openCart()"
Store-->>Drawer : "isCartOpen = true"
Drawer-->>UI : "Cart drawer opens automatically"
```

**Diagram sources**
- [src/pages/ProductDetail.tsx:210-224](file://src/pages/ProductDetail.tsx#L210-L224)
- [src/stores/cartStore.ts:63](file://src/stores/cartStore.ts#L63)
- [src/components/CartDrawer.tsx:10](file://src/components/CartDrawer.tsx#L10)
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)

## Detailed Component Analysis

### Cart State Management (Zustand) - Enhanced Implementation
The cart store encapsulates:
- Items, cartId, checkoutUrl, isLoading, isSyncing, **isCartOpen**
- Actions: addItem, updateQuantity, removeItem, clearCart, **openCart**, **closeCart**, **setCartOpen**, syncCart, getCheckoutUrl
- Persistence: Uses Zustand persist middleware with localStorage and partialize to persist only relevant fields
- **Enhanced** selector functions for improved performance and fine-grained re-render control

**Updated** The cart store now provides four separate selector functions:
- `useCartItems`: Selects only the items array for components that only need cart contents
- `useCartLoading`: Selects only the isLoading flag for components that need loading state
- `useCartCheckoutUrl`: Selects only the checkoutUrl for components that need checkout functionality
- `useCartActions`: Selects only the action functions for components that need cart manipulation

**Enhanced** Controlled component state management:
- `isCartOpen`: Boolean state for controlling cart drawer visibility
- `openCart()`: Action to set isCartOpen to true
- `closeCart()`: Action to set isCartOpen to false  
- `setCartOpen(open: boolean)`: Action to programmatically control cart drawer state

Implementation highlights:
- addItem handles creation of a new cart, merging with existing items, or adding a new line with enhanced error handling.
- updateQuantity and removeItem delegate to Shopify mutation helpers and update state accordingly with improved empty cart detection.
- syncCart fetches current cart from Shopify and clears local state if empty or missing, with better error handling.
- Loading flags are toggled around async operations to reflect progress in UI.
- Empty cart handling logic ensures proper cleanup when cart becomes empty after item removal.
- **New** Controlled component pattern allows external components to manage cart drawer visibility through global state.

```mermaid
flowchart TD
Start(["addItem(item)"]) --> CheckCart["cartId exists?"]
CheckCart --> |No| Create["createShopifyCart(...)"]
Create --> SetNew["Set cartId, checkoutUrl, items<br/>+ openCart()"]
CheckCart --> |Yes| Exists["variant exists in items?"]
Exists --> |Yes| Merge["updateShopifyCartLine(newQuantity)"]
Merge --> UpdateLocal["Update items quantity"]
Exists --> |No| AddLine["addLineToShopifyCart(...)"]
AddLine --> Append["Append new item to items<br/>+ openCart()"]
SetNew --> End(["Done"])
UpdateLocal --> End
Append --> End
```

**Diagram sources**
- [src/stores/cartStore.ts:73-80](file://src/stores/cartStore.ts#L73-L80)
- [src/stores/cartStore.ts:82-98](file://src/stores/cartStore.ts#L82-L98)

**Section sources**
- [src/stores/cartStore.ts:1-179](file://src/stores/cartStore.ts#L1-L179)
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)

### Enhanced Authentication State Handling (Supabase) - Dual Session Restoration
The AuthProvider implements a sophisticated dual-session restoration approach:
- **Synchronous localStorage restoration**: Immediately attempts to restore session from localStorage before any async operations
- **Asynchronous Supabase listeners**: Falls back to Supabase auth state change listeners for login/logout events
- **Enhanced error handling**: Improved error management with AbortController support for affiliate data fetching
- **Background affiliate loading**: Affiliate metadata is fetched asynchronously after initial session restoration
- **Enhanced logout functionality**: Immediate localStorage cleanup, synchronous state clearing, and instant redirect

**Updated** Key improvements in the authentication system:
- `restoreSessionFromStorage()`: Synchronously searches localStorage for Supabase auth tokens and restores session immediately
- `cancelled` flag: Prevents state updates after component unmounting
- Enhanced `fetchAffiliate()` with AbortController support and graceful error handling
- **Enhanced** `signOut()` function with immediate localStorage cleanup, synchronous state clearing, and instant redirect:
  - Clears Supabase auth tokens from localStorage first (immediate)
  - Sets user, session, and affiliate to null immediately
  - Redirects to `/portal/login` without waiting for Supabase response
  - Calls Supabase signOut in background (fire and forget)
- Improved logging and debugging capabilities throughout the authentication flow

```mermaid
sequenceDiagram
participant UI as "PortalSidebar.tsx"
participant Auth as "useAuth.tsx"
participant Storage as "localStorage"
participant Supabase as "@supabase/supabase-js"
UI->>Auth : "signOut()"
Auth->>Storage : "removeItem(storageKey)"
Auth->>Auth : "setState({ user : null, session : null, affiliate : null })"
Auth->>UI : "window.location.href = '/portal/login'"
Auth->>Supabase : "signOut() (background)"
Supabase-->>Auth : "Response (ignored)"
```

**Diagram sources**
- [src/components/portal/PortalSidebar.tsx:120](file://src/components/portal/PortalSidebar.tsx#L120)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)

**Section sources**
- [src/hooks/useAuth.tsx:1-176](file://src/hooks/useAuth.tsx#L1-L176)

### New Admin Role State Management - Retry Logic and Fallback Mechanisms
The useAdminRole hook implements a robust role verification system:
- **Retry logic**: Attempts role verification up to 2 times with 500ms delays between attempts
- **Fallback mechanisms**: Uses user metadata (user_metadata or app_metadata) as last resort when RPC calls fail
- **Efficient caching**: Tracks checked user IDs to avoid redundant RPC calls
- **Loading state management**: Properly handles loading states during role verification

**Updated** Key features of the admin role hook:
- `checkRole(retries = 2)`: Main verification function with retry logic
- `checkedUserIdRef`: Ref to cache previously verified user IDs
- **Fallback mechanism**: Extracts role from `user.user_metadata?.role || user.app_metadata?.role` when RPC fails
- **Loading optimization**: Returns immediately if auth is still loading or if user hasn't changed

```mermaid
flowchart TD
Start(["useAdminRole()"]) --> CheckAuth["authLoading?"]
CheckAuth --> |Yes| Wait["Return - no user yet"]
CheckAuth --> |No| CheckUser["user exists?"]
CheckUser --> |No| Reset["Set isAdmin=false, isLoading=false"]
CheckUser --> |Yes| CheckCache["Checked this user before?"]
CheckCache --> |Yes| Return["Return cached result"]
CheckCache --> |No| Retry["checkRole() with retries=2"]
Retry --> RPC["RPC has_role() call"]
RPC --> Success{"RPC success?"}
Success --> |Yes| SetAdmin["Set isAdmin=true/false, isLoading=false"]
Success --> |No| Delay["Wait 500ms"] --> RetryAttempt{"More attempts?"}
RetryAttempt --> |Yes| RPC
RetryAttempt --> |No| Fallback["Check user_metadata/app_metadata"]
Fallback --> MetaRole["Extract role from metadata"]
MetaRole --> Finalize["Set isAdmin=metaRole==='admin', isLoading=false"]
SetAdmin --> Cache["Cache user ID"]
Finalize --> Cache
Cache --> End(["Return { isAdmin, isLoading }"])
```

**Diagram sources**
- [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)

**Section sources**
- [src/hooks/useAdminRole.ts:1-69](file://src/hooks/useAdminRole.ts#L1-L69)

### Toast Notification System
The toast system consists of:
- A reducer-driven store in a custom hook that manages an in-memory queue of toasts
- UI components built on Radix UI primitives
- A Sonner-based Toaster for theme-aware rendering

Highlights:
- Single-toast limit enforced by the reducer
- Automatic dismissal timers per toast
- Dismiss-all and dismiss-specific behaviors
- UI renders toasts and viewport

```mermaid
sequenceDiagram
participant Page as "ProductDetail.tsx"
participant ToastHook as "use-toast.ts"
participant UI as "toaster.tsx"
Page->>Page : "handleAddToCart()"
Page->>ToastHook : "toast.success(title, { description })"
ToastHook->>ToastHook : "dispatch({ ADD_TOAST, toast })"
ToastHook-->>UI : "toasts state update"
UI-->>Page : "Render toast with title/description"
```

**Diagram sources**
- [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- [src/hooks/use-toast.ts:137-164](file://src/hooks/use-toast.ts#L137-L164)
- [src/components/ui/toaster.tsx:4-23](file://src/components/ui/toaster.tsx#L4-L23)

**Section sources**
- [src/hooks/use-toast.ts:1-186](file://src/hooks/use-toast.ts#L1-L186)
- [src/components/ui/sonner.tsx:1-27](file://src/components/ui/sonner.tsx#L1-L27)
- [src/components/ui/toaster.tsx:1-24](file://src/components/ui/toaster.tsx#L1-L24)

### State Synchronization Patterns
- Cart synchronization on visibility change: A dedicated hook triggers cart sync when the page becomes visible, ensuring local state reflects server state after potential external edits.
- **Enhanced** Controlled component pattern: Cart drawer is now a controlled component using global state from cartStore for consistent behavior across the application.
- **Enhanced** Dual authentication session restoration: Auth state is immediately restored from localStorage (synchronous) before relying on Supabase listeners (asynchronous).
- **Enhanced** Selector-based component patterns: Components now use specific selector functions to minimize re-renders and improve performance.
- **Enhanced** Logout synchronization: Logout operations now provide immediate state synchronization across the application.
- **New** Admin role state synchronization: Role verification results are cached and reused for the same user to avoid redundant RPC calls.

**Updated** Auto-open functionality patterns:
- **Pattern 1**: Direct state access - `useCartStore.getState().openCart()` for immediate cart opening
- **Pattern 2**: Selector-based access - `openCart()` for cleaner component integration
- Both patterns ensure cart drawer opens automatically after adding items to improve user experience

References:
- Visibility-based sync: [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- Controlled cart drawer: [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
- Auto-open pattern 1: [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- Auto-open pattern 2: [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- Dual session restoration: [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- Enhanced logout: [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- Admin role retry logic: [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)

**Section sources**
- [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
- [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)

### Data Fetching Strategies
- Shopify storefront queries are executed via a wrapper that handles errors and returns structured data.
- Cart sync uses a storefront query to reconcile local state with server state.
- Product detail pages trigger async operations to add items to the cart and show toasts upon completion.
- **Enhanced** Selector functions provide better separation of concerns and improved component performance.
- **Enhanced** Affiliate data fetching with AbortController support for better cleanup and error handling.
- **Enhanced** Logout data fetching with immediate cleanup and background processing.
- **Enhanced** Controlled component data flow through global state management.
- **New** Admin role verification with retry logic and fallback mechanisms for robust role checking.

**Updated** Auto-open functionality implementations:
- **Direct state access pattern**: `useCartStore.getState().openCart()` - immediate cart opening without selector overhead
- **Selector-based pattern**: `openCart()` - cleaner integration with component state management
- Both patterns leverage the global cart store for consistent behavior across different contexts

References:
- Shopify API request and error handling: [src/lib/shopify.ts:54-79](file://src/lib/shopify.ts#L54-L79)
- Cart sync via storefront query: [src/stores/cartStore.ts:155-170](file://src/stores/cartStore.ts#L155-L170)
- Add-to-cart flow with toast: [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- Auto-open pattern 1: [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- Auto-open pattern 2: [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- Enhanced logout: [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- Admin role retry logic: [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)

**Section sources**
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)
- [src/stores/cartStore.ts:155-170](file://src/stores/cartStore.ts#L155-L170)
- [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)

### State Persistence
- Cart persistence: The cart store persists items, cartId, and checkoutUrl to localStorage using Zustand's persist middleware with a partialize function to minimize persisted payload.
- **Enhanced** Authentication persistence: Session restoration now prioritizes localStorage for immediate availability, reducing blank screen issues during page refreshes.
- **Enhanced** Logout persistence: Immediate localStorage cleanup ensures complete session termination across browser sessions.
- **Enhanced** Controlled component persistence: Cart drawer state is maintained globally through the cart store, ensuring consistent behavior across page reloads.
- **New** Admin role caching: Role verification results are cached per user ID to avoid redundant RPC calls.
- No explicit persistence is shown for the auth context beyond the dual-session restoration approach.

References:
- Persist config and partialize: [src/stores/cartStore.ts:172-178](file://src/stores/cartStore.ts#L172-L178)

**Section sources**
- [src/stores/cartStore.ts:172-178](file://src/stores/cartStore.ts#L172-L178)
- [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- [src/hooks/useAdminRole.ts:25-28](file://src/hooks/useAdminRole.ts#L25-L28)

### Practical Examples and Custom Hooks
- Cart sync hook: Demonstrates subscribing to visibility changes and invoking a store action.
  - Reference: [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- Toast usage: Demonstrates calling toast.success with a description and integrating with UI.
  - Reference: [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- Auth provider: Demonstrates context creation, dual-session restoration, subscription to auth events, and background data fetching.
  - Reference: [src/hooks/useAuth.tsx:32-134](file://src/hooks/useAuth.tsx#L32-L134)
- **Enhanced** Selector usage: Components now use specific selector functions for optimal performance.
  - Reference: [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
  - Reference: [src/pages/ProductDetail.tsx:192-194](file://src/pages/ProductDetail.tsx#L192-L194)
- **Enhanced** Controlled component patterns: Cart drawer now uses controlled component pattern with global state management.
  - Reference: [src/components/CartDrawer.tsx:27](file://src/components/CartDrawer.tsx#L27)
- **Enhanced** Auto-open functionality: Demonstrates immediate session termination with localStorage cleanup and instant redirect.
  - Reference: [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
  - Reference: [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
  - Reference: [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- **New** Admin role hook usage: Demonstrates retry logic and fallback mechanisms for role verification.
  - Reference: [src/hooks/useAdminRole.ts:5-68](file://src/hooks/useAdminRole.ts#L5-L68)

**Section sources**
- [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- [src/hooks/useAuth.tsx:32-134](file://src/hooks/useAuth.tsx#L32-L134)
- [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
- [src/pages/ProductDetail.tsx:192-194](file://src/pages/ProductDetail.tsx#L192-L194)
- [src/components/CartDrawer.tsx:27](file://src/components/CartDrawer.tsx#L27)
- [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- [src/hooks/useAdminRole.ts:5-68](file://src/hooks/useAdminRole.ts#L5-L68)

## Dependency Analysis
The state management stack relies on:
- Zustand for local state and persistence with **enhanced selector functions** and **controlled component patterns**
- React Query for server state orchestration (not shown in current files; present in dependencies)
- Supabase for authentication and session management with **dual-session restoration**
- **New** Supabase RPC calls for admin role verification with retry logic
- Shopify storefront API for cart and product data
- Radix UI and Sonner for toast UI

```mermaid
graph LR
ZUSTAND["zustand"] --> CARTSTORE["cartStore.ts<br/>+ Global State Management<br/>+ isCartOpen Control<br/>+ Separate Selectors"]
REACTQUERY["@tanstack/react-query"] -.-> SERVERSTATE["Server state (external)"]
SUPABASE["@supabase/supabase-js<br/>+ Dual Session Restoration<br/>+ Enhanced Logout<br/>+ RPC Role Verification"] --> AUTHHOOK["useAuth.tsx"]
SUPABASE --> ADMINHOOK["useAdminRole.ts<br/>+ Retry Logic<br/>+ Fallback Mechanisms"]
SHOP["lib/shopify.ts"] --> CARTSTORE
RADIX["@radix-ui/react-toast"] --> TOASTUI["toaster.tsx"]
SONNER["sonner"] --> SONNERCOMP["sonner.tsx"]
TOASTUI --> SONNERCOMP
```

**Diagram sources**
- [package.json:45-69](file://package.json#L45-L69)
- [src/stores/cartStore.ts:29-65](file://src/stores/cartStore.ts#L29-L65)
- [src/hooks/useAuth.tsx:1-176](file://src/hooks/useAuth.tsx#L1-L176)
- [src/hooks/useAdminRole.ts:1-69](file://src/hooks/useAdminRole.ts#L1-L69)
- [src/lib/shopify.ts:54-104](file://src/lib/shopify.ts#L54-L104)
- [src/components/ui/toaster.tsx:1-24](file://src/components/ui/toaster.tsx#L1-L24)
- [src/components/ui/sonner.tsx:1-27](file://src/components/ui/sonner.tsx#L1-L27)

**Section sources**
- [package.json:45-69](file://package.json#L45-L69)

## Performance Considerations
- **Enhanced** Minimize re-renders by using separate selector functions that select only necessary slices of state in components.
- **Enhanced** Dual-session restoration eliminates blank screen issues during page refreshes by prioritizing synchronous localStorage checks.
- **Enhanced** Immediate logout functionality provides instant user feedback and reduces perceived latency.
- **Enhanced** Controlled component pattern reduces prop drilling and improves state consistency across components.
- **Enhanced** Auto-open functionality uses both direct state access and selector-based patterns for optimal performance.
- **New** Admin role caching prevents redundant RPC calls by tracking checked user IDs.
- **New** Retry logic in admin role verification balances reliability with performance by limiting retry attempts.
- Use optimistic updates for cart operations and reconcile with server state via sync.
- Debounce or batch frequent updates (e.g., quantity changes) to reduce network calls.
- Keep persisted state minimal (already partially persisted) to reduce storage overhead.
- Avoid blocking UI on long-running background tasks; load affiliate data after initial auth state is ready.
- Use loading flags to prevent duplicate requests during ongoing operations.
- **New** Leverage the new selector functions (useCartItems, useCartLoading, useCartCheckoutUrl, useCartActions) for optimal component performance.
- **New** Empty cart handling logic ensures efficient cleanup when cart becomes empty after item removal.
- **New** Enhanced error handling with AbortController support prevents memory leaks and improves cleanup.
- **New** Background Supabase signOut ensures complete session termination without blocking the UI.
- **New** Controlled component state management ensures consistent cart drawer behavior across the application.
- **New** Fallback mechanisms in admin role verification ensure graceful degradation when RPC calls fail.

## Troubleshooting Guide
Common issues and remedies:
- Cart not syncing after external edits
  - Ensure visibility-based sync is active and cartId is present.
  - Verify storefront query returns expected cart data.
  - References: [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16), [src/stores/cartStore.ts:155-170](file://src/stores/cartStore.ts#L155-L170)
- **Enhanced** Cart drawer not opening automatically after adding items
  - Verify auto-open pattern is implemented correctly (`useCartStore.getState().openCart()` or `openCart()`).
  - Check that cart store is properly initialized and items are being added successfully.
  - Ensure cart drawer is using controlled component pattern with `isCartOpen` state.
  - References: [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223), [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69), [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
- Toasts not appearing
  - Confirm Toaster is rendered and the toast manager is initialized.
  - Verify that toast.success is called with proper arguments.
  - References: [src/components/ui/toaster.tsx:4-23](file://src/components/ui/toaster.tsx#L4-L23), [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- **Enhanced** Authentication state not updating
  - Check dual-session restoration logic and localStorage parsing.
  - Ensure component cancellation flag prevents state updates after unmount.
  - Verify affiliate fetch error handling with AbortController support.
  - References: [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120), [src/hooks/useAuth.tsx:122-142](file://src/hooks/useAuth.tsx#L122-L142)
- **Enhanced** Logout not working properly
  - Verify localStorage cleanup is successful before state clearing.
  - Check that redirect occurs immediately without waiting for Supabase response.
  - Ensure background Supabase signOut doesn't block UI.
  - References: [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- **New** Admin role verification failing
  - Check retry logic and ensure RPC calls are properly configured.
  - Verify fallback mechanism works with user metadata extraction.
  - Ensure user ID caching prevents redundant calls.
  - References: [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)
- Shopify API errors
  - Inspect error handling in the API wrapper and surface user-friendly messages.
  - References: [src/lib/shopify.ts:54-79](file://src/lib/shopify.ts#L54-L79)
- **New** Selector function performance issues
  - Ensure components are using the appropriate selector functions for their needs.
  - Verify that components aren't mixing selector functions incorrectly.
  - References: [src/stores/cartStore.ts:42-52](file://src/stores/cartStore.ts#L42-L52)
- **New** Blank screen issues during page refresh
  - Verify localStorage restoration is working correctly.
  - Check that Supabase listeners are properly unsubscribed.
  - References: [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- **New** Controlled component state inconsistencies
  - Ensure cart drawer is properly bound to `isCartOpen` state from cart store.
  - Verify that `onOpenChange` handler is correctly updating the store state.
  - Check for conflicting state management between local and global components.
  - References: [src/components/CartDrawer.tsx:27](file://src/components/CartDrawer.tsx#L27), [src/stores/cartStore.ts:63-65](file://src/stores/cartStore.ts#L63-L65)

**Section sources**
- [src/hooks/useCartSync.ts:1-16](file://src/hooks/useCartSync.ts#L1-L16)
- [src/stores/cartStore.ts:155-170](file://src/stores/cartStore.ts#L155-L170)
- [src/pages/ProductDetail.tsx:223](file://src/pages/ProductDetail.tsx#L223)
- [src/pages/Store.tsx:69](file://src/pages/Store.tsx#L69)
- [src/components/CartDrawer.tsx:10-12](file://src/components/CartDrawer.tsx#L10-L12)
- [src/components/ui/toaster.tsx:4-23](file://src/components/ui/toaster.tsx#L4-L23)
- [src/pages/ProductDetail.tsx:210-223](file://src/pages/ProductDetail.tsx#L210-L223)
- [src/hooks/useAuth.tsx:71-120](file://src/hooks/useAuth.tsx#L71-L120)
- [src/hooks/useAuth.tsx:155-176](file://src/hooks/useAuth.tsx#L155-L176)
- [src/hooks/useAdminRole.ts:30-62](file://src/hooks/useAdminRole.ts#L30-L62)
- [src/lib/shopify.ts:54-79](file://src/lib/shopify.ts#L54-L79)
- [src/stores/cartStore.ts:42-52](file://src/stores/cartStore.ts#L42-L52)
- [src/components/CartDrawer.tsx:27](file://src/components/CartDrawer.tsx#L27)
- [src/stores/cartStore.ts:63-65](file://src/stores/cartStore.ts#L63-L65)

## Conclusion
Ryland's state management combines Zustand for robust local state and persistence with **enhanced selector functions** for improved performance, **controlled component patterns** for consistent UI behavior, Supabase for **dual-session authentication** with synchronous localStorage restoration, and a custom toast system for user feedback. The cart store integrates with Shopify via targeted mutations and sync operations, while the auth provider ensures responsive UX through immediate session restoration and background data loading.

**Updated** The cart drawer now implements a controlled component pattern with global state management via cartStore, providing enhanced auto-open functionality after adding items through both direct state access and selector-based patterns. The authentication system now provides an enhanced logout experience with immediate localStorage cleanup, synchronous state clearing, and instant redirect to `/portal/login`, eliminating delays and ensuring complete session termination. The logout functionality follows the same pattern as the dual-session restoration approach, prioritizing immediate user feedback and complete state cleanup before performing background cleanup operations.

The new selector functions (useCartItems, useCartLoading, useCartCheckoutUrl, useCartActions) provide fine-grained re-render control and significantly improve component performance. The enhanced authentication system addresses blank screen issues during page refreshes through dual-session restoration, while improved error handling and AbortController support ensure better resource management. The controlled component state management ensures consistent cart drawer behavior across the application, improving user experience and reducing prop drilling complexity.

**New** The addition of the useAdminRole hook with retry logic and fallback mechanisms provides robust admin role verification that balances reliability with performance. The hook implements intelligent caching to avoid redundant RPC calls and gracefully degrades to user metadata when backend services are unavailable, ensuring consistent admin functionality across various network conditions.

Following the recommended patterns and best practices will help maintain scalability and reliability as the application evolves.
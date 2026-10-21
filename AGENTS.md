# Architecture rules
- Inquiry reads use session-scoped React Query keys; database row policies remain the authority for access, allowing reads to start without waiting for an affiliate profile.
- Admin inquiry documents load per opened order, and cached inquiry lists stay visible during refreshes to avoid blocking navigation on unrelated data.
- Inquiry accounts without affiliate profiles use a bounded loading fallback; admins navigate to the guarded admin inquiry route rather than waiting for a partner record they do not need.
- Inquiry submission delivery runs in a separate authenticated function after checkout via EdgeRuntime.waitUntil; per-order checkpoints and leases support admin retries without repeating completed steps or blocking payment navigation.
- Inquiry documents stay in private storage until a provider-documented private contact-upload method is verified; public media or conversation attachment URLs are never substitutes for private document copies.
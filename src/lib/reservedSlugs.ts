// Reserved root paths that cannot be used as affiliate vanity slugs.
// Keep in sync with routes in src/App.tsx.
export const RESERVED_SLUGS = new Set<string>([
  "about",
  "partners",
  "store",
  "product",
  "privacy-policy",
  "terms-of-service",
  "ccpa",
  "tsr-compliance",
  "disclaimers",
  "cookie-policy",
  "contact",
  "funnel",
  "assessment",
  "funding",
  "credit-repair",
  "community",
  "consultation",
  "booking-confirmed",
  "partner-onboarding",
  "opt-in",
  "thank-you",
  "my-orders",
  "download",
  "reset-password",
  "credit-intake",
  "unsubscribe",
  "r",
  "affiliate-referral",
  "affiliate-booking",
  "portal",
  "admin",
  "api",
  "auth",
  "login",
  "signup",
  "register",
  "logout",
  "settings",
  "dashboard",
  "leads",
  "commissions",
  "payouts",
  "reports",
  "events",
  "speaking",
  "resources",
  "blog",
  "support",
  "help",
  "faq",
  "pricing",
  "checkout",
  "cart",
  "search",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export const SLUG_REGEX = /^[a-z][a-z0-9-]{2,29}$/;

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const s = slug.trim().toLowerCase();
  if (!s) return { valid: false, error: "Slug is required" };
  if (s.length < 3) return { valid: false, error: "Must be at least 3 characters" };
  if (s.length > 30) return { valid: false, error: "Must be 30 characters or less" };
  if (!SLUG_REGEX.test(s)) {
    return { valid: false, error: "Use lowercase letters, numbers, and hyphens. Must start with a letter." };
  }
  if (isReservedSlug(s)) return { valid: false, error: "This handle is reserved. Try another." };
  return { valid: true };
}

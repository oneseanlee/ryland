## Partner Signup: Password + First/Last Name

Currently the signup form collects only "Full Name" and no password. The account is created via `create-partner-account` edge function with `email_confirm: true` and a background-generated recovery link — which is why the credentials email isn't reliably arriving. Switching to user-set passwords removes that dependency entirely.

### Changes

**1. `src/components/PartnerSignupForm.tsx`**
- Replace `name` field with two required fields: `first_name`, `last_name`.
- Add required `password` field (min 8 chars) and `confirm_password` field with zod `.refine` match check.
- Update Zod schema, defaults, and the form UI (two-column grid for first/last, stacked password fields).
- Send `first_name`, `last_name`, `password` in the edge function payload (drop `name`).
- Update success-state copy: user is now signed in / can log in immediately with the password they just set (no "check your email for a password link").

**2. `supabase/functions/create-partner-account/index.ts`**
- Accept `first_name`, `last_name`, `password` (validate: non-empty, password ≥ 8 chars, ≤ 72). Keep back-compat parsing of `name` optional to be safe.
- Compose `full_name = "${first_name} ${last_name}"` for the affiliates table and GHL sync.
- Pass `password` into `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, first_name, last_name } })`.
- Remove the background `generateLink({ type: "recovery" })` call — no longer needed since user set their own password.
- Keep GHL sync + `partner_submissions` insert (splitting first/last for GHL is already handled).
- Response unchanged (`{ success, affiliateId }`).

**3. Deploy the edge function** after the code change.

### Notes
- No DB schema change needed (affiliates already stores `full_name`; auth.users stores the password).
- No email needs to be sent on signup anymore — user knows their password because they just typed it. Post-signup they can go straight to `/portal/login`.
- Existing partners are unaffected; they continue using their current reset-flow password.

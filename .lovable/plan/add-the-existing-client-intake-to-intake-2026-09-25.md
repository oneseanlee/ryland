# Add the existing client intake to `/intake`

## What will change
- Add a dedicated `/intake` page that displays the existing Ryland intake application full-screen.
- Preserve the source application's complete workflow, including program selection, personal and business information, required apps, document uploads, review, agreement, validation, and existing links.
- Keep the intake experience free of the main website navigation so clients can focus on completing the application.
- Add `/intake` to the protected list of site paths so it cannot conflict with a partner referral address.
- Keep the current `/credit-intake` page unchanged.

## Technical details
- Embed the secure HTTPS intake application at `https://gene-mission-control-main-production.up.railway.app/intake` in a responsive, full-viewport page. This preserves its existing submission system and sensitive-data controls rather than duplicating SSNs, credentials, uploaded documents, or agreement handling in a second system.
- Add a loading state and a direct “Open intake form” fallback if a browser blocks embedded content.
- Mark the page private from search engines and give it an accessible title.
- Verify desktop and mobile display, the program-selection transition, and that the embedded form loads without browser errors.

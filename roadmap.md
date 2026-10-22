# Inquiry page performance

# Unpaid inquiry cleanup
- [x] Add safe unpaid-order removal controls to inquiry pages and Lead Tracker.
- [x] Remove Timmy Test's four unfinished orders and three empty batches without changing paid orders.
- [x] Ten focused tests passed; signed-in Remove button completed on an authorized Timmy Test order, and both active lists were checked without runtime errors.

- [x] Start affiliate inquiry reads as soon as the session is ready.
- [x] Cache admin inquiry reads and load documents only when an order is opened.
- [x] Reuse inquiry settings and replace repeated record scans with lookups.
- [x] Run focused tests (5 passed), confirm successful compilation, and check both sign-in redirects without runtime errors.
- [x] Measure signed-in admin inquiry navigation: cached sidebar navigation displayed the page in 0.122 seconds.
- [x] Fix the blank affiliate inquiry page for admin accounts without partner profiles.
- [x] Verify signed-in admin inquiry redirect, tabs and sidebar links without runtime errors; 8 regression tests passed and compilation succeeded.

# Inquiry lead delivery
- [x] Implement and deploy submitted inquiry client delivery to GoHighLevel with partner attribution and New Lead placement; admin status and manual retries added.
- [x] Direct document upload to the GoHighLevel "Inquiry Documents" contact field (user accepted open-link risk); 11 tests pass. Real-order upload not yet run.
- [x] Connect #new-inquiry-removal and verify a clearly labeled Slack setup message (Lovable App).
- [x] Verify Slack runtime credentials, read GoHighLevel pipeline stages, and pass 18 regression tests without changing real carts.
- [x] Verify approved Timmy Test submitted-order delivery through the signed-in admin Send / retry button; read back the GHL contact, #1 FUNDING PIPELINE New Lead opportunity, partner note, and Slack notification.
- [x] Test current inquiry delivery to both Slack and GoHighLevel; 10 regression tests passed and existing carts/payment statuses stayed unchanged.
- [x] Partners can attach documents to submitted inquiry orders and My Leads; uploads push to the GoHighLevel contact (not yet tried with a real upload).
- [x] Fixed document upload permission check; removed size/type limits; Lead Tracker split into Leads and Clients (paid inquiry orders) with document uploads.
- [ ] Verify automatic delivery from a fresh checkout and downstream GoHighLevel follow-ups: requires a separately authorized checkout test; this test used manual admin delivery only.
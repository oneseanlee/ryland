# Inquiry page performance
- [x] Start affiliate inquiry reads as soon as the session is ready.
- [x] Cache admin inquiry reads and load documents only when an order is opened.
- [x] Reuse inquiry settings and replace repeated record scans with lookups.
- [x] Run focused tests (5 passed), confirm successful compilation, and check both sign-in redirects without runtime errors.
- [x] Measure signed-in admin inquiry navigation: cached sidebar navigation displayed the page in 0.122 seconds.
- [x] Fix the blank affiliate inquiry page for admin accounts without partner profiles.
- [x] Verify signed-in admin inquiry redirect, tabs and sidebar links without runtime errors; 8 regression tests passed and compilation succeeded.

# Inquiry lead delivery
- [x] Implement and deploy submitted inquiry client delivery to GoHighLevel with partner attribution and New Lead placement; admin status and manual retries added.
- [ ] Copy uploaded documents to GoHighLevel: blocked until GoHighLevel supplies a verified private contact-upload method. Originals stay private; contact notes point authorized staff to the order.
- [x] Connect #new-inquiry-removal and verify a clearly labeled Slack setup message (Lovable App).
- [x] Verify Slack runtime credentials, read GoHighLevel pipeline stages, and pass 18 regression tests without changing real carts.
- [ ] Verify real submitted-order delivery end-to-end: needs an authenticated admin session and permission to deliver a real order or a designated test submission. Automatic downstream GoHighLevel workflow execution remains unverified.
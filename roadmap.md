# Inquiry page performance
- [x] Start affiliate inquiry reads as soon as the session is ready.
- [x] Cache admin inquiry reads and load documents only when an order is opened.
- [x] Reuse inquiry settings and replace repeated record scans with lookups.
- [x] Run focused tests (5 passed), confirm successful compilation, and check both sign-in redirects without runtime errors.
- [x] Measure signed-in admin inquiry navigation: cached sidebar navigation displayed the page in 0.122 seconds.
- [x] Fix the blank affiliate inquiry page for admin accounts without partner profiles.
- [x] Verify signed-in admin inquiry redirect, tabs and sidebar links without runtime errors; 8 regression tests passed and compilation succeeded.
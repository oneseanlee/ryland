
The user wants ideas for cleaner/shorter affiliate referral links instead of `rylandpartners.com/r/BWinner1`. This is a research/ideation question, not an implementation request — but I should present options clearly so they can pick a direction. Let me lay out the realistic options with tradeoffs.

Key constraints to consider:
- Current system: affiliate IDs like `BWinner1` (FirstInitial + LastName + Number) stored in the affiliates table
- Lovable hosting supports custom domains and subdomains via DNS
- Wildcard subdomains (`*.rylandpartners.com`) are NOT supported by Lovable hosting — each subdomain must be added individually in Project Settings → Domains
- A short link service (go.rylandpartners.com/brittany) is much more practical than per-affiliate subdomains

I'll present 4 clear options ranked by ease/scalability.

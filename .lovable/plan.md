# BIMI Logo Asset for rylandpartners.com

Create a BIMI-compliant brand logo and host it at a stable HTTPS URL so a BIMI DNS record can reference it.

## What gets built

1. **`public/bimi/logo.svg`** — a hand-authored "RP" monogram, built to the strict BIMI spec:
   - `version="1.2"` and `baseProfile="tiny-ps"` on the root `<svg>`
   - Square `viewBox="0 0 512 512"`, no `width`/`height` attributes
   - `<title>Ryland Partners</title>` as the first child (required by BIMI)
   - Solid brand background (navy `#003A70`) with the monogram in white/blue `#0060A9` — logo fills the square edge to edge, since mail clients crop to a circle
   - Paths only: no `<script>`, no `<a>`, no external references or embedded raster images, no animation, no CSS classes, no `<foreignObject>`, no `<use>` of remote content
   - Compact, hand-tidied markup so it stays well under the 32KB limit

2. Served at **`https://rylandpartners.com/bimi/logo.svg`** — files in `public/` publish as-is at the root, so no routing changes are needed.

## Verification

- Fetch the published URL and confirm HTTP 200 with `Content-Type: image/svg+xml` over valid HTTPS
- Re-read the file to confirm every Tiny P/S constraint above is met
- Render the SVG to PNG at small sizes (32px, 96px) and visually check the monogram stays legible and centered when circle-cropped

## DNS record you add at GoDaddy

BIMI also requires DMARC at `p=quarantine` or `p=reject` with `pct=100`, plus a VMC (Verified Mark Certificate) for Gmail/Apple to display the logo. Record to publish:

```text
Type:  TXT
Name:  default._bimi
Value: v=BIMI1; l=https://rylandpartners.com/bimi/logo.svg; a=
```

Once you obtain a VMC (from Entrust or DigiCert, requires a registered trademark), the `a=` tag gets the PEM URL, e.g. `a=https://rylandpartners.com/bimi/vmc.pem` — I can host that file the same way when you have it.

## Notes

- I will check your current DMARC record and report whether it already satisfies the BIMI enforcement requirement.
- Without a VMC, Gmail will not show the logo, but the record and asset will be valid and ready.

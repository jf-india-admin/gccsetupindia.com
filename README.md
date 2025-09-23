# GCCSETUPINDIA – Landing Page

A high-converting static landing page offering mid-sized companies an end‑to‑end partner to set up their Global Capability Center (GCC) in India.

## Features
- Light theme inspired by Positivus, fully responsive
- Hero A/B variants with analytics events
- Services, Why Now, Process, Case Studies (NDA-safe), Testimonials
- Contact form (2‑step) with phone country dropdown and HubSpot Forms API
- ROI calculator with live savings estimate
- Sticky CTA bar, SEO meta, JSON‑LD (Organization + FAQ), config-driven IDs

## Project structure
- `index.html` – markup and sections
- `styles.css` – styles and theme tokens
- `script.js` – interactions, analytics wiring, form wizard, ROI calc
- `config.js` – site configuration (IDs/URLs)
- `favicon.svg` – brand favicon

## Local development
```bash
cd "/Users/ashishawasthi/Desktop/FrontEnd App/gcc-app"
python3 -m http.server 8080
# Visit http://localhost:8080
```

## Configuration
Edit `config.js` and set:
- `GA4_ID`: e.g., `G-XXXXXXX`
- `LINKEDIN_PARTNER_ID`: numeric partner id
- `HUBSPOT_PORTAL_ID`: your HubSpot portal id
- `HUBSPOT_FORM_ID`: form id mapped to fields used here
- `CALENDLY_URL`: redirect after successful submit

HubSpot field mappings (adjust in your portal if needed):
- `firstname`, `company`, `email`, `phone`, `country`
- `company_size__c`, `primary_function__c`, `industry`
- `message`

## Deploy on AWS Amplify
1) Connect repo `jf-india-admin/gccsetupindia.com` and select the `main` branch.
2) Build settings: Static web app (no framework). Output dir is repo root.
3) Add custom domain `gccsetupindia.com` when ready.

## Analytics events
- `cta_click`, `form_next`, `form_back`, `form_submit_hubspot`
- `faq_open`, `roi_change`

## Accessibility
- Keyboard navigable FAQ and nav
- Reduced motion for marquee
- Color-contrast friendly palette

## License
Internal use. Content © GCCSETUPINDIA.

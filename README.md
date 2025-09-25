# GCCSETUPINDIA – Landing Page

A high-converting static landing page offering mid-sized companies an end‑to‑end partner to set up their Global Capability Center (GCC) in India.

## Features
- Light theme inspired by Positivus, fully responsive
- Hero A/B variants with analytics events
- For BFSI page with inline expandable service details
- Why Now, Process, Case Studies (NDA-safe), Testimonials
- Contact form (2‑step) on homepage; all CTAs scroll to this form
- ROI calculator with live savings estimate
- Sticky CTA bar, SEO meta, JSON‑LD (Organization + FAQ), config-driven IDs

## Project structure
- `index.html` – homepage (About us, Services, Use Cases, contact form)
- `styles.css` – styles and theme tokens
- `script.js` – interactions, analytics wiring, form wizard, ROI calc
- `config.js` – site configuration (IDs/URLs)
- `favicon.svg` – brand favicon
- `solutions.html` – For BFSI (services overview + detail sections)
- Other standalone pages kept: `bfsi-gcc.html`, `case-studies.html`, `tco-calculator.html`, `project-plan.html`, `checklist.html`, `partner-marketplace.html`, `compliance-hub.html`, `location-comparison.html`
- Removed pages: Why India, Playbooks, Resources, and service detail pages (now inline)

## Local development
```bash
# Option A: simple static server
python3 -m http.server 8080
# Option B: node dev server with /api/send-lead proxy
npm install
npm start
# Visit http://localhost:3000 (or 8080 for python server)
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

## Serverless lead endpoint (Resend)
We include a Lambda handler at `server/send-lead/index.js` (Node 18). Deploy via Amplify Function or API Gateway + Lambda and set env vars:
- `RESEND_API_KEY`
- `TO_EMAIL` (e.g., hello@gccsetupindia.com)
- `FROM_EMAIL` (e.g., leads@gccsetupindia.com)
- `ALLOW_ORIGIN` (optional, e.g., https://gccsetupindia.com)

Set the frontend to use it by updating `config.js` → `LEADS_ENDPOINT`: e.g., `https://your-domain/api/send-lead`.

### Amplify quick steps
1. In Amplify console, add a Function “send-lead” (Node 18). Paste the code from `server/send-lead/index.js`.
2. Add environment variables. Grant basic internet egress (no AWS perms required).
3. Create an API route (HTTP API / API Gateway) to proxy `POST /api/send-lead` to the function.
4. Update `config.js` `LEADS_ENDPOINT` with the API URL and redeploy.

## Navigation
- Header: For BFSI, About us, Services, Use Cases, “Get your free proposal” (scrolls to `#contact` on homepage)
- Footer mirrors the same links
- CTAs across pages point to the homepage form (`/#contact`)

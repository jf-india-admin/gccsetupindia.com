# IndGCC Landing Page

A static landing page offering mid-sized companies an end-to-end partner to set up their Global Capability Center (GCC) in India.

## Run locally

Open `index.html` directly in your browser, or serve the directory:

```bash
# macOS has Python preinstalled
cd "/Users/ashishawasthi/Desktop/FrontEnd App/gcc-app"
python3 -m http.server 8080
# Then visit http://localhost:8080
```

## Configure tracking and integrations
Edit `config.js` and set:
- GA4_ID
- LINKEDIN_PARTNER_ID
- HUBSPOT_PORTAL_ID
- HUBSPOT_FORM_ID
- CALENDLY_URL

## Deploy options
- AWS S3/CloudFront via GitHub Actions (add AWS creds as repo secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`).
- AWS Amplify: connect the repo and pick the `main` branch.

## Notes
- The contact form posts to HubSpot Forms API using the IDs in `config.js`.

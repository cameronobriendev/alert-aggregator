# ClientFlow

See what's breaking in your no-code stack before your clients do. Monitor usage limits AND errors across Zapier, Make.com, Airtable, and Bubble.

## Features

- **Error Detection** - Failed zaps, broken automations, capacity issues, API limits
- **Limit Predictions** - Velocity-based prediction of when you'll hit overages
- **Custom Build Offers** - When errors pile up, see what a custom solution would cost
- **Gmail Integration** - Scans years of email history for alerts
- **Adaptive Refresh** - Learns your login patterns, refreshes before you arrive

## What We Track

### Usage Alerts
| Platform | Sender | Thresholds |
|----------|--------|------------|
| Zapier | contact@zapier.com | 80%, 100%, overage |
| Make.com | *@make.com | 75%, 90%, 100% |
| Airtable | noreply@airtable.com | 80%, 90%, 100% |
| Bubble | via SendGrid | 75%, 100% |

### Error Notifications (with Severity)
| Platform | Error Types |
|----------|-------------|
| Zapier | Auth failed (critical), App deprecation, Zap errors, Turned off (critical), Tasks held (critical), Payment failed |
| Make.com | Connection reauth (critical), Scenario deactivated (critical), Scenario failures, Warnings, Payment failed, Extra ops limit |
| Airtable | Payment failed (critical), API deprecation, Automation failures (critical), API limits, AI credit limit, Email limit |
| Bubble | App offline (critical), Storage alert (critical), CPU alert (critical), Capacity exceeded (critical), Usage spikes, Email rate limit |

## Tech Stack

- Next.js 15 (App Router)
- NextAuth.js (Google OAuth)
- Neon PostgreSQL
- Tailwind CSS v4
- Framer Motion
- Vercel Cron

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/cameronobriendev/alert-aggregator.git
cd alert-aggregator
npm install
```

### 2. Database Setup

Create a Neon database and run the schema:

```bash
psql $DATABASE_URL -f schema.sql
```

### 3. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and enable Gmail API
3. Configure OAuth consent screen (External, add `gmail.readonly` scope)
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URIs:
   - `https://clientflow.dev/api/auth/callback/google`
   - `https://app.clientflow.dev/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)

### 4. Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

NEXTAUTH_URL=https://clientflow.dev
NEXTAUTH_SECRET=your-secret-here

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

CRON_SECRET=your-cron-secret
```

### 5. Run Development Server

```bash
npm run dev
```

## Architecture

```
clientflow.dev          → Landing page (sign in)
app.clientflow.dev      → Dashboard (post-login)
clientflow.dev/demo     → Demo with sample data

/api/auth/[...nextauth] → Google OAuth
/api/scan               → Trigger email scan
/api/alerts             → Get user's alerts & predictions
/api/cron/scan          → Hourly background scan (Vercel Cron)
```

## Prediction Algorithm

Uses velocity-based analysis:
1. Calculate usage velocity from consecutive alerts (% per day)
2. Project days until 100% based on average velocity
3. Confidence rating based on data points (low/medium/high)

## Custom Build Offers

When we detect recurring errors or frequent limit hits, we surface "Outgrowing No-Code?" cards with:
- The specific problem (based on their error patterns)
- Risks of staying on no-code
- Custom solution recommendation
- CTA to book a consultation

## License

MIT

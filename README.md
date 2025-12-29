# ClientFlow

Monitor your no-code platform usage across Zapier, Make.com, Airtable, and Bubble. Predict overages before they happen.

## Features

- **Gmail Integration** - Connect your Gmail to scan for usage alert emails
- **Multi-Platform Support** - Parses alerts from Zapier, Make.com, Airtable, and Bubble
- **Predictive Analytics** - Velocity-based prediction of when you'll hit limits
- **Adaptive Refresh** - Learns your login patterns and refreshes data before you arrive
- **Dark/Light Theme** - Full theme support

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

/api/auth/[...nextauth] → Google OAuth
/api/scan               → Trigger email scan
/api/alerts             → Get user's alerts & predictions
/api/cron/scan          → Hourly background scan (Vercel Cron)
```

## Email Parsing

Parses usage alerts from:

| Platform | Sender | Thresholds |
|----------|--------|------------|
| Zapier | contact@zapier.com | 80%, 100% |
| Make.com | *@make.com | 75%, 90%, 100% |
| Airtable | noreply@airtable.com | 80%, 90%, 100% |
| Bubble | via SendGrid | 75%, 100% |

## Prediction Algorithm

Uses velocity-based analysis:
1. Calculate usage velocity from consecutive alerts (% per day)
2. Project days until 100% based on average velocity
3. Confidence rating based on data points (low/medium/high)

## License

MIT

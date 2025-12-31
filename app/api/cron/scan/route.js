import { NextResponse } from 'next/server'
import { getUsersToRefresh } from '@/lib/db'

// This endpoint is called by Vercel Cron at :55 past every hour
// It triggers DO worker for users whose preferred refresh hour matches the current hour + 1

const DO_WORKER_URL = 'http://143.110.154.10:3010/scan'

export async function GET(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current hour (UTC)
    const currentHour = new Date().getUTCHours()

    // Get users who should be refreshed now
    // Users with preferred_hour = currentHour + 1 (we refresh 5 min before their typical login)
    // Users with no schedule default to 6am MT (13:00 UTC in winter, 12:00 UTC in summer)
    const users = await getUsersToRefresh(currentHour)

    console.log(`[CRON] Hour ${currentHour}: Found ${users.length} users to refresh`)

    const results = []

    for (const user of users) {
      if (!user.gmail_refresh_token) {
        results.push({
          email: user.email,
          status: 'skipped',
          reason: 'No refresh token',
        })
        continue
      }

      try {
        // Trigger DO worker for incremental scan (since last_scan_at)
        const response = await fetch(DO_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            secret: process.env.CRON_SECRET,
            type: 'incremental', // Scan since last_scan_at
          }),
        })

        if (response.ok) {
          results.push({
            email: user.email,
            status: 'triggered',
          })
          console.log(`[CRON] Triggered scan for ${user.email}`)
        } else {
          const error = await response.text()
          results.push({
            email: user.email,
            status: 'error',
            error: error,
          })
          console.error(`[CRON] Failed to trigger scan for ${user.email}: ${error}`)
        }
      } catch (err) {
        results.push({
          email: user.email,
          status: 'error',
          error: err.message,
        })
        console.error(`[CRON] Error triggering scan for ${user.email}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      currentHour,
      usersProcessed: users.length,
      results,
    })
  } catch (error) {
    console.error('[CRON] Scan error:', error)
    return NextResponse.json(
      { error: 'Cron scan failed', details: error.message },
      { status: 500 }
    )
  }
}

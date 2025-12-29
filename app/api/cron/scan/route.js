import { NextResponse } from 'next/server'
import { getUsersToRefresh, updateLastScan } from '@/lib/db'
import { createGmailClient } from '@/lib/gmail'
import { parseEmails, groupByPlatform } from '@/lib/parsers'
import { predictAllPlatforms } from '@/lib/prediction'
import { saveAlert, savePrediction } from '@/lib/db'

// This endpoint is called by Vercel Cron at :55 past every hour
// It scans emails for users whose preferred refresh hour matches the current hour + 1

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

    const results = []

    for (const user of users) {
      if (!user.gmail_refresh_token) {
        results.push({
          userId: user.id,
          status: 'skipped',
          reason: 'No refresh token',
        })
        continue
      }

      try {
        // Create Gmail client with user's refresh token
        const gmail = createGmailClient(user.gmail_refresh_token)

        // Scan for new emails since last scan
        const emails = await gmail.scanAll()

        // Parse emails into alerts
        const parsedAlerts = parseEmails(emails)

        // Save alerts to database
        let savedCount = 0
        for (const alert of parsedAlerts) {
          try {
            await saveAlert({
              userId: user.id,
              platform: alert.platform,
              threshold: alert.threshold,
              emailDate: alert.emailDate,
              emailSubject: alert.emailSubject,
              usageCurrent: alert.usageCurrent,
              usageLimit: alert.usageLimit,
              planName: alert.planName,
              billingCycleStart: alert.billingCycleStart,
              billingCycleEnd: alert.billingCycleEnd,
              rawEmailId: alert.rawEmailId,
            })
            savedCount++
          } catch (err) {
            // Duplicate - skip
          }
        }

        // Update predictions
        const alertsByPlatform = groupByPlatform(parsedAlerts)
        const predictions = predictAllPlatforms(alertsByPlatform)

        for (const [platform, prediction] of Object.entries(predictions)) {
          if (prediction.predictedOverageDate) {
            await savePrediction({
              userId: user.id,
              platform,
              predictedOverageDate: prediction.predictedOverageDate,
              velocityPerDay: prediction.velocityPerDay,
              confidence: prediction.confidence,
              dataPoints: prediction.dataPoints,
            })
          }
        }

        // Update last scan timestamp
        await updateLastScan(user.id)

        results.push({
          userId: user.id,
          status: 'success',
          emailsScanned: emails.length,
          alertsSaved: savedCount,
        })
      } catch (err) {
        results.push({
          userId: user.id,
          status: 'error',
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      currentHour,
      usersProcessed: users.length,
      results,
    })
  } catch (error) {
    console.error('Cron scan error:', error)
    return NextResponse.json(
      { error: 'Cron scan failed', details: error.message },
      { status: 500 }
    )
  }
}

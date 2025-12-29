import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGmailClient } from '@/lib/gmail'
import { parseEmails, groupByPlatform } from '@/lib/parsers'
import { predictAllPlatforms } from '@/lib/prediction'
import {
  getOrCreateUser,
  saveAlert,
  savePrediction,
  updateLastScan,
  trackLogin,
} from '@/lib/db'

export async function POST(request) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user in database
    const user = await getOrCreateUser(
      session.user.email,
      session.user.name,
      session.refreshToken
    )

    // Track this login for adaptive refresh
    await trackLogin(user.id)

    // Create Gmail client
    const gmail = createGmailClient(session.refreshToken)

    // Scan all platforms
    const emails = await gmail.scanAll()

    // Parse emails into alerts
    const parsedAlerts = parseEmails(emails)

    // Save alerts to database
    const savedAlerts = []
    for (const alert of parsedAlerts) {
      try {
        const saved = await saveAlert({
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
        if (saved) savedAlerts.push(saved)
      } catch (err) {
        // Duplicate email ID - skip
        console.log('Skipping duplicate alert:', alert.rawEmailId)
      }
    }

    // Group alerts by platform and generate predictions
    const alertsByPlatform = groupByPlatform(parsedAlerts)
    const predictions = predictAllPlatforms(alertsByPlatform)

    // Save predictions to database
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

    return NextResponse.json({
      success: true,
      emailsScanned: emails.length,
      alertsFound: parsedAlerts.length,
      alertsSaved: savedAlerts.length,
      predictions,
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Scan failed', details: error.message },
      { status: 500 }
    )
  }
}

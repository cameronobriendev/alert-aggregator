import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createGmailClient } from '@/lib/gmail'
import { parseEmailsWithAI } from '@/lib/ai-parser'
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
    console.log(`[SCAN] Found ${emails.length} emails`)

    // Debug: log first few email subjects and from addresses
    emails.slice(0, 5).forEach((e, i) => {
      console.log(`[SCAN] Email ${i}: from="${e.from}", subject="${e.subject?.substring(0, 50)}"`)
    })

    // Parse emails using AI-maintained pattern system
    console.log(`[SCAN] Starting AI pattern parsing...`)
    const parsedAlerts = await parseEmailsWithAI(emails)
    console.log(`[SCAN] AI parsed ${parsedAlerts.length} alerts from ${emails.length} emails`)

    // Count pattern matches vs new patterns created
    const patternStats = {
      matched: parsedAlerts.filter(a => a.patternMatched).length,
      created: parsedAlerts.filter(a => a.patternCreated).length,
      unknown: parsedAlerts.filter(a => a.category === 'unknown').length,
    }
    console.log(`[SCAN] Pattern stats: ${patternStats.matched} matched, ${patternStats.created} new, ${patternStats.unknown} unknown`)

    // Save alerts to database
    const savedAlerts = []
    for (const alert of parsedAlerts) {
      try {
        const saved = await saveAlert({
          userId: user.id,
          platform: alert.platform,
          type: alert.type || 'usage',
          threshold: alert.threshold || null,
          alertType: alert.alertType || null,
          errorType: alert.errorType || null,
          severity: alert.severity || null,
          itemName: alert.itemName || null,
          errorMessage: alert.errorMessage || null,
          emailDate: alert.emailDate,
          emailSubject: alert.emailSubject,
          usageCurrent: alert.usageCurrent || null,
          usageLimit: alert.usageLimit || null,
          planName: alert.planName || null,
          billingCycleStart: alert.billingCycleStart || null,
          billingCycleEnd: alert.billingCycleEnd || null,
          rawEmailId: alert.rawEmailId,
          // New AI-extracted fields
          summary: alert.summary || null,
          category: alert.category || null,
          subcategory: alert.subcategory || null,
        })
        if (saved) savedAlerts.push(saved)
      } catch (err) {
        console.log('Error saving alert:', err.message, alert.rawEmailId)
      }
    }

    // Group alerts by platform for predictions
    const alertsByPlatform = {}
    for (const alert of parsedAlerts) {
      if (!alertsByPlatform[alert.platform]) {
        alertsByPlatform[alert.platform] = []
      }
      alertsByPlatform[alert.platform].push(alert)
    }

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
      patternStats,
      predictions,
      // Debug info
      debug: {
        sampleEmails: emails.slice(0, 5).map(e => ({
          from: e.from,
          subject: e.subject?.substring(0, 60),
        })),
        parsedAlerts: parsedAlerts.slice(0, 5).map(a => ({
          platform: a.platform,
          category: a.category,
          summary: a.summary,
          patternMatched: a.patternMatched || false,
          patternCreated: a.patternCreated || false,
        })),
      }
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Scan failed', details: error.message },
      { status: 500 }
    )
  }
}

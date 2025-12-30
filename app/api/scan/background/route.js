import { NextResponse } from 'next/server'
import { createGmailClient } from '@/lib/gmail'
import { parseEmailsWithAI } from '@/lib/ai-parser'
import { predictAllPlatforms } from '@/lib/prediction'
import {
  getUserByEmail,
  saveAlert,
  savePrediction,
  updateLastScan,
} from '@/lib/db'

// Background scan endpoint - called from OAuth callback
// Bypasses session check, uses stored refresh token
export async function POST(request) {
  try {
    const { email, secret } = await request.json()

    // Validate secret to prevent abuse
    if (secret !== process.env.CRON_SECRET) {
      console.error('[BACKGROUND-SCAN] Invalid secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log(`[BACKGROUND-SCAN] Starting scan for ${email}`)

    // Get user from database
    const user = await getUserByEmail(email)
    if (!user) {
      console.error(`[BACKGROUND-SCAN] User not found: ${email}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.gmail_refresh_token) {
      console.error(`[BACKGROUND-SCAN] No refresh token for: ${email}`)
      return NextResponse.json({ error: 'No refresh token' }, { status: 400 })
    }

    // Create Gmail client using stored refresh token
    const gmail = createGmailClient(user.gmail_refresh_token)

    // Scan all platforms
    const emails = await gmail.scanAll()
    console.log(`[BACKGROUND-SCAN] Found ${emails.length} emails for ${email}`)

    // Parse emails using AI-maintained pattern system
    console.log(`[BACKGROUND-SCAN] Starting AI pattern parsing...`)
    const parsedAlerts = await parseEmailsWithAI(emails)
    console.log(`[BACKGROUND-SCAN] AI parsed ${parsedAlerts.length} alerts`)

    // Count pattern stats
    const patternStats = {
      matched: parsedAlerts.filter(a => a.patternMatched).length,
      created: parsedAlerts.filter(a => a.patternCreated).length,
      unknown: parsedAlerts.filter(a => a.category === 'unknown').length,
    }
    console.log(`[BACKGROUND-SCAN] Pattern stats: ${patternStats.matched} matched, ${patternStats.created} new`)

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
          summary: alert.summary || null,
          category: alert.category || null,
          subcategory: alert.subcategory || null,
        })
        if (saved) savedAlerts.push(saved)
      } catch (err) {
        console.log('[BACKGROUND-SCAN] Error saving alert:', err.message)
      }
    }

    // Generate predictions
    const alertsByPlatform = {}
    for (const alert of parsedAlerts) {
      if (!alertsByPlatform[alert.platform]) {
        alertsByPlatform[alert.platform] = []
      }
      alertsByPlatform[alert.platform].push(alert)
    }

    const predictions = predictAllPlatforms(alertsByPlatform)

    // Save predictions
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

    console.log(`[BACKGROUND-SCAN] Complete for ${email}: ${savedAlerts.length} alerts saved`)

    return NextResponse.json({
      success: true,
      emailsScanned: emails.length,
      alertsFound: parsedAlerts.length,
      alertsSaved: savedAlerts.length,
      patternStats,
    })
  } catch (error) {
    console.error('[BACKGROUND-SCAN] Error:', error.message, error.stack)
    return NextResponse.json(
      { error: 'Background scan failed', details: error.message },
      { status: 500 }
    )
  }
}

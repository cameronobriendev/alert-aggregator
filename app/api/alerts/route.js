import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getUserByEmail,
  getAlertsByUser,
  getPredictionsByUser,
} from '@/lib/db'

export async function GET(request) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({
        alerts: [],
        errors: [],
        predictions: {},
        hasScanned: false,
      })
    }

    // Get all alerts for user
    const rawAlerts = await getAlertsByUser(user.id)

    // Get predictions
    const predictions = await getPredictionsByUser(user.id)

    // Separate errors from usage alerts
    const errors = []
    const usageAlerts = []

    for (const a of rawAlerts) {
      const formatted = {
        id: a.id,
        platform: a.platform,
        type: a.type,
        category: a.category,
        subcategory: a.subcategory,
        severity: a.severity,
        threshold: a.threshold,
        summary: a.summary,
        itemName: a.item_name,
        errorMessage: a.error_message,
        emailDate: a.email_date,
        emailSubject: a.email_subject,
        usageCurrent: a.usage_current,
        usageLimit: a.usage_limit,
        planName: a.plan_name,
      }

      // Categorize by type
      if (a.category === 'error' || a.category === 'warning' || a.severity === 'critical' || a.severity === 'warning') {
        errors.push(formatted)
      } else if (a.category === 'usage_alert' || a.threshold) {
        usageAlerts.push(formatted)
      } else {
        // Info emails go to alerts list
        usageAlerts.push(formatted)
      }
    }

    // Get latest alert for each platform (usage alerts only)
    const latestAlerts = {}
    for (const alert of usageAlerts) {
      if (!latestAlerts[alert.platform] ||
          new Date(alert.emailDate) > new Date(latestAlerts[alert.platform].emailDate)) {
        latestAlerts[alert.platform] = alert
      }
    }

    // Format predictions as object keyed by platform
    const predictionsMap = {}
    for (const pred of predictions) {
      // Calculate days until overage
      const daysUntil = pred.predicted_overage_date
        ? Math.ceil((new Date(pred.predicted_overage_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null

      predictionsMap[pred.platform] = {
        predictedOverageDate: pred.predicted_overage_date,
        velocityPerDay: pred.velocity_per_day,
        confidence: pred.confidence,
        dataPoints: pred.data_points,
        calculatedAt: pred.calculated_at,
        daysUntilOverage: daysUntil,
        lastThreshold: latestAlerts[pred.platform]?.threshold || 50,
      }
    }

    return NextResponse.json({
      alerts: usageAlerts,
      errors: errors.sort((a, b) => new Date(b.emailDate) - new Date(a.emailDate)),
      latestAlerts,
      predictions: predictionsMap,
      hasScanned: !!user.last_scan_at,
      lastScanAt: user.last_scan_at,
      stats: {
        totalAlerts: rawAlerts.length,
        errorCount: errors.length,
        usageAlertCount: usageAlerts.length,
      }
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to get alerts', details: error.message },
      { status: 500 }
    )
  }
}

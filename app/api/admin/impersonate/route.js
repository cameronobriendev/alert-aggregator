import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getUserByEmail,
  getAlertsByUser,
  getPredictionsByUser,
} from '@/lib/db'

const ADMIN_EMAIL = 'cameronobriendev@gmail.com'

export async function GET(request) {
  try {
    // Get session and verify admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get email to impersonate from query params
    const { searchParams } = new URL(request.url)
    const targetEmail = searchParams.get('email')

    if (!targetEmail) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Get target user from database
    const user = await getUserByEmail(targetEmail)
    if (!user) {
      return NextResponse.json({
        alerts: [],
        errors: [],
        predictions: {},
        hasScanned: false,
        targetUser: { email: targetEmail, notFound: true },
      })
    }

    // Get all alerts for user
    const rawAlerts = await getAlertsByUser(user.id)

    // Get predictions
    const predictions = await getPredictionsByUser(user.id)

    // Separate errors from usage alerts (same logic as /api/alerts)
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

      if (a.category === 'error' || a.category === 'warning' || a.severity === 'critical' || a.severity === 'warning') {
        errors.push(formatted)
      } else if (a.category === 'usage_alert' || a.threshold) {
        usageAlerts.push(formatted)
      } else {
        usageAlerts.push(formatted)
      }
    }

    // Get latest alert for each platform
    const latestAlerts = {}
    for (const alert of usageAlerts) {
      if (!latestAlerts[alert.platform] ||
          new Date(alert.emailDate) > new Date(latestAlerts[alert.platform].emailDate)) {
        latestAlerts[alert.platform] = alert
      }
    }

    // Format predictions
    const predictionsMap = {}
    for (const pred of predictions) {
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
      },
      targetUser: {
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        scanStatus: user.scan_status,
      },
    })
  } catch (error) {
    console.error('Admin impersonate error:', error)
    return NextResponse.json(
      { error: 'Failed to get user data', details: error.message },
      { status: 500 }
    )
  }
}

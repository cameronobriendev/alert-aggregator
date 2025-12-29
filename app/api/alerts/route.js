import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getUserByEmail,
  getAlertsByUser,
  getPredictionsByUser,
} from '@/lib/db'
import { groupByPlatform, sortByDate, getLatestAlerts } from '@/lib/parsers'

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
        predictions: [],
        hasScanned: false,
      })
    }

    // Get all alerts for user
    const alerts = await getAlertsByUser(user.id)

    // Get predictions
    const predictions = await getPredictionsByUser(user.id)

    // Group alerts by platform
    const alertsByPlatform = {}
    for (const alert of alerts) {
      if (!alertsByPlatform[alert.platform]) {
        alertsByPlatform[alert.platform] = []
      }
      alertsByPlatform[alert.platform].push(alert)
    }

    // Get latest alert for each platform
    const latestAlerts = {}
    for (const [platform, platformAlerts] of Object.entries(alertsByPlatform)) {
      const sorted = platformAlerts.sort((a, b) =>
        new Date(b.email_date) - new Date(a.email_date)
      )
      latestAlerts[platform] = sorted[0]
    }

    // Format predictions as object keyed by platform
    const predictionsMap = {}
    for (const pred of predictions) {
      predictionsMap[pred.platform] = {
        predictedOverageDate: pred.predicted_overage_date,
        velocityPerDay: pred.velocity_per_day,
        confidence: pred.confidence,
        dataPoints: pred.data_points,
        calculatedAt: pred.calculated_at,
      }
    }

    return NextResponse.json({
      alerts: alerts.map(a => ({
        id: a.id,
        platform: a.platform,
        threshold: a.threshold,
        emailDate: a.email_date,
        emailSubject: a.email_subject,
        usageCurrent: a.usage_current,
        usageLimit: a.usage_limit,
        planName: a.plan_name,
      })),
      alertsByPlatform,
      latestAlerts,
      predictions: predictionsMap,
      hasScanned: !!user.last_scan_at,
      lastScanAt: user.last_scan_at,
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to get alerts', details: error.message },
      { status: 500 }
    )
  }
}

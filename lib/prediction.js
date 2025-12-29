// Prediction engine for calculating overage dates
// Uses velocity-based analysis of historical threshold alerts

// Calculate prediction from a list of alerts for a single platform
export function predictOverage(alerts, currentDate = new Date()) {
  // Sort by date
  const sorted = [...alerts].sort((a, b) =>
    new Date(a.emailDate) - new Date(b.emailDate)
  )

  // Need at least 2 data points to calculate velocity
  if (sorted.length < 2) {
    return {
      confidence: 'low',
      message: 'Need more data points',
      dataPoints: sorted.length,
      predictedOverageDate: null,
      velocityPerDay: null,
    }
  }

  // Calculate velocity between consecutive alerts
  const velocities = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    const daysBetween = (new Date(curr.emailDate) - new Date(prev.emailDate)) / (1000 * 60 * 60 * 24)
    const thresholdChange = curr.threshold - prev.threshold

    // Only count if moving towards 100% (positive velocity)
    if (daysBetween > 0 && thresholdChange > 0) {
      velocities.push(thresholdChange / daysBetween)
    }
  }

  if (velocities.length === 0) {
    return {
      confidence: 'low',
      message: 'Cannot calculate velocity - no consistent progression',
      dataPoints: sorted.length,
      predictedOverageDate: null,
      velocityPerDay: null,
    }
  }

  // Average velocity (% per day)
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length

  // Last known position
  const lastAlert = sorted[sorted.length - 1]
  const remaining = 100 - lastAlert.threshold

  // If already at 100%, overage is now
  if (remaining <= 0) {
    return {
      confidence: velocities.length >= 3 ? 'high' : 'medium',
      message: 'Already at or past limit',
      dataPoints: sorted.length,
      predictedOverageDate: new Date(lastAlert.emailDate),
      velocityPerDay: avgVelocity,
      status: 'overage',
    }
  }

  // Calculate days until overage
  const daysToOverage = remaining / avgVelocity

  // Project date from last alert
  const overageDate = new Date(lastAlert.emailDate)
  overageDate.setDate(overageDate.getDate() + Math.ceil(daysToOverage))

  // Determine confidence based on data points
  let confidence = 'low'
  if (velocities.length >= 5) {
    confidence = 'high'
  } else if (velocities.length >= 3) {
    confidence = 'medium'
  }

  // Determine current status
  let status = 'healthy'
  const daysFromNow = (overageDate - currentDate) / (1000 * 60 * 60 * 24)

  if (daysFromNow <= 0) {
    status = 'overage'
  } else if (daysFromNow <= 7) {
    status = 'critical'
  } else if (daysFromNow <= 14) {
    status = 'warning'
  }

  return {
    confidence,
    message: `Predicted overage in ${Math.ceil(daysFromNow)} days`,
    dataPoints: sorted.length,
    predictedOverageDate: overageDate,
    velocityPerDay: avgVelocity,
    daysUntilOverage: Math.ceil(daysFromNow),
    status,
    lastThreshold: lastAlert.threshold,
    lastAlertDate: lastAlert.emailDate,
  }
}

// Calculate predictions for all platforms
export function predictAllPlatforms(alertsByPlatform) {
  const predictions = {}

  for (const [platform, alerts] of Object.entries(alertsByPlatform)) {
    predictions[platform] = predictOverage(alerts)
  }

  return predictions
}

// Analyze usage trends (increasing, decreasing, stable)
export function analyzeTrend(velocities) {
  if (velocities.length < 3) {
    return 'insufficient_data'
  }

  // Compare recent velocity to earlier velocity
  const midpoint = Math.floor(velocities.length / 2)
  const earlyAvg = velocities.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint
  const lateAvg = velocities.slice(midpoint).reduce((a, b) => a + b, 0) / (velocities.length - midpoint)

  const changeRatio = lateAvg / earlyAvg

  if (changeRatio > 1.2) {
    return 'accelerating' // Usage growing faster
  } else if (changeRatio < 0.8) {
    return 'decelerating' // Usage slowing down
  }
  return 'stable'
}

// Detect if there's a seasonal pattern
export function detectSeasonality(alerts) {
  if (alerts.length < 12) {
    return { seasonal: false, message: 'Need more data for seasonality analysis' }
  }

  // Group by month
  const byMonth = {}
  for (const alert of alerts) {
    const month = new Date(alert.emailDate).getMonth()
    if (!byMonth[month]) {
      byMonth[month] = []
    }
    byMonth[month].push(alert.threshold)
  }

  // Check if certain months have consistently higher thresholds
  const monthAverages = {}
  for (const [month, thresholds] of Object.entries(byMonth)) {
    if (thresholds.length >= 2) {
      monthAverages[month] = thresholds.reduce((a, b) => a + b, 0) / thresholds.length
    }
  }

  const values = Object.values(monthAverages)
  if (values.length < 4) {
    return { seasonal: false, message: 'Not enough monthly data' }
  }

  // Check variance - high variance suggests seasonality
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length

  if (variance > 100) { // Threshold variance > 10% standard deviation
    const peakMonth = Object.entries(monthAverages)
      .sort((a, b) => b[1] - a[1])[0][0]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      seasonal: true,
      peakMonth: monthNames[parseInt(peakMonth)],
      message: `Usage peaks in ${monthNames[parseInt(peakMonth)]}`
    }
  }

  return { seasonal: false, message: 'No seasonal pattern detected' }
}

// Generate recommendation based on prediction
export function generateRecommendation(prediction, platform) {
  if (!prediction.predictedOverageDate) {
    return {
      action: 'monitor',
      message: 'Keep tracking usage as more data becomes available'
    }
  }

  const daysUntil = prediction.daysUntilOverage

  if (daysUntil <= 0) {
    return {
      action: 'urgent',
      message: `You've likely exceeded your ${platform} limit. Consider upgrading or pausing workflows.`
    }
  }

  if (daysUntil <= 7) {
    return {
      action: 'urgent',
      message: `${platform} limit approaching in ${daysUntil} days. Upgrade or reduce usage now.`
    }
  }

  if (daysUntil <= 14) {
    return {
      action: 'plan',
      message: `You'll reach your ${platform} limit in about ${daysUntil} days. Time to plan ahead.`
    }
  }

  if (daysUntil <= 30) {
    return {
      action: 'aware',
      message: `${platform} usage is on track to hit the limit in ${daysUntil} days.`
    }
  }

  return {
    action: 'healthy',
    message: `${platform} usage looks healthy. Limit expected in ${daysUntil}+ days.`
  }
}

// Bubble email parser
// Sender: via SendGrid (*@sendgrid.net or *@bubble.io)
// Alert types: 75% WU warning, 100% WU limit, capacity alerts, spike detection

export function isBubbleEmail(email) {
  const from = email.from?.toLowerCase() || ''
  const body = (email.body || email.snippet || '').toLowerCase()

  // Bubble sends via SendGrid, so check for Bubble signature
  return (from.includes('bubble.io') || from.includes('sendgrid')) &&
         (body.includes('bubble') || body.includes('workload') || body.includes('capacity'))
}

export function parseBubbleEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''

  // Determine alert type and threshold
  let threshold = null
  let alertType = null

  // Check for percentage in body
  const percentMatch = body.match(/(\d+(?:\.\d+)?)\s*%/)
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1])
    if (percent >= 100) {
      threshold = 100
      alertType = 'limit_reached'
    } else if (percent >= 75) {
      threshold = 75
      alertType = 'warning'
    }
  }

  // Check for specific alert types
  if (body.includes('maximum capacity') || body.includes('hit its maximum')) {
    if (!threshold) threshold = 100
    alertType = 'capacity_exceeded'
  } else if (body.includes('spike') || subject.includes('spike')) {
    alertType = 'spike_detection'
    // Spike alerts may not have a threshold, but mark as warning
    if (!threshold) threshold = 75
  } else if (body.includes('workload') && (body.includes('approaching') || body.includes('nearing'))) {
    if (!threshold) threshold = 75
    alertType = 'warning'
  }

  if (!threshold && !alertType) {
    return null // Not a usage alert
  }

  // Extract WU (Workload Units) numbers
  // Pattern: "X WU" or "X workload units"
  const wuMatch = body.match(/([\d,]+)\s*(?:WU|workload\s*unit)/i)
  let usageCurrent = null
  if (wuMatch) {
    usageCurrent = parseInt(wuMatch[1].replace(/,/g, ''))
  }

  // Extract capacity minutes
  // Pattern: "X minutes over the last 24 hours"
  const capacityMatch = body.match(/(\d+)\s*minutes?\s*(?:over\s*the\s*last|in\s*the\s*past)/i)

  // Extract app name
  const appMatch = body.match(/application\s+["']?([^"'\n]+)["']?\s+has/i) ||
                   body.match(/app\s+["']?([^"'\n]+)["']?/i)

  // Extract plan name
  const planMatch = body.match(/\b(Free|Personal|Professional|Production|Dedicated)\s*(?:plan)?/i)
  const planName = planMatch ? planMatch[1] : null

  return {
    platform: 'bubble',
    threshold: threshold || 100,
    alertType: alertType || 'unknown',
    emailDate: email.date,
    emailSubject: subject,
    usageCurrent,
    usageLimit: null, // Bubble doesn't always include limit in emails
    planName,
    billingCycleStart: null,
    billingCycleEnd: null,
    rawEmailId: email.id,
  }
}

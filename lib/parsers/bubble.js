// Bubble email parser
// Sender: via SendGrid (*@sendgrid.net or *@bubble.io)
// Alert types: Usage (75%, 100% WU) + Errors (capacity, offline, storage, CPU, rate limits)

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
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Check for ERROR notifications first
  const errorResult = parseBubbleError(subject, body, email)
  if (errorResult) return errorResult

  // Check for USAGE alerts
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

  if (bodyLower.includes('workload') && (bodyLower.includes('approaching') || bodyLower.includes('nearing'))) {
    if (!threshold) threshold = 75
    alertType = 'warning'
  }

  if (!threshold && !alertType) {
    return null // Not a usage alert or error
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
    type: 'usage',
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

// Parse error notifications (capacity, offline, storage, CPU, rate limits, etc.)
function parseBubbleError(subject, body, email) {
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // App taken offline - CRITICAL (when overages disabled and WU limit hit)
  if (bodyLower.includes('taken offline') || bodyLower.includes('app has been taken offline') ||
      subjectLower.includes('offline')) {
    const appName = extractAppName(body)
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'app_offline',
      severity: 'critical',
      itemName: appName,
      errorMessage: 'App taken offline due to workload limit (overages disabled)',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Database storage alert - CRITICAL (Enterprise, <50GB remaining)
  if (bodyLower.includes('storage') && (bodyLower.includes('less than') || bodyLower.includes('50gb'))) {
    const appName = extractAppName(body)
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'storage_alert',
      severity: 'critical',
      itemName: appName,
      errorMessage: 'Less than 50GB of database storage remaining',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // CPU usage alert - CRITICAL (Enterprise, >70% sustained)
  if (bodyLower.includes('cpu') && (bodyLower.includes('70%') || bodyLower.includes('over 70'))) {
    const appName = extractAppName(body)
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'cpu_alert',
      severity: 'critical',
      itemName: appName,
      errorMessage: 'CPU usage exceeded 70% for sustained periods - server crash risk',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Email rate limit exceeded
  if (bodyLower.includes('email rate limit') || bodyLower.includes('20 email destinations')) {
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'email_rate_limit',
      severity: 'warning',
      itemName: null,
      errorMessage: 'Email rate limit exceeded (20 recipients/day) - install SendGrid key',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Capacity exceeded - CRITICAL (legacy alerts, still sent)
  if (bodyLower.includes('maximum capacity') || bodyLower.includes('hit its maximum') ||
      bodyLower.includes('allocated capacity')) {
    const appName = extractAppName(body)
    const minutes = extractCapacityMinutes(body)
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'capacity_exceeded',
      severity: 'critical',
      itemName: appName,
      errorMessage: minutes ? `App hit maximum capacity for ${minutes} minutes` : 'App hit maximum capacity usage',
      capacityMinutes: minutes,
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Workload spike detected
  if (bodyLower.includes('spike') || subjectLower.includes('spike')) {
    const appName = extractAppName(body)
    return {
      platform: 'bubble',
      type: 'error',
      errorType: 'usage_spike',
      severity: 'warning',
      itemName: appName,
      errorMessage: 'Unusual spike in workload usage detected',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  return null
}

function extractAppName(body) {
  // Pattern: "application 'AppName' has" or "app AppName"
  const match = body.match(/application\s+['""]?([^'""]+?)['""]?\s+has/i) ||
                body.match(/app\s+['""]([^'""]+)['""]/i)
  if (match) return match[1]
  return null
}

function extractCapacityMinutes(body) {
  // Pattern: "for X minutes over the last 24 hours"
  const match = body.match(/(\d+)\s*minutes?\s*(?:over\s*the\s*last|in\s*the\s*past)/i)
  if (match) return parseInt(match[1])
  return null
}

// Zapier email parser
// Sender: contact@zapier.com
// Alert types: Usage (80%, 100%, overage) + Errors (zap failures, turned off)

export function isZapierEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('contact@zapier.com') || from.includes('zapier.com')
}

export function parseZapierEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''

  // Check for ERROR notifications first
  const errorResult = parseZapierError(subject, body, email)
  if (errorResult) return errorResult

  // Determine threshold type for USAGE alerts
  let threshold = null
  let alertType = null

  if (subject.includes('Nearing') || body.includes('80% of your') || body.includes('over 80%')) {
    threshold = 80
    alertType = 'warning'
  } else if (subject.includes('reached your task limit') || body.includes('reached your task limit')) {
    threshold = 100
    alertType = 'limit_reached'
  } else if (subject.includes('above your plan') || body.includes('surpassed your')) {
    threshold = 100
    alertType = 'overage'
  }

  if (!threshold) {
    return null // Not a usage alert or error
  }

  // Extract usage numbers
  // Pattern: "X of Y tasks" or "X/Y tasks"
  const usageMatch = body.match(/([\d,]+)\s*(?:of|\/)\s*([\d,]+)\s*(?:task|zap)/i)
  let usageCurrent = null
  let usageLimit = null

  if (usageMatch) {
    usageCurrent = parseInt(usageMatch[1].replace(/,/g, ''))
    usageLimit = parseInt(usageMatch[2].replace(/,/g, ''))
  }

  // Extract plan name
  const planMatch = body.match(/\b(Free|Starter|Professional|Team|Company|Enterprise)\s*(?:plan)?/i)
  const planName = planMatch ? planMatch[1] : null

  // Extract billing dates
  const datePatterns = [
    /billing\s*(?:cycle|period).*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /resets?\s*(?:on)?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i,
  ]

  let billingCycleEnd = null
  for (const pattern of datePatterns) {
    const match = body.match(pattern)
    if (match) {
      try {
        billingCycleEnd = new Date(match[1])
      } catch (e) {
        // Invalid date, skip
      }
    }
  }

  return {
    platform: 'zapier',
    type: 'usage',
    threshold,
    alertType,
    emailDate: email.date,
    emailSubject: subject,
    usageCurrent,
    usageLimit,
    planName,
    billingCycleStart: null,
    billingCycleEnd,
    rawEmailId: email.id,
  }
}

// Parse error notifications (zap failures, turned off, etc.)
function parseZapierError(subject, body, email) {
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Zap turned off
  if (subjectLower.includes('turned off') || subjectLower.includes('has been paused')) {
    const zapName = extractZapName(subject, body)
    return {
      platform: 'zapier',
      type: 'error',
      errorType: 'zap_turned_off',
      itemName: zapName,
      errorMessage: 'Zap was automatically turned off due to errors',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Zap error / failure
  if (subjectLower.includes('error') || subjectLower.includes('failed') ||
      bodyLower.includes('encountered an error') || bodyLower.includes('action failed')) {
    const zapName = extractZapName(subject, body)
    const errorMsg = extractErrorMessage(body)
    return {
      platform: 'zapier',
      type: 'error',
      errorType: 'zap_error',
      itemName: zapName,
      errorMessage: errorMsg || 'Zap encountered an error during execution',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Held tasks (tasks not executing)
  if (subjectLower.includes('held') || bodyLower.includes('tasks are being held')) {
    return {
      platform: 'zapier',
      type: 'error',
      errorType: 'tasks_held',
      itemName: null,
      errorMessage: 'Tasks are being held due to plan limits',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  return null
}

function extractZapName(subject, body) {
  // Try to extract zap name from subject like "Your Zap 'Order Processing' has..."
  const subjectMatch = subject.match(/(?:zap|workflow)\s*['""]([^'""]+)['""]|['""]([^'""]+)['""]\s*(?:zap|has)/i)
  if (subjectMatch) return subjectMatch[1] || subjectMatch[2]

  // Try body
  const bodyMatch = body.match(/(?:zap|workflow)\s*['""]([^'""]+)['""]/i)
  if (bodyMatch) return bodyMatch[1]

  return null
}

function extractErrorMessage(body) {
  // Try to extract the actual error message
  const errorMatch = body.match(/error[:\s]+([^\n.]+)/i) ||
                     body.match(/failed[:\s]+([^\n.]+)/i) ||
                     body.match(/reason[:\s]+([^\n.]+)/i)
  if (errorMatch) return errorMatch[1].trim().substring(0, 200)
  return null
}

// Make.com email parser (formerly Integromat)
// Sender: *@make.com or *@integromat.com
// Alert types: 75%, 90%, 100% limits
// Note: "operations" renamed to "credits" as of August 2024

export function isMakeEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('@make.com') || from.includes('@integromat.com')
}

export function parseMakeEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''

  // Determine threshold type
  let threshold = null
  let alertType = null

  // Check for percentage in subject or body
  const percentMatch = body.match(/(\d+(?:\.\d+)?)\s*%/)
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1])
    if (percent >= 100) {
      threshold = 100
      alertType = 'limit_reached'
    } else if (percent >= 90) {
      threshold = 90
      alertType = 'critical'
    } else if (percent >= 75) {
      threshold = 75
      alertType = 'warning'
    }
  }

  // Fallback to subject keywords
  if (!threshold) {
    if (subject.includes('reached') || subject.includes('exceeded') || body.includes('paused')) {
      threshold = 100
      alertType = 'limit_reached'
    } else if (subject.includes('approaching') || subject.includes('nearing')) {
      threshold = 75
      alertType = 'warning'
    }
  }

  if (!threshold) {
    return null // Not a usage alert
  }

  // Extract usage numbers
  // Pattern: "4,500/5,000 operations" or "4,500 of 5,000 credits"
  const usageMatch = body.match(/([\d,\.]+)\s*(?:of|\/)\s*([\d,\.]+)\s*(?:operation|credit|ops)/i)
  let usageCurrent = null
  let usageLimit = null

  if (usageMatch) {
    usageCurrent = parseInt(usageMatch[1].replace(/[,\.]/g, ''))
    usageLimit = parseInt(usageMatch[2].replace(/[,\.]/g, ''))
  }

  // Extract plan name
  const planMatch = body.match(/\b(Free|Core|Pro|Teams|Enterprise)\s*(?:plan)?/i)
  const planName = planMatch ? planMatch[1] : null

  // Extract organization name
  const orgMatch = body.match(/organization[:\s]+["']?([^"'\n]+)["']?/i)

  return {
    platform: 'make',
    threshold,
    alertType,
    emailDate: email.date,
    emailSubject: subject,
    usageCurrent,
    usageLimit,
    planName,
    billingCycleStart: null,
    billingCycleEnd: null,
    rawEmailId: email.id,
  }
}

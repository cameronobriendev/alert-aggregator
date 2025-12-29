// Zapier email parser
// Sender: contact@zapier.com
// Alert types: 80% warning, 100% limit reached, overage

export function isZapierEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('contact@zapier.com') || from.includes('zapier.com')
}

export function parseZapierEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''

  // Determine threshold type
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
    return null // Not a usage alert
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

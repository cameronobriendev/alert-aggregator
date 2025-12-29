// Airtable email parser
// Sender: noreply@airtable.com or automation@mail.airtable.com
// Alert types: Automation failures, API limits, email sending limits

export function isAirtableEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('airtable.com')
}

export function parseAirtableEmail(email) {
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
    } else if (percent >= 90) {
      threshold = 90
      alertType = 'critical'
    } else if (percent >= 80) {
      threshold = 80
      alertType = 'warning'
    }
  }

  // Check for specific alert types
  if (subject.includes('failed') || body.includes('automation') && body.includes('failed')) {
    if (!threshold) threshold = 100
    alertType = 'automation_failure'
  } else if (subject.includes('API') || body.includes('API') && body.includes('limit')) {
    if (!threshold) threshold = 100
    alertType = 'api_limit'
  } else if (body.includes('daily limit') || body.includes('sending limit')) {
    if (!threshold) threshold = 100
    alertType = 'email_limit'
  } else if (body.includes('usage') && (body.includes('approaching') || body.includes('nearing'))) {
    if (!threshold) threshold = 80
    alertType = 'warning'
  }

  if (!threshold && !alertType) {
    return null // Not a usage alert
  }

  // Extract usage numbers
  // Pattern: "X of Y" or "X/Y"
  const usageMatch = body.match(/([\d,]+)\s*(?:of|\/)\s*([\d,]+)/)
  let usageCurrent = null
  let usageLimit = null

  if (usageMatch) {
    usageCurrent = parseInt(usageMatch[1].replace(/,/g, ''))
    usageLimit = parseInt(usageMatch[2].replace(/,/g, ''))
  }

  // Extract plan name
  const planMatch = body.match(/\b(Free|Plus|Pro|Enterprise)\s*(?:plan)?/i)
  const planName = planMatch ? planMatch[1] : null

  // Extract automation/base name
  const automationMatch = subject.match(/automation\s+["']?([^"'\n]+)["']?/i) ||
                          body.match(/automation\s+["']?([^"'\n]+)["']?\s+has\s+failed/i)

  return {
    platform: 'airtable',
    threshold: threshold || 100,
    alertType: alertType || 'unknown',
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

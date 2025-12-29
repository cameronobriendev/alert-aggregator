// Airtable email parser
// Sender: noreply@airtable.com or automation@mail.airtable.com
// Alert types: Usage (80%, 90%, 100%) + Errors (automation failures, API limits)

export function isAirtableEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('airtable.com')
}

export function parseAirtableEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Check for ERROR notifications first
  if (subjectLower.includes('failed') || (bodyLower.includes('automation') && bodyLower.includes('failed'))) {
    const automationName = extractAutomationName(subject, body)
    const errorCount = extractErrorCount(body)
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'automation_failure',
      itemName: automationName,
      errorMessage: errorCount ? `Automation failed ${errorCount} times` : 'Automation execution failed',
      errorCount,
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  if (subjectLower.includes('api') && (subjectLower.includes('limit') || bodyLower.includes('limit'))) {
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'api_limit',
      itemName: null,
      errorMessage: 'API billing plan limit exceeded',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

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
    } else if (percent >= 90) {
      threshold = 90
      alertType = 'critical'
    } else if (percent >= 80) {
      threshold = 80
      alertType = 'warning'
    }
  }

  if (bodyLower.includes('daily limit') || bodyLower.includes('sending limit')) {
    if (!threshold) threshold = 100
    alertType = 'email_limit'
  } else if (bodyLower.includes('usage') && (bodyLower.includes('approaching') || bodyLower.includes('nearing'))) {
    if (!threshold) threshold = 80
    alertType = 'warning'
  }

  if (!threshold && !alertType) {
    return null // Not a usage alert or error
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
    type: 'usage',
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

function extractAutomationName(subject, body) {
  // Pattern: "Your automation 'Name' has failed" or "automation Name has failed"
  const match = subject.match(/automation\s+['""]?([^'""]+?)['""]?\s+has\s+failed/i) ||
                body.match(/automation\s+['""]([^'""]+)['""]|automation\s+(\w+(?:\s+\w+)*)\s+(?:has\s+)?failed/i)
  if (match) return match[1] || match[2]
  return null
}

function extractErrorCount(body) {
  // Pattern: "failed X times" or "failed X time"
  const match = body.match(/failed\s+(\d+)\s+times?/i)
  if (match) return parseInt(match[1])
  return null
}

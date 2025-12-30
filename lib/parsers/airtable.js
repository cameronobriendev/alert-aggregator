// Airtable email parser
// Research: /research/03-email-domains-comprehensive.md
// Domains: airtable.com (system), airtableemail.com (automation emails from noreply+automations@airtableemail.com)
// Also: sync.airtable.com (Emailed Data Sync feature)
// Alert thresholds: 80%, 90%, 100% for automations; 75% for AI credits
// Alert types: Usage + Errors (automation failures, API limits, payment, deprecation)

export function isAirtableEmail(email) {
  const from = email.from?.toLowerCase() || ''
  // Match airtable.com (and subdomains like sync.airtable.com)
  // Also match airtableemail.com (automation-generated emails)
  return from.includes('airtable.com') || from.includes('airtableemail.com')
}

export function parseAirtableEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Check for ERROR notifications first
  const errorResult = parseAirtableError(subject, body, email)
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

// Parse error notifications (automation failures, payment, API deprecation, etc.)
function parseAirtableError(subject, body, email) {
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Payment failed - CRITICAL (downgraded to Free after 14 days)
  if (subjectLower.includes('unable to process') || subjectLower.includes('payment') ||
      bodyLower.includes('moved to the airtable free plan') || bodyLower.includes('no longer have access to paid')) {
    return {
      platform: 'airtable',
      type: 'billing',
      errorType: 'payment_failed',
      severity: 'critical',
      itemName: null,
      errorMessage: 'Payment failed - workspace downgraded to Free plan',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // API Key Deprecation - WARNING (action required before deadline)
  if (subjectLower.includes('api key deprecation') || subjectLower.includes('deprecation') ||
      bodyLower.includes('legacy airtable api key') || bodyLower.includes('no longer be able to create')) {
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'api_deprecation',
      severity: 'warning',
      itemName: null,
      errorMessage: 'API key deprecation - migration to new authentication required',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // AI Credit limit warning (75% threshold)
  if (bodyLower.includes('ai credit') && (bodyLower.includes('75%') || bodyLower.includes('exceeds'))) {
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'ai_credit_limit',
      severity: 'warning',
      itemName: null,
      errorMessage: 'AI credit usage exceeded 75% of workspace limit',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Email sending limit warning
  if (bodyLower.includes('email') && (bodyLower.includes('limit') || bodyLower.includes('daily limit'))) {
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'email_limit',
      severity: 'warning',
      itemName: null,
      errorMessage: 'Approaching daily email send limit',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Automation failure - CRITICAL (cannot disable notifications while ON)
  if (subjectLower.includes('failed') || (bodyLower.includes('automation') && bodyLower.includes('failed'))) {
    const automationName = extractAutomationName(subject, body)
    const errorCount = extractErrorCount(body)
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'automation_failure',
      severity: 'critical',
      itemName: automationName,
      errorMessage: errorCount ? `Automation failed ${errorCount} times` : 'Automation execution failed',
      errorCount,
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // API limit exceeded
  if (subjectLower.includes('api') && (subjectLower.includes('limit') || bodyLower.includes('limit'))) {
    return {
      platform: 'airtable',
      type: 'error',
      errorType: 'api_limit',
      severity: 'warning',
      itemName: null,
      errorMessage: 'API billing plan limit exceeded',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  return null
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

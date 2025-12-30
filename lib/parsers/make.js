// Make.com email parser (formerly Integromat)
// Research: /research/03-email-domains-comprehensive.md
// Domains: make.com (+ regional zones: eu1, eu2, us1, us2), integromat.com (legacy), make.celonis.com (enterprise)
// Alert types: Usage (75%, 90%, 100%) + Errors (scenario failures, connection issues, payment)
// Note: "operations" renamed to "credits" as of August 2024

export function isMakeEmail(email) {
  const from = email.from?.toLowerCase() || ''
  const body = (email.body || email.snippet || '').toLowerCase()

  // Match make.com (and all subdomains like us1.make.com, eu1.make.com, eu2.make.com, us2.make.com)
  // Also match integromat.com (legacy) and make.celonis.com (enterprise)
  const fromMake = from.includes('make.com') || from.includes('integromat.com')

  // For forwarded emails (e.g., via Cloudflare Email Routing), check body content
  // Make.com emails contain links to us1.make.com, cdn.make.com, etc.
  const bodyHasMake = body.includes('us1.make.com') ||
                      body.includes('eu1.make.com') ||
                      body.includes('mail1.make.com') ||
                      body.includes('cdn.make.com') ||
                      (body.includes('make.com') && body.includes('scenario'))

  return fromMake || bodyHasMake
}

export function parseMakeEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Check for ERROR notifications first
  const errorResult = parseMakeError(subject, body, email)
  if (errorResult) return errorResult

  // Check for USAGE alerts
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
    if (subjectLower.includes('reached') || subjectLower.includes('exceeded') || bodyLower.includes('paused')) {
      threshold = 100
      alertType = 'limit_reached'
    } else if (subjectLower.includes('approaching') || subjectLower.includes('nearing')) {
      threshold = 75
      alertType = 'warning'
    }
  }

  if (!threshold) {
    return null // Not a usage alert or error
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
    type: 'usage',
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

// Parse error notifications (scenario failures, connection issues, payment, etc.)
function parseMakeError(subject, body, email) {
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Connection reauthorization needed - CRITICAL (scenarios will fail)
  if (bodyLower.includes('failed to verify connection') || bodyLower.includes('invalid refresh token') ||
      bodyLower.includes('please reauthorize') || subjectLower.includes('reauthorize')) {
    const connectionName = extractConnectionName(body)
    return {
      platform: 'make',
      type: 'error',
      errorType: 'connection_reauth',
      severity: 'critical',
      itemName: connectionName,
      errorMessage: 'Connection authentication failed - reauthorization required',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Scenario deactivated/stopped - CRITICAL (automations stopped)
  if (subjectLower.includes('has been stopped') || subjectLower.includes('deactivated') ||
      bodyLower.includes('scenario has been stopped') || bodyLower.includes('disabled due to')) {
    const scenarioName = extractScenarioName(subject, body)
    return {
      platform: 'make',
      type: 'error',
      errorType: 'scenario_deactivated',
      severity: 'critical',
      itemName: scenarioName,
      errorMessage: 'Scenario was automatically stopped due to repeated errors',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Payment failed - CRITICAL (7-day grace period)
  if ((subjectLower.includes('payment') && (subjectLower.includes('failed') || subjectLower.includes('problem'))) ||
      bodyLower.includes('could not be processed') || bodyLower.includes('payment method')) {
    return {
      platform: 'make',
      type: 'billing',
      errorType: 'payment_failed',
      severity: 'critical',
      itemName: null,
      errorMessage: 'Payment failed - 7-day grace period to update payment method',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Extra operations limit reached
  if (bodyLower.includes('limit on extra operations') || bodyLower.includes('auto-purchasing')) {
    return {
      platform: 'make',
      type: 'error',
      errorType: 'extra_ops_limit',
      severity: 'warning',
      itemName: null,
      errorMessage: 'Extra operations auto-purchasing limit reached',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Scenario error / failure
  if (subjectLower.includes('failed') || subjectLower.includes('error') ||
      bodyLower.includes('execution failed') || bodyLower.includes('encountered an error')) {
    const scenarioName = extractScenarioName(subject, body)
    const errorMsg = extractMakeErrorMessage(body)
    return {
      platform: 'make',
      type: 'error',
      errorType: bodyLower.includes('incomplete') ? 'incomplete_execution' : 'scenario_failure',
      severity: 'warning',
      itemName: scenarioName,
      errorMessage: errorMsg || 'Scenario execution failed',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  // Scenario warning (non-fatal issues)
  if (subjectLower.includes('warning') || bodyLower.includes('warning in')) {
    const scenarioName = extractScenarioName(subject, body)
    return {
      platform: 'make',
      type: 'error',
      errorType: 'scenario_warning',
      severity: 'warning',
      itemName: scenarioName,
      errorMessage: 'Scenario encountered a warning - review recommended',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

  return null
}

function extractScenarioName(subject, body) {
  // Pattern: "Scenario 'Order Processing' failed" or scenario name in quotes
  const match = subject.match(/scenario\s+['""]([^'""]+)['""]/i) ||
                body.match(/scenario\s+['""]([^'""]+)['""]/i) ||
                subject.match(/['""]([^'""]+)['""]\s+(?:failed|error)/i)
  if (match) return match[1]
  return null
}

function extractConnectionName(body) {
  // Pattern: "connection 'Google Sheets'" or "'[Name] ([App])'"
  const match = body.match(/connection\s+['""]([^'""]+)['""]/i) ||
                body.match(/['""]([^'""]+)['""]\s+(?:connection|account)/i)
  if (match) return match[1]
  return null
}

function extractMakeErrorMessage(body) {
  // Try to extract the actual error message
  const match = body.match(/error[:\s]+([^\n]+)/i) ||
                body.match(/failed[:\s]+([^\n]+)/i) ||
                body.match(/reason[:\s]+([^\n]+)/i)
  if (match) return match[1].trim().substring(0, 200)
  return null
}

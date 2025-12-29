// Make.com email parser (formerly Integromat)
// Sender: *@make.com or *@integromat.com
// Alert types: Usage (75%, 90%, 100%) + Errors (scenario failures, incomplete executions)
// Note: "operations" renamed to "credits" as of August 2024

export function isMakeEmail(email) {
  const from = email.from?.toLowerCase() || ''
  return from.includes('@make.com') || from.includes('@integromat.com')
}

export function parseMakeEmail(email) {
  const subject = email.subject || ''
  const body = email.body || email.snippet || ''
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Check for ERROR notifications first
  if (subjectLower.includes('failed') || subjectLower.includes('error') ||
      bodyLower.includes('execution failed') || bodyLower.includes('incomplete execution')) {
    const scenarioName = extractScenarioName(subject, body)
    const errorMsg = extractMakeErrorMessage(body)
    return {
      platform: 'make',
      type: 'error',
      errorType: bodyLower.includes('incomplete') ? 'incomplete_execution' : 'scenario_failure',
      itemName: scenarioName,
      errorMessage: errorMsg || 'Scenario execution failed',
      emailDate: email.date,
      emailSubject: subject,
      rawEmailId: email.id,
    }
  }

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

function extractScenarioName(subject, body) {
  // Pattern: "Scenario 'Order Processing' failed" or scenario name in quotes
  const match = subject.match(/scenario\s+['""]([^'""]+)['""]/i) ||
                body.match(/scenario\s+['""]([^'""]+)['""]/i) ||
                subject.match(/['""]([^'""]+)['""]\s+(?:failed|error)/i)
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

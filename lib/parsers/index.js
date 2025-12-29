// Unified email parser
// Routes emails to the correct platform-specific parser

import { isZapierEmail, parseZapierEmail } from './zapier'
import { isMakeEmail, parseMakeEmail } from './make'
import { isAirtableEmail, parseAirtableEmail } from './airtable'
import { isBubbleEmail, parseBubbleEmail } from './bubble'

// Identify which platform an email is from
export function identifyPlatform(email) {
  if (isZapierEmail(email)) return 'zapier'
  if (isMakeEmail(email)) return 'make'
  if (isAirtableEmail(email)) return 'airtable'
  if (isBubbleEmail(email)) return 'bubble'
  return null
}

// Parse a single email
export function parseEmail(email) {
  const platform = identifyPlatform(email)

  switch (platform) {
    case 'zapier':
      return parseZapierEmail(email)
    case 'make':
      return parseMakeEmail(email)
    case 'airtable':
      return parseAirtableEmail(email)
    case 'bubble':
      return parseBubbleEmail(email)
    default:
      return null
  }
}

// Parse multiple emails
export function parseEmails(emails) {
  const results = []

  for (const email of emails) {
    const parsed = parseEmail(email)
    if (parsed) {
      results.push(parsed)
    }
  }

  return results
}

// Group parsed alerts by platform
export function groupByPlatform(alerts) {
  return alerts.reduce((acc, alert) => {
    if (!acc[alert.platform]) {
      acc[alert.platform] = []
    }
    acc[alert.platform].push(alert)
    return acc
  }, {})
}

// Sort alerts by date (newest first)
export function sortByDate(alerts) {
  return [...alerts].sort((a, b) =>
    new Date(b.emailDate) - new Date(a.emailDate)
  )
}

// Get the latest alert for each platform
export function getLatestAlerts(alerts) {
  const byPlatform = groupByPlatform(alerts)
  const latest = {}

  for (const [platform, platformAlerts] of Object.entries(byPlatform)) {
    const sorted = sortByDate(platformAlerts)
    latest[platform] = sorted[0]
  }

  return latest
}

// Export platform-specific functions
export {
  isZapierEmail, parseZapierEmail,
  isMakeEmail, parseMakeEmail,
  isAirtableEmail, parseAirtableEmail,
  isBubbleEmail, parseBubbleEmail,
}

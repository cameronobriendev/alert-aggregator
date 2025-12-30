// AI-Maintained Email Pattern System
// AI creates patterns once, patterns run free forever after
import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import {
  findPatternByHash,
  findPatternsByPlatform,
  savePattern,
  incrementPatternMatch,
} from './db'

// Lazy-load Anthropic client
let _anthropic = null
function getAnthropic() {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

// Detect platform from email content
export function detectPlatform(email) {
  const from = (email.from || '').toLowerCase()
  const body = (email.body || email.snippet || '').toLowerCase()
  const subject = (email.subject || '').toLowerCase()
  const combined = `${from} ${subject} ${body}`

  // Make.com detection (including forwarded emails)
  if (from.includes('make.com') || from.includes('integromat.com') ||
      combined.includes('us1.make.com') || combined.includes('eu1.make.com') ||
      combined.includes('mail1.make.com') || combined.includes('cdn.make.com') ||
      (combined.includes('make.com') && combined.includes('scenario'))) {
    return 'make'
  }

  // Zapier detection
  if (from.includes('zapier.com') || from.includes('zapiermail.com') ||
      combined.includes('zapier.com') && combined.includes('zap')) {
    return 'zapier'
  }

  // Airtable detection
  if (from.includes('airtable.com') || from.includes('airtableemail.com') ||
      combined.includes('airtable.com') && combined.includes('automation')) {
    return 'airtable'
  }

  // Bubble detection
  if (from.includes('bubble.io') || from.includes('bubbleapps.io') ||
      from.includes('bubble.is') || combined.includes('bubble.io')) {
    return 'bubble'
  }

  return 'unknown'
}

// Normalize email content for pattern hashing
// Strip dynamic content: dates, numbers, IDs, names
// Keep structure: key phrases, headings, email type indicators
function normalizeForHash(subject, body) {
  let text = `${subject}\n${body}`.toLowerCase()

  // Replace specific dynamic content with placeholders
  text = text.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]') // dates
  text = text.replace(/\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?/gi, '[TIME]') // times
  text = text.replace(/\d+([,\.]\d+)*%/g, '[PERCENT]') // percentages
  text = text.replace(/\$[\d,\.]+/g, '[MONEY]') // money
  text = text.replace(/\d{4,}/g, '[ID]') // long numbers (IDs)
  text = text.replace(/https?:\/\/[^\s<>"]+/g, '[URL]') // URLs
  text = text.replace(/[\w\.-]+@[\w\.-]+/g, '[EMAIL]') // email addresses

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim()

  // Truncate for consistent hashing (first 500 chars after normalization)
  return text.substring(0, 500)
}

// Create a hash that represents this email's "type"
export function hashEmailPattern(email) {
  const normalized = normalizeForHash(email.subject || '', email.body || email.snippet || '')
  return createHash('md5').update(normalized).digest('hex')
}

// Try to match email against all stored patterns for a platform
async function tryMatchStoredPatterns(email, platform) {
  const patterns = await findPatternsByPlatform(platform)

  for (const pattern of patterns) {
    const detection = typeof pattern.detection_rules === 'string'
      ? JSON.parse(pattern.detection_rules)
      : pattern.detection_rules

    if (matchesDetectionRules(email, detection)) {
      // Pattern matches - apply extraction rules
      await incrementPatternMatch(pattern.pattern_hash)
      return applyExtractionRules(email, pattern)
    }
  }

  return null // No pattern matched
}

// Check if email matches detection rules
function matchesDetectionRules(email, rules) {
  const subject = (email.subject || '').toLowerCase()
  const body = (email.body || email.snippet || '').toLowerCase()

  // Check subject_contains rules
  if (rules.subject_contains) {
    const subjectMatches = rules.subject_contains.every(term =>
      subject.includes(term.toLowerCase())
    )
    if (!subjectMatches) return false
  }

  // Check body_contains rules
  if (rules.body_contains) {
    const bodyMatches = rules.body_contains.every(term =>
      body.includes(term.toLowerCase())
    )
    if (!bodyMatches) return false
  }

  // Check subject_or (any match)
  if (rules.subject_or) {
    const subjectOrMatches = rules.subject_or.some(term =>
      subject.includes(term.toLowerCase())
    )
    if (!subjectOrMatches) return false
  }

  // Check body_or (any match)
  if (rules.body_or) {
    const bodyOrMatches = rules.body_or.some(term =>
      body.includes(term.toLowerCase())
    )
    if (!bodyOrMatches) return false
  }

  return true
}

// Apply extraction rules to get data from email
function applyExtractionRules(email, pattern) {
  const extraction = typeof pattern.extraction_rules === 'string'
    ? JSON.parse(pattern.extraction_rules)
    : pattern.extraction_rules

  const body = email.body || email.snippet || ''
  const subject = email.subject || ''
  const extracted = {}

  for (const [field, rule] of Object.entries(extraction)) {
    if (rule.regex) {
      try {
        const regex = new RegExp(rule.regex, 'i')
        const match = (rule.source === 'subject' ? subject : body).match(regex)
        if (match && match[1]) {
          extracted[field] = match[1].trim()
        }
      } catch (e) {
        console.log(`[AI-PARSER] Regex error for ${field}:`, e.message)
      }
    }
  }

  // Generate summary from template
  let summary = pattern.summary_template || `${pattern.category} from ${pattern.platform}`
  for (const [key, value] of Object.entries(extracted)) {
    summary = summary.replace(`{${key}}`, value || '')
  }
  summary = summary.replace('{platform}', pattern.platform)
  summary = summary.replace('{severity}', pattern.severity || '')
  summary = summary.replace('{category}', pattern.category)

  return {
    platform: pattern.platform,
    type: pattern.category === 'usage_alert' ? 'usage' : pattern.category,
    category: pattern.category,
    subcategory: pattern.subcategory,
    severity: pattern.severity,
    summary: summary.trim(),
    patternHash: pattern.pattern_hash,
    patternMatched: true,
    ...extracted,
  }
}

// AI Classification Prompt
const CLASSIFICATION_PROMPT = `You are analyzing an email from a no-code/automation platform. Your job is to:
1. Classify the email type (usage alert, error, warning, billing, informational)
2. Create reusable detection rules for future similar emails
3. Create extraction rules to pull out key data
4. Extract the data from THIS specific email

Return ONLY valid JSON with this exact structure:
{
  "pattern": {
    "category": "usage_alert|error|warning|billing|info",
    "subcategory": "string describing specific type (e.g., 'scenario_warning', 'limit_80', 'payment_failed')",
    "severity": "critical|warning|info",
    "detection_rules": {
      "subject_contains": ["keywords that MUST be in subject"],
      "body_contains": ["keywords that MUST be in body"],
      "subject_or": ["at least ONE of these in subject (optional)"],
      "body_or": ["at least ONE of these in body (optional)"]
    },
    "extraction_rules": {
      "item_name": {
        "regex": "regex with capturing group",
        "source": "body|subject",
        "description": "what this extracts"
      },
      "error_message": {
        "regex": "regex pattern",
        "source": "body",
        "description": "what this extracts"
      },
      "threshold": {
        "regex": "(\\d+)%",
        "source": "body",
        "description": "usage percentage"
      }
    },
    "summary_template": "Human-readable summary using {field_name} placeholders"
  },
  "extracted": {
    "item_name": "actual value from this email",
    "error_message": "actual error if applicable",
    "threshold": "number if applicable",
    "summary": "human-readable one-liner for this specific email"
  }
}

Categories:
- usage_alert: Hitting usage limits (80%, 90%, 100% of quota)
- error: Something failed (scenario error, zap failed, automation error)
- warning: Non-fatal issues needing attention
- billing: Payment issues, subscription changes
- info: General notifications, not actionable

For detection_rules, be specific enough to match THIS type of email but general enough to match future similar emails.
For extraction_rules, create regex patterns that will work on future similar emails.

IMPORTANT: The summary should be SHORT (under 60 chars) and human-readable. Example: "Make scenario 'Order Sync' failed" or "Zapier at 85% of monthly tasks"`

// Call AI to classify email and create pattern
async function classifyWithAI(platform, email) {
  const anthropic = getAnthropic()

  const prompt = `${CLASSIFICATION_PROMPT}

Platform: ${platform}
Subject: ${email.subject || '(no subject)'}
Body (first 2000 chars):
${(email.body || email.snippet || '').substring(0, 2000)}

Return ONLY the JSON, no markdown, no explanation.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Sonnet for better pattern creation
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text from response
    const content = response.content[0].text

    // Parse JSON - Claude might wrap in markdown, strip it
    let jsonStr = content.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }

    return JSON.parse(jsonStr.trim())
  } catch (error) {
    console.error('[AI-PARSER] Anthropic error:', error.message)
    throw error
  }
}

// Main parse function - the entry point
export async function parseEmailWithAI(email) {
  const emailId = email.id?.substring(0, 8) || 'unknown'

  // 1. Detect platform
  const platform = detectPlatform(email)
  console.log(`[AI-PARSER] [${emailId}] Platform detected: ${platform}, from: ${email.from?.substring(0, 50)}, subject: ${email.subject?.substring(0, 40)}`)

  if (platform === 'unknown') {
    console.log(`[AI-PARSER] [${emailId}] Skipping - unknown platform`)
    return null // Not from a platform we care about
  }

  // 2. Generate pattern hash for this email
  const patternHash = hashEmailPattern(email)
  console.log(`[AI-PARSER] [${emailId}] Pattern hash: ${patternHash}`)

  // 3. Check if we have an exact pattern match by hash
  const existingPattern = await findPatternByHash(patternHash)
  if (existingPattern) {
    console.log(`[AI-PARSER] [${emailId}] CACHE HIT - exact pattern match, category: ${existingPattern.category}`)
    await incrementPatternMatch(patternHash)
    const result = applyExtractionRules(email, existingPattern)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${result.summary}`)
    return result
  }

  // 4. Try to match against stored patterns for this platform
  const patternMatch = await tryMatchStoredPatterns(email, platform)
  if (patternMatch) {
    console.log(`[AI-PARSER] [${emailId}] CACHE HIT - detection rule match, category: ${patternMatch.category}`)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${patternMatch.summary}`)
    return patternMatch
  }

  // 5. No pattern match - use AI to create a new pattern
  console.log(`[AI-PARSER] [${emailId}] CACHE MISS - calling Claude Sonnet for ${platform}`)
  try {
    const aiResult = await classifyWithAI(platform, email)
    console.log(`[AI-PARSER] [${emailId}] Claude response:`, JSON.stringify(aiResult, null, 2))

    // 6. Save the new pattern
    await savePattern({
      patternHash,
      platform,
      category: aiResult.pattern.category,
      subcategory: aiResult.pattern.subcategory,
      severity: aiResult.pattern.severity,
      detectionRules: aiResult.pattern.detection_rules,
      extractionRules: aiResult.pattern.extraction_rules,
      summaryTemplate: aiResult.pattern.summary_template,
      exampleSubject: email.subject?.substring(0, 200),
      exampleBodySnippet: (email.body || email.snippet || '').substring(0, 500),
    })

    console.log(`[AI-PARSER] [${emailId}] NEW PATTERN CREATED: ${aiResult.pattern.category}/${aiResult.pattern.subcategory}`)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${aiResult.extracted.summary}`)

    // 7. Return extracted data
    return {
      platform,
      type: aiResult.pattern.category === 'usage_alert' ? 'usage' : aiResult.pattern.category,
      category: aiResult.pattern.category,
      subcategory: aiResult.pattern.subcategory,
      severity: aiResult.pattern.severity,
      summary: aiResult.extracted.summary,
      itemName: aiResult.extracted.item_name,
      errorMessage: aiResult.extracted.error_message,
      threshold: aiResult.extracted.threshold ? parseInt(aiResult.extracted.threshold) : null,
      patternHash,
      patternCreated: true,
    }
  } catch (error) {
    console.error(`[AI-PARSER] [${emailId}] ERROR:`, error.message, error.stack)
    // Return basic info even if AI fails
    return {
      platform,
      type: 'unknown',
      category: 'unknown',
      summary: `Unclassified ${platform} email`,
      error: error.message,
    }
  }
}

// Parse multiple emails (batch processing)
export async function parseEmailsWithAI(emails) {
  const results = []

  for (const email of emails) {
    try {
      const result = await parseEmailWithAI(email)
      if (result) {
        results.push({
          ...result,
          emailDate: email.date,
          emailSubject: email.subject,
          rawEmailId: email.id,
        })
      }
    } catch (error) {
      console.error(`[AI-PARSER] Error parsing email ${email.id}:`, error.message)
    }
  }

  return results
}

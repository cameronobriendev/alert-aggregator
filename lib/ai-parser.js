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
// This is intentionally BROAD - AI will determine actual relevance
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
  const from = (email.from || '').toLowerCase()
  const subject = (email.subject || '').toLowerCase()
  const body = (email.body || email.snippet || '').toLowerCase()

  // Check sender_contains rules (for not_relevant pattern matching)
  if (rules.sender_contains && rules.sender_contains.length > 0) {
    const senderMatches = rules.sender_contains.some(term =>
      from.includes(term.toLowerCase())
    )
    if (!senderMatches) return false
  }

  // Check subject_contains rules
  if (rules.subject_contains && rules.subject_contains.length > 0) {
    const subjectMatches = rules.subject_contains.every(term =>
      subject.includes(term.toLowerCase())
    )
    if (!subjectMatches) return false
  }

  // Check body_contains rules
  if (rules.body_contains && rules.body_contains.length > 0) {
    const bodyMatches = rules.body_contains.every(term =>
      body.includes(term.toLowerCase())
    )
    if (!bodyMatches) return false
  }

  // Check subject_or (any match)
  if (rules.subject_or && rules.subject_or.length > 0) {
    const subjectOrMatches = rules.subject_or.some(term =>
      subject.includes(term.toLowerCase())
    )
    if (!subjectOrMatches) return false
  }

  // Check body_or (any match)
  if (rules.body_or && rules.body_or.length > 0) {
    const bodyOrMatches = rules.body_or.some(term =>
      body.includes(term.toLowerCase())
    )
    if (!bodyOrMatches) return false
  }

  return true
}

// Check if email matches a known "not_relevant" pattern
// This lets us skip noise emails without calling AI
async function isKnownIrrelevant(email, platform) {
  const patterns = await findPatternsByPlatform(platform)

  for (const pattern of patterns) {
    // Only check not_relevant patterns
    if (pattern.category !== 'not_relevant') continue

    const detection = typeof pattern.detection_rules === 'string'
      ? JSON.parse(pattern.detection_rules)
      : pattern.detection_rules

    if (matchesDetectionRules(email, detection)) {
      await incrementPatternMatch(pattern.pattern_hash)
      console.log(`[AI-PARSER] LEARNED SKIP - known irrelevant: ${pattern.subcategory} (matched ${pattern.match_count + 1} times)`)
      return true
    }
  }

  return false
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
const CLASSIFICATION_PROMPT = `You are analyzing an email that MIGHT be from a no-code/automation platform. Your job is to:
1. FIRST: Determine if this email is actually FROM the platform (relevant) or just MENTIONS it (not relevant)
2. If relevant: Classify the email type and create extraction patterns
3. If not relevant: Mark as not_relevant so we skip similar emails in the future

Return ONLY valid JSON with this exact structure:
{
  "pattern": {
    "category": "usage_alert|error|warning|billing|info|not_relevant",
    "subcategory": "string describing specific type (e.g., 'scenario_warning', 'limit_80', 'job_alert', 'newsletter')",
    "severity": "critical|warning|info|null",
    "detection_rules": {
      "sender_contains": ["keywords in sender email (for not_relevant, helps filter future emails)"],
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
    "summary_template": "Human-readable summary using {field_name} placeholders",
    "reason": "Why this was classified this way (especially important for not_relevant)"
  },
  "extracted": {
    "item_name": "actual value from this email",
    "error_message": "actual error if applicable",
    "threshold": "number if applicable",
    "summary": "human-readable one-liner for this specific email"
  }
}

Categories - BE STRICT, we only want actionable alerts:
- usage_alert: Hitting usage limits (80%, 90%, 100% of quota)
- error: Something FAILED (scenario error, zap failed, automation error, execution failed)
- warning: Specific issues needing attention (deprecated feature, breaking change)
- billing: Payment FAILED, subscription ending, overdue invoice
- not_relevant: EVERYTHING ELSE - this is the default for most emails

CRITICAL - Mark as "not_relevant" if ANY of these apply:
- Marketing emails (promotions, new features, announcements)
- Onboarding emails (welcome, verification, getting started)
- Community emails (newsletters, digests, support community updates)
- Invitations (invited to org, invited to collaborate)
- Informational (API token created, settings changed, general notifications)
- Success confirmations (scenario ran successfully, export complete)
- Job listings mentioning platforms
- Any email that doesn't indicate a PROBLEM or UPCOMING PROBLEM

We ONLY want emails that tell the user:
1. Something broke or failed
2. They're running out of quota
3. They're about to be charged unexpectedly
4. Something requires immediate action to prevent issues

Examples of not_relevant (even if FROM the platform):
- "Welcome to Make!" → not_relevant (onboarding)
- "Check out our new AI features" → not_relevant (marketing)
- "50,000+ community members" → not_relevant (newsletter)
- "You've been invited to join..." → not_relevant (invitation)
- "Email verification required" → not_relevant (onboarding)
- "Your API token was created" → not_relevant (informational)
- "Resource toolkit ready" → not_relevant (onboarding)

Examples of RELEVANT alerts:
- "Your scenario failed" → error
- "You've used 80% of operations" → usage_alert
- "Payment failed" → billing
- "Scenario has warnings" → warning

For detection_rules:
- Include sender_contains for sender matching
- Include subject keywords that identify the email type
- Be specific so we can skip similar emails without AI next time

IMPORTANT: The summary should be SHORT (under 60 chars) and human-readable.`

// Call AI to classify email and create pattern
async function classifyWithAI(platform, email) {
  const anthropic = getAnthropic()

  const prompt = `${CLASSIFICATION_PROMPT}

Platform (detected as): ${platform}
Sender: ${email.from || '(unknown sender)'}
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

  // 1. Detect platform (broad detection - AI will determine actual relevance)
  const platform = detectPlatform(email)
  console.log(`[AI-PARSER] [${emailId}] Platform detected: ${platform}, from: ${email.from?.substring(0, 50)}, subject: ${email.subject?.substring(0, 40)}`)

  if (platform === 'unknown') {
    console.log(`[AI-PARSER] [${emailId}] Skipping - no platform keywords found`)
    return null
  }

  // 2. Check if this matches a known "not_relevant" pattern (learned noise)
  // This is FREE - no AI call needed for previously identified noise
  if (await isKnownIrrelevant(email, platform)) {
    console.log(`[AI-PARSER] [${emailId}] Skipping - matches learned noise pattern`)
    return null
  }

  // 3. Generate pattern hash for this email
  const patternHash = hashEmailPattern(email)
  console.log(`[AI-PARSER] [${emailId}] Pattern hash: ${patternHash}`)

  // 4. Check if we have an exact pattern match by hash
  const existingPattern = await findPatternByHash(patternHash)
  if (existingPattern) {
    // If this exact pattern was marked as not_relevant, skip it
    if (existingPattern.category === 'not_relevant') {
      console.log(`[AI-PARSER] [${emailId}] CACHE HIT - exact match is not_relevant, skipping`)
      await incrementPatternMatch(patternHash)
      return null
    }

    console.log(`[AI-PARSER] [${emailId}] CACHE HIT - exact pattern match, category: ${existingPattern.category}`)
    await incrementPatternMatch(patternHash)
    const result = applyExtractionRules(email, existingPattern)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${result.summary}`)
    return result
  }

  // 5. Try to match against stored patterns for this platform (excluding not_relevant which was checked above)
  const patternMatch = await tryMatchStoredPatterns(email, platform)
  if (patternMatch) {
    // tryMatchStoredPatterns already excludes not_relevant in applyExtractionRules
    if (patternMatch.category === 'not_relevant') {
      console.log(`[AI-PARSER] [${emailId}] Pattern match is not_relevant, skipping`)
      return null
    }
    console.log(`[AI-PARSER] [${emailId}] CACHE HIT - detection rule match, category: ${patternMatch.category}`)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${patternMatch.summary}`)
    return patternMatch
  }

  // 6. No pattern match - use AI to classify and create a new pattern
  console.log(`[AI-PARSER] [${emailId}] CACHE MISS - calling Claude Sonnet for ${platform}`)
  try {
    const aiResult = await classifyWithAI(platform, email)
    console.log(`[AI-PARSER] [${emailId}] Claude response:`, JSON.stringify(aiResult, null, 2))

    // 7. ALWAYS save the pattern (even for not_relevant - this is how we learn!)
    await savePattern({
      patternHash,
      platform,
      category: aiResult.pattern.category,
      subcategory: aiResult.pattern.subcategory,
      severity: aiResult.pattern.severity,
      detectionRules: aiResult.pattern.detection_rules,
      extractionRules: aiResult.pattern.extraction_rules || {},
      summaryTemplate: aiResult.pattern.summary_template,
      exampleSubject: email.subject?.substring(0, 200),
      exampleBodySnippet: (email.body || email.snippet || '').substring(0, 500),
    })

    // 8. If AI says not_relevant, we've learned this pattern - don't create alert
    if (aiResult.pattern.category === 'not_relevant') {
      console.log(`[AI-PARSER] [${emailId}] LEARNED: "${email.from}" emails are not_relevant (${aiResult.pattern.subcategory})`)
      console.log(`[AI-PARSER] [${emailId}] Reason: ${aiResult.pattern.reason || 'Not from platform'}`)
      console.log(`[AI-PARSER] [${emailId}] Future similar emails will be skipped automatically (FREE)`)
      return null
    }

    console.log(`[AI-PARSER] [${emailId}] NEW PATTERN CREATED: ${aiResult.pattern.category}/${aiResult.pattern.subcategory}`)
    console.log(`[AI-PARSER] [${emailId}] Extracted summary: ${aiResult.extracted?.summary}`)

    // 9. Return extracted data for relevant emails
    return {
      platform,
      type: aiResult.pattern.category === 'usage_alert' ? 'usage' : aiResult.pattern.category,
      category: aiResult.pattern.category,
      subcategory: aiResult.pattern.subcategory,
      severity: aiResult.pattern.severity,
      summary: aiResult.extracted?.summary || `${aiResult.pattern.category} from ${platform}`,
      itemName: aiResult.extracted?.item_name,
      errorMessage: aiResult.extracted?.error_message,
      threshold: aiResult.extracted?.threshold ? parseInt(aiResult.extracted.threshold) : null,
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

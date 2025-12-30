// Gmail API client for fetching usage alert emails

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

// Platform-specific search patterns
// Note: Gmail from: doesn't work with forwarded emails (e.g., Cloudflare Email Routing rewrites sender)
// Solution: Also search for platform domains in email content/headers
// Research: /research/03-email-domains-comprehensive.md
const PLATFORM_PATTERNS = {
  // Zapier: search from: OR content containing zapier.com
  zapier: 'from:zapier.com OR from:zapiermail.com OR zapier.com',

  // Make.com: search from: OR content (handles Cloudflare forwarding)
  // Forwarded emails have make.com in DKIM headers and body links
  make: 'from:make.com OR from:integromat.com OR us1.make.com OR eu1.make.com OR mail1.make.com',

  // Airtable: search from: OR content
  airtable: 'from:airtable.com OR from:airtableemail.com OR airtable.com',

  // Bubble: search from: OR content
  bubble: 'from:bubble.io OR from:bubbleapps.io OR from:bubble.is OR bubble.io',
}

// Platform-specific search queries (with date filter)
export const PLATFORM_QUERIES = {
  zapier: `(${PLATFORM_PATTERNS.zapier}) newer_than:3y`,
  make: `(${PLATFORM_PATTERNS.make}) newer_than:3y`,
  airtable: `(${PLATFORM_PATTERNS.airtable}) newer_than:3y`,
  bubble: `(${PLATFORM_PATTERNS.bubble}) newer_than:3y`,
}

// Combined query for all platforms - single date filter at end
export const ALL_PLATFORMS_QUERY = `(${Object.values(PLATFORM_PATTERNS).map(d => `(${d})`).join(' OR ')}) newer_than:3y`

// Refresh access token using refresh token
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

// Search for emails matching a query
export async function searchEmails(accessToken, query, maxResults = 100) {
  const messages = []
  let pageToken = null

  do {
    const url = new URL(`${GMAIL_API_BASE}/messages`)
    url.searchParams.set('q', query)
    url.searchParams.set('maxResults', Math.min(maxResults - messages.length, 100))
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to search emails')
    }

    const data = await response.json()
    if (data.messages) {
      messages.push(...data.messages)
    }
    pageToken = data.nextPageToken
  } while (pageToken && messages.length < maxResults)

  return messages
}

// Fetch a single email's full content
export async function fetchEmail(accessToken, messageId) {
  const response = await fetch(`${GMAIL_API_BASE}/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch email')
  }

  const data = await response.json()
  return parseEmailData(data)
}

// Parse Gmail API message format into usable structure
function parseEmailData(message) {
  const headers = message.payload?.headers || []
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value

  // Get email body
  let body = ''
  if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  } else if (message.payload?.parts) {
    // Multipart message - find text/plain or text/html part
    const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain')
    const htmlPart = message.payload.parts.find(p => p.mimeType === 'text/html')
    const part = textPart || htmlPart
    if (part?.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8')
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    date: new Date(parseInt(message.internalDate)),
    from: getHeader('From'),
    subject: getHeader('Subject'),
    body: body,
    snippet: message.snippet,
  }
}

// Batch fetch multiple emails (more efficient)
export async function fetchEmails(accessToken, messageIds, onProgress = null) {
  const emails = []
  const batchSize = 10 // Fetch 10 at a time to avoid rate limits

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(id => fetchEmail(accessToken, id).catch(err => {
        console.error(`Failed to fetch email ${id}:`, err)
        return null
      }))
    )
    emails.push(...batchResults.filter(Boolean))

    if (onProgress) {
      onProgress(Math.min(i + batchSize, messageIds.length), messageIds.length)
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < messageIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return emails
}

// Main function to scan for platform usage emails
export async function scanForUsageEmails(accessToken, platform = null) {
  const query = platform ? PLATFORM_QUERIES[platform] : ALL_PLATFORMS_QUERY

  // Search for matching emails
  const messageList = await searchEmails(accessToken, query)

  if (!messageList.length) {
    return []
  }

  // Fetch full content of each email
  const emails = await fetchEmails(
    accessToken,
    messageList.map(m => m.id)
  )

  return emails
}

// Create Gmail API client with auto-refresh
export function createGmailClient(refreshToken) {
  let accessToken = null
  let tokenExpiry = 0

  const ensureToken = async () => {
    if (!accessToken || Date.now() >= tokenExpiry) {
      accessToken = await refreshAccessToken(refreshToken)
      tokenExpiry = Date.now() + 3500 * 1000 // Tokens last 1 hour, refresh at 58 min
    }
    return accessToken
  }

  return {
    search: async (query, maxResults) => {
      const token = await ensureToken()
      return searchEmails(token, query, maxResults)
    },
    fetch: async (messageId) => {
      const token = await ensureToken()
      return fetchEmail(token, messageId)
    },
    fetchBatch: async (messageIds, onProgress) => {
      const token = await ensureToken()
      return fetchEmails(token, messageIds, onProgress)
    },
    scanPlatform: async (platform) => {
      const token = await ensureToken()
      return scanForUsageEmails(token, platform)
    },
    scanAll: async () => {
      const token = await ensureToken()
      return scanForUsageEmails(token)
    },
  }
}

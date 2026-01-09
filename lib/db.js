// Database operations via DO proxy
// This reduces Neon cold starts by routing through a persistent connection on DO

const DB_PROXY_URL = process.env.DB_PROXY_URL || 'http://143.110.154.10:3008'
const CRON_SECRET = process.env.CRON_SECRET

async function proxyCall(endpoint, options = {}) {
  const url = `${DB_PROXY_URL}${endpoint}`

  const fetchOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Proxy request failed' }))
    throw new Error(error.error || `Proxy error: ${response.status}`)
  }

  return response.json()
}

// User operations
export async function getOrCreateUser(email, name, refreshToken) {
  const result = await proxyCall('/api/users', {
    method: 'POST',
    body: { email, name, refreshToken },
  })
  return result
}

export async function getUserByEmail(email) {
  const result = await proxyCall(`/api/users/${encodeURIComponent(email)}`)
  return result
}

export async function updateLastScan(userId) {
  await proxyCall('/api/update-last-scan', {
    method: 'POST',
    body: { userId },
  })
}

// Alert operations
export async function saveAlert(alert) {
  const result = await proxyCall('/api/alerts', {
    method: 'POST',
    body: alert,
  })
  return result
}

export async function getAlertsByUser(userId, platform = null) {
  const query = platform ? `?platform=${encodeURIComponent(platform)}` : ''
  const result = await proxyCall(`/api/alerts/${userId}${query}`)
  return result.alerts || []
}

// Prediction operations
export async function savePrediction(prediction) {
  const result = await proxyCall('/api/predictions', {
    method: 'POST',
    body: prediction,
  })
  return result
}

export async function getPredictionsByUser(userId) {
  const result = await proxyCall(`/api/predictions/${userId}`)
  return result.predictions || []
}

// Login tracking
export async function trackLogin(userId) {
  await proxyCall('/api/track-login', {
    method: 'POST',
    body: { userId },
  })
}

export async function getLoginPatterns(userId) {
  const result = await proxyCall(`/api/login-patterns/${userId}`)
  return result.patterns || []
}

// Scan status operations
export async function updateScanStatus(email, status, error = null) {
  await proxyCall('/api/scan-status', {
    method: 'POST',
    body: { email, status, error },
  })
}

export async function getScanStatus(email) {
  const result = await proxyCall(`/api/scan-status/${encodeURIComponent(email)}`)
  return result
}

// Admin operations
export async function getAllUsersWithStats() {
  const result = await proxyCall(`/api/admin/users?secret=${encodeURIComponent(CRON_SECRET)}`)
  return result.users || []
}

// These functions are no longer needed from Vercel - cron moved to DO
// Keeping stubs for backwards compatibility
export async function getUsersToRefresh(currentHour) {
  console.warn('[DB] getUsersToRefresh called from Vercel - cron should be on DO now')
  return []
}

export async function updateRefreshSchedule(userId, preferredHour, preferredDays, confidence) {
  console.warn('[DB] updateRefreshSchedule not yet implemented in proxy')
}

// Pattern operations - These are only used by DO worker, keep as stubs
export async function findPatternByHash(hash) {
  console.warn('[DB] findPatternByHash should be called from DO worker, not Vercel')
  return null
}

export async function findPatternsByPlatform(platform) {
  console.warn('[DB] findPatternsByPlatform should be called from DO worker, not Vercel')
  return []
}

export async function savePattern(pattern) {
  console.warn('[DB] savePattern should be called from DO worker, not Vercel')
  return null
}

export async function incrementPatternMatch(hash) {
  console.warn('[DB] incrementPatternMatch should be called from DO worker, not Vercel')
}

export async function getAllPatterns() {
  console.warn('[DB] getAllPatterns should be called from DO worker, not Vercel')
  return []
}

// Default export for backwards compatibility with getSql()
// Routes using raw SQL will need to be updated
export default function getSql() {
  throw new Error('Direct SQL access removed - use DO proxy functions instead. If you need raw SQL, update the route to use a proxy endpoint.')
}

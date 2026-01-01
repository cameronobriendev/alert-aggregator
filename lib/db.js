import { neon } from '@neondatabase/serverless'

// Lazy-load connection to avoid build-time errors
let _sql = null
function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export default getSql

// User operations
export async function getOrCreateUser(email, name, refreshToken) {
  const sql = getSql()
  const result = await sql`
    INSERT INTO users (email, name, gmail_refresh_token, gmail_token_expiry)
    VALUES (${email}, ${name}, ${refreshToken}, NOW() + INTERVAL '1 hour')
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      gmail_refresh_token = COALESCE(EXCLUDED.gmail_refresh_token, users.gmail_refresh_token),
      updated_at = NOW()
    RETURNING *
  `
  return result[0]
}

export async function getUserByEmail(email) {
  const sql = getSql()
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `
  return result[0]
}

export async function updateLastScan(userId) {
  const sql = getSql()
  await sql`
    UPDATE users SET last_scan_at = NOW(), updated_at = NOW() WHERE id = ${userId}
  `
}

// Alert operations - handles both usage alerts AND error alerts
export async function saveAlert(alert) {
  const sql = getSql()
  const result = await sql`
    INSERT INTO alerts (
      user_id, platform, type, threshold, alert_type, error_type, severity,
      item_name, error_message, email_date, email_subject,
      usage_current, usage_limit, plan_name, billing_cycle_start,
      billing_cycle_end, raw_email_id, summary, category, subcategory
    ) VALUES (
      ${alert.userId},
      ${alert.platform},
      ${alert.type || 'usage'},
      ${alert.threshold || null},
      ${alert.alertType || null},
      ${alert.errorType || null},
      ${alert.severity || null},
      ${alert.itemName || null},
      ${alert.errorMessage || null},
      ${alert.emailDate},
      ${alert.emailSubject},
      ${alert.usageCurrent || null},
      ${alert.usageLimit || null},
      ${alert.planName || null},
      ${alert.billingCycleStart || null},
      ${alert.billingCycleEnd || null},
      ${alert.rawEmailId},
      ${alert.summary || null},
      ${alert.category || null},
      ${alert.subcategory || null}
    )
    ON CONFLICT (user_id, raw_email_id) DO UPDATE SET
      summary = COALESCE(EXCLUDED.summary, alerts.summary),
      category = COALESCE(EXCLUDED.category, alerts.category),
      subcategory = COALESCE(EXCLUDED.subcategory, alerts.subcategory),
      severity = COALESCE(EXCLUDED.severity, alerts.severity),
      type = COALESCE(EXCLUDED.type, alerts.type),
      threshold = COALESCE(EXCLUDED.threshold, alerts.threshold),
      item_name = COALESCE(EXCLUDED.item_name, alerts.item_name),
      error_message = COALESCE(EXCLUDED.error_message, alerts.error_message)
    RETURNING *
  `
  return result[0]
}

export async function getAlertsByUser(userId, platform = null) {
  const sql = getSql()
  if (platform) {
    return await sql`
      SELECT * FROM alerts
      WHERE user_id = ${userId} AND platform = ${platform}
      ORDER BY email_date DESC
    `
  }
  return await sql`
    SELECT * FROM alerts
    WHERE user_id = ${userId}
    ORDER BY email_date DESC
  `
}

// Prediction operations
export async function savePrediction(prediction) {
  const sql = getSql()
  const result = await sql`
    INSERT INTO predictions (
      user_id, platform, predicted_overage_date, velocity_per_day,
      confidence, data_points
    ) VALUES (
      ${prediction.userId}, ${prediction.platform},
      ${prediction.predictedOverageDate}, ${prediction.velocityPerDay},
      ${prediction.confidence}, ${prediction.dataPoints}
    )
    ON CONFLICT (user_id, platform)
    DO UPDATE SET
      predicted_overage_date = EXCLUDED.predicted_overage_date,
      velocity_per_day = EXCLUDED.velocity_per_day,
      confidence = EXCLUDED.confidence,
      data_points = EXCLUDED.data_points,
      calculated_at = NOW()
    RETURNING *
  `
  return result[0]
}

export async function getPredictionsByUser(userId) {
  const sql = getSql()
  return await sql`
    SELECT * FROM predictions
    WHERE user_id = ${userId}
    ORDER BY platform
  `
}

// Login tracking for adaptive refresh
export async function trackLogin(userId) {
  const sql = getSql()
  const now = new Date()
  await sql`
    INSERT INTO user_logins (user_id, hour_of_day, day_of_week)
    VALUES (${userId}, ${now.getHours()}, ${now.getDay()})
  `
}

export async function getLoginPatterns(userId) {
  const sql = getSql()
  return await sql`
    SELECT hour_of_day, day_of_week, COUNT(*) as count
    FROM user_logins
    WHERE user_id = ${userId}
    GROUP BY hour_of_day, day_of_week
    ORDER BY count DESC
  `
}

export async function updateRefreshSchedule(userId, preferredHour, preferredDays, confidence) {
  const sql = getSql()
  const nextRefresh = new Date()
  nextRefresh.setHours(preferredHour - 1, 55, 0, 0) // 5 min before preferred hour
  if (nextRefresh < new Date()) {
    nextRefresh.setDate(nextRefresh.getDate() + 1)
  }

  await sql`
    INSERT INTO user_refresh_schedule (
      user_id, preferred_hour, preferred_days, confidence, next_scheduled_refresh
    ) VALUES (
      ${userId}, ${preferredHour}, ${preferredDays}, ${confidence}, ${nextRefresh}
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      preferred_hour = EXCLUDED.preferred_hour,
      preferred_days = EXCLUDED.preferred_days,
      confidence = EXCLUDED.confidence,
      next_scheduled_refresh = EXCLUDED.next_scheduled_refresh,
      updated_at = NOW()
  `
}

export async function getUsersToRefresh(currentHour) {
  const sql = getSql()
  return await sql`
    SELECT u.*, r.preferred_hour
    FROM users u
    LEFT JOIN user_refresh_schedule r ON u.id = r.user_id
    WHERE r.preferred_hour = ${currentHour + 1}
       OR (r.preferred_hour IS NULL AND ${currentHour} = 6)
  `
}

// Email pattern operations for AI-maintained parsing
export async function findPatternByHash(hash) {
  const sql = getSql()
  const result = await sql`
    SELECT * FROM email_patterns WHERE pattern_hash = ${hash}
  `
  return result[0]
}

export async function findPatternsByPlatform(platform) {
  const sql = getSql()
  return await sql`
    SELECT * FROM email_patterns
    WHERE platform = ${platform}
    ORDER BY match_count DESC
  `
}

export async function savePattern(pattern) {
  const sql = getSql()
  const result = await sql`
    INSERT INTO email_patterns (
      pattern_hash, platform, category, subcategory, severity,
      detection_rules, extraction_rules, summary_template,
      example_subject, example_body_snippet
    ) VALUES (
      ${pattern.patternHash},
      ${pattern.platform},
      ${pattern.category},
      ${pattern.subcategory || null},
      ${pattern.severity || null},
      ${JSON.stringify(pattern.detectionRules)},
      ${JSON.stringify(pattern.extractionRules)},
      ${pattern.summaryTemplate || null},
      ${pattern.exampleSubject || null},
      ${pattern.exampleBodySnippet || null}
    )
    ON CONFLICT (pattern_hash) DO UPDATE SET
      match_count = email_patterns.match_count + 1,
      last_matched_at = NOW()
    RETURNING *
  `
  return result[0]
}

export async function incrementPatternMatch(hash) {
  const sql = getSql()
  await sql`
    UPDATE email_patterns
    SET match_count = match_count + 1, last_matched_at = NOW()
    WHERE pattern_hash = ${hash}
  `
}

export async function getAllPatterns() {
  const sql = getSql()
  return await sql`
    SELECT * FROM email_patterns
    ORDER BY match_count DESC
  `
}

// Scan status operations (for DO worker integration)
export async function updateScanStatus(email, status, error = null) {
  const sql = getSql()
  if (status === 'scanning') {
    await sql`
      UPDATE users
      SET scan_status = ${status}, scan_started_at = NOW(), scan_error = NULL, updated_at = NOW()
      WHERE email = ${email}
    `
  } else if (status === 'error') {
    await sql`
      UPDATE users
      SET scan_status = ${status}, scan_error = ${error}, updated_at = NOW()
      WHERE email = ${email}
    `
  } else {
    await sql`
      UPDATE users
      SET scan_status = ${status}, scan_error = NULL, updated_at = NOW()
      WHERE email = ${email}
    `
  }
}

export async function getScanStatus(email) {
  const sql = getSql()
  const result = await sql`
    SELECT scan_status, scan_started_at, scan_error, emails_found, alerts_saved, last_scan_at
    FROM users WHERE email = ${email}
  `
  return result[0]
}

// Admin operations
export async function getAllUsersWithStats() {
  const sql = getSql()
  return await sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.created_at,
      u.scan_status,
      u.scan_started_at,
      u.last_scan_at,
      u.scan_error,
      u.emails_found,
      u.alerts_saved,
      (SELECT COUNT(*) FROM alerts a WHERE a.user_id = u.id) as total_alerts,
      (SELECT COUNT(*) FROM alerts a WHERE a.user_id = u.id AND (a.category = 'error' OR a.category = 'warning' OR a.severity = 'critical' OR a.severity = 'warning')) as error_count,
      (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id) as prediction_count
    FROM users u
    ORDER BY u.created_at DESC
  `
}

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default sql

// User operations
export async function getOrCreateUser(email, name, refreshToken) {
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
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `
  return result[0]
}

export async function updateLastScan(userId) {
  await sql`
    UPDATE users SET last_scan_at = NOW(), updated_at = NOW() WHERE id = ${userId}
  `
}

// Alert operations
export async function saveAlert(alert) {
  const result = await sql`
    INSERT INTO alerts (
      user_id, platform, threshold, email_date, email_subject,
      usage_current, usage_limit, plan_name, billing_cycle_start,
      billing_cycle_end, raw_email_id
    ) VALUES (
      ${alert.userId}, ${alert.platform}, ${alert.threshold},
      ${alert.emailDate}, ${alert.emailSubject}, ${alert.usageCurrent},
      ${alert.usageLimit}, ${alert.planName}, ${alert.billingCycleStart},
      ${alert.billingCycleEnd}, ${alert.rawEmailId}
    )
    ON CONFLICT (user_id, raw_email_id) DO NOTHING
    RETURNING *
  `
  return result[0]
}

export async function getAlertsByUser(userId, platform = null) {
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
  return await sql`
    SELECT * FROM predictions
    WHERE user_id = ${userId}
    ORDER BY platform
  `
}

// Login tracking for adaptive refresh
export async function trackLogin(userId) {
  const now = new Date()
  await sql`
    INSERT INTO user_logins (user_id, hour_of_day, day_of_week)
    VALUES (${userId}, ${now.getHours()}, ${now.getDay()})
  `
}

export async function getLoginPatterns(userId) {
  return await sql`
    SELECT hour_of_day, day_of_week, COUNT(*) as count
    FROM user_logins
    WHERE user_id = ${userId}
    GROUP BY hour_of_day, day_of_week
    ORDER BY count DESC
  `
}

export async function updateRefreshSchedule(userId, preferredHour, preferredDays, confidence) {
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
  return await sql`
    SELECT u.*, r.preferred_hour
    FROM users u
    LEFT JOIN user_refresh_schedule r ON u.id = r.user_id
    WHERE r.preferred_hour = ${currentHour + 1}
       OR (r.preferred_hour IS NULL AND ${currentHour} = 6)
  `
}

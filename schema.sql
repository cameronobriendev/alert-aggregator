-- Alert Aggregator Database Schema
-- Run this on Neon PostgreSQL

-- Users table (extends NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gmail_refresh_token TEXT,
  gmail_token_expiry TIMESTAMP,
  last_scan_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Parsed alerts from emails
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'zapier', 'make', 'airtable', 'bubble'
  threshold INTEGER NOT NULL, -- 75, 80, 90, 100
  email_date TIMESTAMP NOT NULL,
  email_subject TEXT,
  usage_current INTEGER,
  usage_limit INTEGER,
  plan_name TEXT,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  raw_email_id TEXT, -- Gmail message ID (for deduplication)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, raw_email_id)
);

-- Predictions (calculated from alerts)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  predicted_overage_date DATE,
  velocity_per_day NUMERIC,
  confidence TEXT, -- 'high', 'medium', 'low'
  data_points INTEGER, -- how many alerts used
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Login history (for adaptive refresh scheduling)
CREATE TABLE IF NOT EXISTS user_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  logged_in_at TIMESTAMP DEFAULT NOW(),
  hour_of_day INTEGER, -- 0-23, for pattern detection
  day_of_week INTEGER  -- 0-6 (Sun-Sat), for pattern detection
);

-- Scheduled refresh times (calculated from login patterns)
CREATE TABLE IF NOT EXISTS user_refresh_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_hour INTEGER, -- Hour to refresh (5 min before typical login)
  preferred_days INTEGER[], -- Days of week user typically logs in
  confidence TEXT, -- 'high' (10+ logins), 'medium' (5-9), 'low' (<5)
  next_scheduled_refresh TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_platform ON alerts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_alerts_email_date ON alerts(email_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_logins_user ON user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_schedule_hour ON user_refresh_schedule(preferred_hour);

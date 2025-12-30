import { NextResponse } from 'next/server'
import getSql from '@/lib/db'

export async function GET(request) {
  // Simple auth check
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer migrate-alerts-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getSql()
    const migrations = []

    // Add new columns for error alerts
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'usage'
    `
    migrations.push('alerts.type')

    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS alert_type TEXT
    `
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS error_type TEXT
    `
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS severity TEXT
    `
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS item_name TEXT
    `
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS error_message TEXT
    `

    // Make threshold nullable
    await sql`
      ALTER TABLE alerts ALTER COLUMN threshold DROP NOT NULL
    `

    // Add summary column for AI-extracted human-readable summaries
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS summary TEXT
    `
    migrations.push('alerts.summary')

    // Add category/subcategory for AI classification
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS category TEXT
    `
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS subcategory TEXT
    `
    migrations.push('alerts.category, alerts.subcategory')

    // Create email_patterns table for AI pattern caching
    await sql`
      CREATE TABLE IF NOT EXISTS email_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pattern_hash TEXT UNIQUE NOT NULL,
        platform TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        severity TEXT,
        detection_rules JSONB NOT NULL,
        extraction_rules JSONB NOT NULL,
        summary_template TEXT,
        example_subject TEXT,
        example_body_snippet TEXT,
        confidence NUMERIC DEFAULT 1.0,
        match_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        last_matched_at TIMESTAMP DEFAULT NOW()
      )
    `
    migrations.push('email_patterns table')

    // Create index on pattern_hash for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_email_patterns_hash ON email_patterns(pattern_hash)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_email_patterns_platform ON email_patterns(platform)
    `
    migrations.push('email_patterns indexes')

    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      migrations
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      hint: 'Column may already exist or other issue'
    }, { status: 500 })
  }
}

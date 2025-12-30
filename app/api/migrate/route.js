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

    // Add new columns for error alerts
    await sql`
      ALTER TABLE alerts
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'usage'
    `
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

    return NextResponse.json({ success: true, message: 'Migration complete' })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      hint: 'Column may already exist or other issue'
    }, { status: 500 })
  }
}

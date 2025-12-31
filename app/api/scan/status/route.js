import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getScanStatus } from '@/lib/db'

// GET /api/scan/status - Get current scan status for dashboard polling
export async function GET(request) {
  try {
    const session = await getSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getScanStatus(session.user.email)

    if (!status) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: status.scan_status || 'pending',
      startedAt: status.scan_started_at,
      error: status.scan_error,
      emailsFound: status.emails_found,
      alertsSaved: status.alerts_saved,
      lastScanAt: status.last_scan_at,
    })
  } catch (err) {
    console.error('[STATUS] Error:', err.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

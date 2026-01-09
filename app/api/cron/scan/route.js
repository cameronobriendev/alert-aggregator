import { NextResponse } from 'next/server'

// Cron job has been moved to DO (alert-aggregator-db service on port 3008)
// This route is kept for reference only
export async function GET(request) {
  return NextResponse.json({
    message: 'Cron job moved to DO. The alert-aggregator-db service now handles hourly scans.',
    doService: 'http://143.110.154.10:3008',
    schedule: '55 * * * * (every hour at :55)'
  }, { status: 200 })
}

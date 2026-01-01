import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllUsersWithStats } from '@/lib/db'

const ADMIN_EMAIL = 'cameronobriendev@gmail.com'

export async function GET(request) {
  try {
    // Get session and verify admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with stats
    const users = await getAllUsersWithStats()

    // Format for frontend
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.created_at,
      scanStatus: u.scan_status,
      scanStartedAt: u.scan_started_at,
      lastScanAt: u.last_scan_at,
      scanError: u.scan_error,
      emailsFound: parseInt(u.emails_found) || 0,
      alertsSaved: parseInt(u.alerts_saved) || 0,
      totalAlerts: parseInt(u.total_alerts) || 0,
      errorCount: parseInt(u.error_count) || 0,
      predictionCount: parseInt(u.prediction_count) || 0,
    }))

    return NextResponse.json({
      users: formattedUsers,
      totalUsers: formattedUsers.length,
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to get users', details: error.message },
      { status: 500 }
    )
  }
}

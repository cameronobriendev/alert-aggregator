import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ALL_PLATFORMS_QUERY, PLATFORM_QUERIES, searchEmails, fetchEmails } from '@/lib/gmail'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // Test with just Make.com query
    const makeQuery = PLATFORM_QUERIES.make
    const allQuery = ALL_PLATFORMS_QUERY

    // Try to get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: session.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text()
      return NextResponse.json({
        error: 'Token refresh failed',
        details: err,
        hasRefreshToken: !!session.refreshToken
      })
    }

    const { access_token } = await tokenResponse.json()

    // Search for Make emails
    const makeResults = await searchEmails(access_token, makeQuery, 10)

    // If we got results, fetch one to see the From header
    let sampleEmail = null
    if (makeResults.length > 0) {
      const emailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${makeResults[0].id}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (emailResponse.ok) {
        const data = await emailResponse.json()
        const headers = data.payload?.headers || []
        sampleEmail = {
          id: data.id,
          from: headers.find(h => h.name.toLowerCase() === 'from')?.value,
          subject: headers.find(h => h.name.toLowerCase() === 'subject')?.value,
          snippet: data.snippet?.substring(0, 100),
        }
      }
    }

    return NextResponse.json({
      queries: {
        make: makeQuery,
        all: allQuery,
      },
      makeResultCount: makeResults.length,
      sampleEmail,
      sessionEmail: session.user?.email,
    })

  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

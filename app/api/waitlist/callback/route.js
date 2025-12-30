import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function notifyPumble(email) {
  try {
    await fetch('https://pumble-api-keys.addons.marketplace.cake.com/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.PUMBLE_API,
      },
      body: JSON.stringify({
        channel: 'clientflow-app',
        text: `Google signup: ${email}`,
      }),
    })
  } catch (err) {
    console.error('Pumble notification failed:', err)
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXTAUTH_URL

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/signup?error=cancelled`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/waitlist/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.redirect(`${baseUrl}/signup?error=auth_failed`)
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const user = await userRes.json()

    if (!user.email) {
      return NextResponse.redirect(`${baseUrl}/signup?error=no_email`)
    }

    // Add to waitlist
    const result = await sql`
      INSERT INTO waitlist (email)
      VALUES (${user.email.toLowerCase()})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `

    // Notify if new signup
    if (result.length > 0) {
      await notifyPumble(user.email)
    }

    return NextResponse.redirect(`${baseUrl}/thank-you`)
  } catch (err) {
    console.error('Waitlist callback error:', err)
    return NextResponse.redirect(`${baseUrl}/signup?error=unknown`)
  }
}

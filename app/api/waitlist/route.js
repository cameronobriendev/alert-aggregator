import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function notifyPumble(email, provider) {
  try {
    await fetch('https://pumble-api-keys.addons.marketplace.cake.com/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.PUMBLE_API,
      },
      body: JSON.stringify({
        channel: 'clientflow-app',
        text: `Non-Google signup: ${email} (${provider})`,
      }),
    })
  } catch (err) {
    console.error('Pumble notification failed:', err)
  }
}

export async function POST(request) {
  try {
    const { email, provider } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!provider) {
      return Response.json({ error: 'Email provider required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Insert or ignore if already exists
    const result = await sql`
      INSERT INTO waitlist (email)
      VALUES (${cleanEmail})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `

    // Only notify if new signup (not duplicate)
    if (result.length > 0) {
      await notifyPumble(cleanEmail, provider)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return Response.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Insert or ignore if already exists
    await sql`
      INSERT INTO waitlist (email)
      VALUES (${email.toLowerCase().trim()})
      ON CONFLICT (email) DO NOTHING
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return Response.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}

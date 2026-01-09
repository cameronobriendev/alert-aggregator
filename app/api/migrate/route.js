import { NextResponse } from 'next/server'

// Migrations are now run directly on the database
// This route is kept for reference only
export async function GET(request) {
  return NextResponse.json({
    message: 'Migrations are no longer run from Vercel. Run migrations directly on the database.',
    hint: 'Connect to Neon via psql or use the DO proxy if migration endpoint is needed.'
  }, { status: 501 })
}

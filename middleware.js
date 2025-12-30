import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname

  // If on app.clientflow.dev and hitting root, redirect to dashboard
  if (hostname?.includes('app.clientflow.dev') && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}

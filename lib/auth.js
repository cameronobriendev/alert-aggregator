import { getServerSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { getOrCreateUser, getUserByEmail, updateScanStatus } from './db'

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.expiresAt = token.expiresAt
      return session
    },
    async signIn({ user, account }) {
      // Save user and refresh token to DB, check if first time
      try {
        const existingUser = await getUserByEmail(user.email)
        const isNewUser = !existingUser || !existingUser.last_scan_at

        // Save/update user with refresh token
        await getOrCreateUser(user.email, user.name, account.refresh_token)

        // If new user (never scanned), trigger DO worker for initial scan
        if (isNewUser && account.refresh_token) {
          // Set status to pending before triggering
          await updateScanStatus(user.email, 'pending')

          // Call DO worker for initial scan (3 years of history)
          // Fire and forget - don't await the scan itself
          fetch('http://143.110.154.10:3010/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              secret: process.env.CRON_SECRET,
              type: 'initial', // 3 years of history
            }),
          }).catch(err => console.error('[AUTH] DO scan trigger failed:', err.message))

          console.log(`[AUTH] New user ${user.email} - triggered DO scan worker`)
        }
      } catch (err) {
        console.error('[AUTH] signIn callback error:', err.message)
      }
      return true
    },
  },
  pages: {
    signIn: 'https://clientflow.dev',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

import { getServerSession } from 'next-auth'
import Google from 'next-auth/providers/google'

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

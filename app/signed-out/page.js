'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Icon from '@/components/icons/Icon'

export default function SignedOut() {
  return (
    <div className="min-h-screen bg-aa-bg flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-aa-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="check_circle" size={40} className="text-aa-primary" />
        </div>

        <h1 className="text-2xl font-bold text-aa-text mb-4">
          You've been signed out
        </h1>

        <p className="text-aa-muted mb-8">
          Thanks for using ClientFlow. See you next time!
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => signIn('google')}
            className="w-full bg-aa-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors"
          >
            Sign back in
          </button>

          <Link
            href="https://clientflow.dev"
            className="w-full bg-aa-card border border-aa-border text-aa-text py-3 px-6 rounded-lg font-medium hover:bg-aa-border/50 transition-colors"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

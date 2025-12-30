'use client'

import { motion } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  if (status === 'authenticated') {
    router.push('/dashboard')
    return null
  }

  const handleSignIn = () => {
    signIn('google', { callbackUrl: 'https://app.clientflow.dev/dashboard' })
  }
  return (
    <div className="min-h-screen bg-aa-bg">
      {/* Header */}
      <header className="border-b border-aa-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ClientFlow" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-aa-text">ClientFlow</span>
            <span className="text-xs bg-aa-primary/20 text-aa-primary px-2 py-0.5 rounded-full font-medium">FREE BETA</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name="login" size={20} />
              Sign in with Google
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-aa-text mb-6">
            See what's breaking before your clients do
          </h1>
          <p className="text-xl text-aa-muted mb-8">
            Connect your Gmail. We'll find every usage alert and error notification from Zapier, Make.com, Airtable, and Bubble.
            See failed automations, predict overages, and know when it's time to go custom.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="email" size={20} />
              Connect Gmail
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="bg-aa-card border border-aa-border text-aa-text px-6 py-3 rounded-lg font-medium hover:bg-aa-border/30 transition-colors"
            >
              See Demo
            </button>
          </div>

          {/* Platform logos placeholder */}
          <div className="flex items-center justify-center gap-8 text-aa-muted">
            <span className="text-sm">Works with:</span>
            <div className="flex gap-6">
              <span className="font-medium">Zapier</span>
              <span className="font-medium">Make.com</span>
              <span className="font-medium">Airtable</span>
              <span className="font-medium">Bubble</span>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mt-20"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 bg-aa-critical/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="error" size={24} className="text-aa-critical" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Error Detection</h3>
            <p className="text-aa-muted">
              Failed zaps, broken automations, capacity issues. See every error across all your platforms in one place.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 bg-aa-warning/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="trending_up" size={24} className="text-aa-warning" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Limit Predictions</h3>
            <p className="text-aa-muted">
              We analyze years of usage patterns to predict exactly when you'll hit your next overage.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 bg-aa-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="build" size={24} className="text-aa-accent" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Custom Build Offers</h3>
            <p className="text-aa-muted">
              When errors pile up or limits keep hitting, we'll show you what a custom solution would cost.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-aa-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-aa-muted">
            © {new Date().getFullYear()} ClientFlow. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-aa-muted hover:text-aa-text transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-aa-muted hover:text-aa-text transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

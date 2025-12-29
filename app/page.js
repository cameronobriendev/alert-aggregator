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
          <div className="flex items-center gap-2">
            <Icon name="notifications" size={28} className="text-aa-primary" />
            <span className="text-xl font-semibold text-aa-text">ClientFlow</span>
            <span className="text-xs bg-aa-warning/20 text-aa-warning px-2 py-0.5 rounded-full font-medium">BETA</span>
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
            Stop hitting limits you didn't see coming
          </h1>
          <p className="text-xl text-aa-muted mb-8">
            Connect your Gmail. We'll find every usage alert from Zapier, Make.com, Airtable, and Bubble.
            Then predict when you'll hit your next limit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="email" size={20} />
              Connect Gmail
            </button>
            <button className="bg-aa-card border border-aa-border text-aa-text px-6 py-3 rounded-lg font-medium hover:bg-aa-border/30 transition-colors">
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
            <div className="w-12 h-12 bg-aa-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="history" size={24} className="text-aa-primary" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Historical Analysis</h3>
            <p className="text-aa-muted">
              We scan years of email history to understand your usage patterns across all platforms.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 bg-aa-warning/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="trending_up" size={24} className="text-aa-warning" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Predictive Alerts</h3>
            <p className="text-aa-muted">
              Know exactly when you'll hit your limits. No more surprise overages or paused automations.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 bg-aa-healthy/10 rounded-lg flex items-center justify-center mb-4">
              <Icon name="shield" size={24} className="text-aa-healthy" />
            </div>
            <h3 className="text-lg font-semibold text-aa-text mb-2">Custom Solutions</h3>
            <p className="text-aa-muted">
              Outgrowing no-code? We'll show you what custom automation would save you.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

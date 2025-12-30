'use client'

import { motion } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

// Example alerts that show what we catch
const EXAMPLE_ALERTS = [
  {
    type: 'critical',
    icon: 'error',
    title: 'Zapier stopped working',
    message: 'Your "New Lead to CRM" automation turned off 3 days ago. 47 leads may have been missed.',
    time: '2 hours ago',
  },
  {
    type: 'warning',
    icon: 'warning',
    title: 'Airtable almost full',
    message: 'Your database has 42,847 records. At this rate, you\'ll hit the 50,000 limit in 6 weeks.',
    time: '1 day ago',
  },
  {
    type: 'critical',
    icon: 'link_off',
    title: 'Connection broken',
    message: 'Make.com lost connection to Google Sheets. Your "Order Processing" flow stopped.',
    time: '4 hours ago',
  },
]

// Pain points they'll recognize
const PAIN_POINTS = [
  'Checking Zapier, Make, Airtable every morning... just in case',
  'Finding out something broke days after it happened',
  'Lying awake wondering if your automations are still running',
  'Customers telling YOU about problems before you notice',
]

// What changes for them
const RELIEF_POINTS = [
  {
    before: 'Check 10 platforms before coffee',
    after: 'One dashboard. One glance. Done.',
  },
  {
    before: 'Find out when customers complain',
    after: 'Know the instant something breaks',
  },
  {
    before: 'Surprise bills from overages',
    after: 'Warnings before you hit limits',
  },
  {
    before: '3am anxiety about silent failures',
    after: 'Sleep knowing someone\'s watching',
  },
]

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="ClientFlow" className="h-8 w-auto" />
              <span className="text-xl font-semibold text-aa-text">ClientFlow</span>
            </a>
            <span className="text-xs bg-aa-primary/20 text-aa-primary px-2 py-0.5 rounded-full font-medium">FREE BETA</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name="login" size={20} />
              Start Free
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Hero - Permission to exhale */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto py-16 md:py-24"
        >
          <div className="inline-flex items-center gap-2 bg-aa-healthy/10 text-aa-healthy px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-aa-healthy rounded-full animate-pulse" />
            Watching your tools so you don't have to
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-aa-text mb-6 leading-tight">
            Finally stop worrying about<br />
            <span className="text-aa-primary">what's breaking</span>
          </h1>

          <p className="text-xl md:text-2xl text-aa-muted mb-8 max-w-2xl mx-auto">
            We watch Zapier, Make.com, Airtable, and Bubble for you.
            When something fails or a limit approaches, you'll know first.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-8 py-4 rounded-xl font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <Icon name="shield" size={24} />
              Start Watching Free
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="bg-aa-card border border-aa-border text-aa-text px-8 py-4 rounded-xl font-medium hover:bg-aa-border/30 transition-colors text-lg"
            >
              See Demo
            </button>
          </div>

          <p className="text-sm text-aa-muted">
            Connect Gmail in 30 seconds. We scan your existing alerts. No credit card.
          </p>
        </motion.section>

        {/* Pain Recognition */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="py-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-aa-text mb-3">
              Sound familiar?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {PAIN_POINTS.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 p-4 bg-aa-card rounded-lg border border-aa-border"
              >
                <Icon name="check_box_outline_blank" size={20} className="text-aa-muted mt-0.5 flex-shrink-0" />
                <span className="text-aa-text">{point}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-aa-muted mt-6 text-lg">
            You're not alone. 80% of business owners lose sleep over this stuff.
          </p>
        </motion.section>

        {/* Example Alerts - Show the invisible */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="py-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-aa-text mb-3">
              Here's what you might be missing right now
            </h2>
            <p className="text-aa-muted text-lg">
              Real alerts from real no-code stacks. Things that break silently.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {EXAMPLE_ALERTS.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.15 }}
                className={`p-5 rounded-xl border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-aa-critical/5 border-aa-critical'
                    : 'bg-aa-warning/5 border-aa-warning'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'critical' ? 'bg-aa-critical/20' : 'bg-aa-warning/20'
                  }`}>
                    <Icon
                      name={alert.icon}
                      size={20}
                      className={alert.type === 'critical' ? 'text-aa-critical' : 'text-aa-warning'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h4 className="font-semibold text-aa-text">{alert.title}</h4>
                      <span className="text-xs text-aa-muted whitespace-nowrap">{alert.time}</span>
                    </div>
                    <p className="text-aa-muted">{alert.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 text-aa-primary font-medium">
            Without ClientFlow, you'd find these days or weeks later.
          </p>
        </motion.section>

        {/* The Relief - Before/After */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="py-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-aa-text mb-3">
              What changes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {RELIEF_POINTS.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="flex items-center gap-3 p-4 bg-aa-critical/5 rounded-lg border border-aa-critical/20">
                  <Icon name="close" size={20} className="text-aa-critical flex-shrink-0" />
                  <span className="text-aa-muted line-through">{point.before}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-aa-healthy/5 rounded-lg border border-aa-healthy/20">
                  <Icon name="check" size={20} className="text-aa-healthy flex-shrink-0" />
                  <span className="text-aa-text font-medium">{point.after}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Trust Quote */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="py-16"
        >
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
              <Icon name="format_quote" size={48} className="text-aa-primary/30 mx-auto mb-4" />
              <blockquote className="text-xl md:text-2xl text-aa-text mb-6 leading-relaxed">
                "I can't use Zapier because I don't trust it works properly.
                It fails so often that I expect it to fail instead of trusting it."
              </blockquote>
              <p className="text-aa-muted">
                — Real review from a business owner who needed something watching
              </p>
            </div>
          </div>
        </motion.section>

        {/* How It Works - Simple */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="py-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-aa-text mb-3">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="email" size={32} className="text-aa-primary" />
              </div>
              <h3 className="font-semibold text-aa-text mb-2">1. Connect Gmail</h3>
              <p className="text-aa-muted">
                We only read emails from Zapier, Make, Airtable, and Bubble. Nothing else.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="search" size={32} className="text-aa-primary" />
              </div>
              <h3 className="font-semibold text-aa-text mb-2">2. We scan history</h3>
              <p className="text-aa-muted">
                We find every alert you've ever received. Years of data in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="notifications_active" size={32} className="text-aa-primary" />
              </div>
              <h3 className="font-semibold text-aa-text mb-2">3. You stay informed</h3>
              <p className="text-aa-muted">
                See what's broken, what's close to breaking, and what's healthy. All in one place.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Platforms */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="py-12"
        >
          <div className="text-center mb-8">
            <p className="text-aa-muted text-lg mb-4">We watch these platforms for you</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['Zapier', 'Make.com', 'Airtable', 'Bubble'].map((platform) => (
              <div key={platform} className="flex items-center gap-2">
                <div className="w-3 h-3 bg-aa-healthy rounded-full" />
                <span className="text-lg font-medium text-aa-text">{platform}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="py-16"
        >
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon name="shield" size={40} className="text-aa-primary" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-aa-text mb-4">
              Ready to stop worrying?
            </h2>

            <p className="text-lg text-aa-muted mb-8 max-w-xl mx-auto">
              Connect your Gmail. See everything that's broken or about to break.
              Takes 30 seconds. Free during beta.
            </p>

            <button
              onClick={handleSignIn}
              className="bg-aa-primary text-white px-8 py-4 rounded-xl font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2 text-lg mx-auto"
            >
              <Icon name="shield" size={24} />
              Start Watching Free
            </button>

            <p className="text-sm text-aa-muted mt-4">
              Read-only Gmail access. We never send emails or modify anything.
            </p>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-aa-border py-8 mt-8">
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

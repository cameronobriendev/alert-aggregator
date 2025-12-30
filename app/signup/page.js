'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
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
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="shield" size={40} className="text-aa-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-aa-text mb-4">
            Use Gmail? Google Workspace?
          </h1>

          <p className="text-2xl font-semibold text-aa-primary mb-4">
            Join the beta.
          </p>

          <p className="text-lg text-aa-muted mb-8">
            Enter your email and Cameron will set up your account within 24 hours.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-aa-healthy/10 border border-aa-healthy/30 rounded-xl p-8 text-center"
            >
              <Icon name="check_circle" size={48} className="text-aa-healthy mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-aa-text mb-2">Thanks for signing up!</h2>
              <p className="text-aa-muted">
                Cameron will create your account and email you when it's ready.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 text-aa-primary hover:underline"
              >
                Back to home
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-4 py-4 rounded-xl border border-aa-border bg-aa-card text-aa-text placeholder:text-aa-muted focus:outline-none focus:ring-2 focus:ring-aa-primary text-lg"
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-aa-primary text-white px-8 py-4 rounded-xl font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                <Icon name="shield" size={24} />
                {status === 'loading' ? 'Joining...' : 'Join Beta'}
              </button>
              {status === 'error' && (
                <p className="text-aa-critical text-sm text-center">Something went wrong. Try again.</p>
              )}
            </form>
          )}

          <p className="text-sm text-aa-muted mt-8">
            Read-only Gmail access. We never send emails or modify anything.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

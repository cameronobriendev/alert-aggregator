'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

const EMAIL_PROVIDERS = [
  { value: '', label: 'Select your email provider' },
  { value: 'Outlook', label: 'Outlook / Microsoft 365' },
  { value: 'Yahoo', label: 'Yahoo Mail' },
  { value: 'iCloud', label: 'iCloud Mail' },
  { value: 'ProtonMail', label: 'ProtonMail' },
  { value: 'Zoho', label: 'Zoho Mail' },
  { value: 'AOL', label: 'AOL Mail' },
  { value: 'Other', label: 'Other' },
]

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  const [provider, setProvider] = useState('')
  const [otherProvider, setOtherProvider] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleNonGoogleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const finalProvider = provider === 'Other' ? otherProvider : provider

    if (!email || !email.includes('@')) {
      setSubmitError('Please enter a valid email address')
      return
    }

    if (!finalProvider) {
      setSubmitError('Please select or enter your email provider')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, provider: finalProvider }),
      })

      if (res.ok) {
        router.push('/signup?success=true')
      } else {
        const data = await res.json()
        setSubmitError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
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
            Use Gmail?<br />
            Google Workspace?
          </h1>

          <p className="text-2xl font-semibold text-aa-primary mb-4">
            Join the beta.
          </p>

          <p className="text-lg text-aa-muted mb-8">
            Cameron will set up your account within 24 hours.<br />
            Likely sooner. He ships fast.
          </p>

          {success ? (
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
            <div className="space-y-8">
              {/* Google signup */}
              <div className="space-y-4">
                <a
                  href="/api/waitlist/auth"
                  className="w-full bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </a>
                {error && (
                  <p className="text-aa-critical text-sm text-center">
                    {error === 'cancelled' ? 'Sign in was cancelled.' : 'Something went wrong. Try again.'}
                  </p>
                )}
                <p className="text-sm text-aa-muted">
                  Read-only Gmail access. We never send emails or modify anything.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-aa-border" />
                <span className="text-aa-muted text-sm">or</span>
                <div className="flex-1 h-px bg-aa-border" />
              </div>

              {/* Non-Google signup */}
              <div className="text-left">
                <h2 className="text-xl font-semibold text-aa-text mb-2 text-center">
                  Don't use Google?
                </h2>
                <p className="text-aa-muted text-center mb-6">
                  Put your email in and we'll add your mail platform to the app.
                </p>

                <form onSubmit={handleNonGoogleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-aa-text mb-1">
                      Email Provider
                    </label>
                    <select
                      id="provider"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-aa-border bg-aa-card text-aa-text focus:outline-none focus:ring-2 focus:ring-aa-primary"
                    >
                      {EMAIL_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {provider === 'Other' && (
                    <div>
                      <label htmlFor="otherProvider" className="block text-sm font-medium text-aa-text mb-1">
                        Enter your email provider
                      </label>
                      <input
                        type="text"
                        id="otherProvider"
                        value={otherProvider}
                        onChange={(e) => setOtherProvider(e.target.value)}
                        placeholder="e.g. Fastmail, Hey.com, etc."
                        className="w-full px-4 py-3 rounded-lg border border-aa-border bg-aa-card text-aa-text placeholder-aa-muted focus:outline-none focus:ring-2 focus:ring-aa-primary"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-aa-text mb-1">
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-lg border border-aa-border bg-aa-card text-aa-text placeholder-aa-muted focus:outline-none focus:ring-2 focus:ring-aa-primary"
                    />
                  </div>

                  {submitError && (
                    <p className="text-aa-critical text-sm text-center">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-aa-primary text-white px-8 py-4 rounded-xl font-medium hover:bg-aa-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Icon name="email" size={20} />
                    {submitting ? 'Submitting...' : 'Join Waitlist'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-aa-bg" />}>
      <SignupContent />
    </Suspense>
  )
}

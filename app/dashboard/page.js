'use client'

import { useSession, signOut, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'
import BetaToast from '@/components/BetaToast'

const PLATFORMS = [
  { id: 'zapier', name: 'Zapier', metric: 'tasks' },
  { id: 'make', name: 'Make.com', metric: 'operations' },
  { id: 'airtable', name: 'Airtable', metric: 'automations' },
  { id: 'bubble', name: 'Bubble', metric: 'workload units' },
]

// Custom build recommendations based on error patterns
const CUSTOM_BUILD_OFFERS = {
  zapier: {
    problem: 'Zapier tasks are burning through limits and hitting API errors',
    risks: [
      'Overage charges of $0.01-0.05 per extra task add up fast',
      'Task-based pricing punishes business growth',
      'API rate limits cause cascading failures',
    ],
    solution: 'Self-hosted n8n gives you unlimited workflow executions for a flat $5-10/mo server cost.',
    benefits: [
      'Unlimited executions (no task limits)',
      'Same visual workflow builder',
      'Full error handling and logging',
      'One-time setup, forever savings',
    ],
  },
  airtable: {
    problem: 'Airtable automations keep failing and API limits are blocking workflows',
    risks: [
      'API rate limits (5 req/sec) cause cascading delays',
      'Automation failures happen silently',
      'No visibility into what\'s causing failures',
    ],
    solution: 'A PostgreSQL database with custom automations has no rate limits and instant execution.',
    benefits: [
      'No API rate limits',
      'Real-time data access',
      'Full error visibility and logging',
      'Direct database connections',
    ],
  },
  make: {
    problem: 'Make.com scenarios are timing out and eating through operations',
    risks: [
      'Slow scenarios consume more operations (costs more)',
      'Timeouts cause partial data processing',
      'No visibility into which module is slow',
    ],
    solution: 'A Node.js script processes the same data in milliseconds with full performance profiling.',
    benefits: [
      'Sub-second processing times',
      'Built-in performance profiling',
      'Parallel processing support',
      'Full debugging and logging',
    ],
  },
  bubble: {
    problem: 'Bubble app is hitting capacity limits and slowing down for users',
    risks: [
      'Shared infrastructure means unpredictable performance',
      'No control over server resources or scaling',
      '2+ second loads cause 50%+ user abandonment',
    ],
    solution: 'A Next.js app on Vercel delivers sub-500ms loads globally with edge deployment.',
    benefits: [
      'Sub-500ms global load times',
      'Automatic edge caching',
      'Full performance control',
      'Scales automatically under load',
    ],
  },
}

function getStatusClasses(prediction) {
  if (!prediction) {
    return {
      bg: 'bg-aa-muted',
      bgLight: 'bg-aa-muted/20',
      text: 'text-aa-muted',
    }
  }
  const days = prediction.daysUntilOverage
  if (days <= 7) {
    return {
      bg: 'bg-aa-critical',
      bgLight: 'bg-aa-critical/20',
      text: 'text-aa-critical',
    }
  }
  if (days <= 14) {
    return {
      bg: 'bg-aa-warning',
      bgLight: 'bg-aa-warning/20',
      text: 'text-aa-warning',
    }
  }
  return {
    bg: 'bg-aa-healthy',
    bgLight: 'bg-aa-healthy/20',
    text: 'text-aa-healthy',
  }
}

function getStatusLabel(prediction) {
  if (!prediction) return 'Need More Data'
  const days = prediction.daysUntilOverage
  if (days <= 0) return 'Over limit'
  if (days <= 7) return 'Critical'
  if (days <= 14) return 'Warning'
  return 'Healthy'
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [scanProgress, setScanProgress] = useState('')
  const [scanStatus, setScanStatus] = useState(null) // null, 'pending', 'scanning', 'complete', 'error'
  const [scanDetails, setScanDetails] = useState({}) // emailsFound, alertsSaved, etc.

  // Fetch scan status from DO worker
  const fetchScanStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scan/status')
      if (res.ok) {
        const json = await res.json()
        setScanStatus(json.status)
        setScanDetails({
          emailsFound: json.emailsFound,
          alertsSaved: json.alertsSaved,
          startedAt: json.startedAt,
          error: json.error,
        })
        return json.status
      }
    } catch (err) {
      console.error('Failed to fetch scan status:', err)
    }
    return null
  }, [])

  // Fetch existing data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google')
    }
    if (status === 'authenticated') {
      fetchScanStatus()
      fetchData()
    }
  }, [status, fetchData, fetchScanStatus])

  // Auto-poll when scan is pending or in progress
  useEffect(() => {
    if (status !== 'authenticated') return
    if (scanStatus === 'complete' || scanStatus === 'error') return
    if (data?.hasScanned && scanStatus === null) return

    // Poll every 5 seconds to check scan progress
    const interval = setInterval(async () => {
      console.log('[DASHBOARD] Polling for scan status...')
      const currentStatus = await fetchScanStatus()
      if (currentStatus === 'complete') {
        console.log('[DASHBOARD] Scan complete, fetching data')
        await fetchData()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [status, scanStatus, data?.hasScanned, fetchScanStatus, fetchData])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-aa-bg flex items-center justify-center">
        <div className="text-aa-muted">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-aa-bg flex items-center justify-center">
        <div className="text-aa-muted">Redirecting to sign in...</div>
      </div>
    )
  }

  const handleScan = async () => {
    setScanning(true)
    setError(null)
    setScanProgress('Connecting to Gmail...')

    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Scan failed')
      }

      setScanProgress(`Found ${json.alertsFound} alerts!`)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
      setScanProgress('')
    }
  }

  const handleRefresh = async () => {
    setScanning(true)
    setScanProgress('Checking last 24 hours...')
    try {
      // Manual refresh only checks last 24 hours (fast, handled by Vercel)
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange: 'newer_than:1d' }),
      })
      if (res.ok) {
        await fetchData()
        setScanProgress('Done!')
      }
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setTimeout(() => {
        setScanning(false)
        setScanProgress('')
      }, 1000)
    }
  }

  const hasScanned = data?.hasScanned

  // Get unique platforms with errors for custom build offers
  const platformsWithErrors = data?.errors
    ? [...new Set(data.errors.map(e => e.platform))].slice(0, 2)
    : []

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
            <a
              href="/help"
              className="text-aa-muted hover:text-aa-text transition-colors font-medium"
            >
              Help
            </a>
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <img
                src={session.user?.image}
                alt={session.user?.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-aa-muted hidden sm:block">{session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/signed-out' })}
              className="text-aa-muted hover:text-aa-text transition-colors flex items-center gap-1"
            >
              <Icon name="logout" size={20} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Scan Status States */}
        {scanStatus === 'error' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto py-12"
          >
            <div className="w-20 h-20 bg-aa-critical/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="error" size={40} className="text-aa-critical" />
            </div>
            <h1 className="text-3xl font-bold text-aa-text mb-4">
              Something went wrong
            </h1>
            <p className="text-aa-muted mb-4">
              {scanDetails.error || 'We encountered an error while scanning your emails.'}
            </p>
            <p className="text-aa-muted mb-8">
              Please try signing out and back in, or contact support at{' '}
              <a href="mailto:cameron@cameronobrien.dev" className="text-aa-primary hover:underline">
                cameron@cameronobrien.dev
              </a>
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/signed-out' })}
              className="bg-aa-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors"
            >
              Sign Out & Try Again
            </button>
          </motion.div>
        ) : (scanStatus === 'pending' || scanStatus === 'scanning') && !hasScanned ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto py-12"
          >
            <div className="w-20 h-20 bg-aa-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="sync" size={40} className="text-aa-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-aa-text mb-4">
              {scanStatus === 'pending' ? 'Preparing your scan...' : 'Scanning your emails...'}
            </h1>
            <p className="text-aa-muted mb-6">
              We're searching your Gmail for usage alerts from Zapier, Make.com, Airtable, and Bubble
              from the last 3 months.
            </p>

            {/* Progress indicator */}
            {scanDetails.emailsFound > 0 && (
              <div className="mb-6 p-4 bg-aa-primary/10 border border-aa-primary/20 rounded-lg">
                <p className="text-aa-primary font-medium">
                  Found {scanDetails.emailsFound} platform emails
                </p>
                {scanDetails.alertsSaved > 0 && (
                  <p className="text-aa-muted text-sm mt-1">
                    Processed {scanDetails.alertsSaved} alerts so far
                  </p>
                )}
              </div>
            )}

            <div className="bg-aa-card border border-aa-border rounded-xl p-6 mb-8">
              <Icon name="email" size={32} className="text-aa-accent mb-3 mx-auto" />
              <h3 className="text-lg font-medium text-aa-text mb-2">
                Almost done!
              </h3>
              <p className="text-aa-muted text-sm">
                This usually takes 1-2 minutes.
                <br />
                <strong className="text-aa-text">We'll email you when it's ready.</strong>
              </p>
              <p className="text-xs text-aa-muted mt-4">
                Feel free to close this tab and come back later.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-aa-primary">
              <div className="w-2 h-2 bg-aa-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {scanStatus === 'pending' ? 'Queued' : 'Scan in progress'}
              </span>
            </div>
          </motion.div>
        ) : !hasScanned ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto py-12"
          >
            <div className="w-20 h-20 bg-aa-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="sync" size={40} className="text-aa-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-aa-text mb-4">
              Setting up your dashboard...
            </h1>
            <p className="text-aa-muted mb-8">
              Please wait while we prepare your account.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-aa-critical/10 border border-aa-critical/20 rounded-lg text-aa-critical text-sm">
                {error}
              </div>
            )}

            {/* Manual scan button as fallback */}
            <button
              onClick={handleScan}
              disabled={scanning}
              className="mt-4 text-sm text-aa-muted hover:text-aa-text transition-colors flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <Icon name="sync" size={16} className="animate-spin" />
                  {scanProgress || 'Scanning...'}
                </>
              ) : (
                <>
                  <Icon name="refresh" size={16} />
                  Scan not starting? Click here
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-aa-text">Platform Status</h1>
                {data?.lastScanAt && (
                  <p className="text-sm text-aa-muted mt-1">
                    Last updated: {formatDate(data.lastScanAt)}
                  </p>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={scanning}
                className="flex items-center gap-2 text-aa-primary hover:text-aa-primary/80 transition-colors disabled:opacity-50"
              >
                <Icon name="refresh" size={20} className={scanning ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Platform status cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {PLATFORMS.map((platform) => {
                const prediction = data?.predictions?.[platform.id]
                const latestAlert = data?.latestAlerts?.[platform.id]
                const statusClasses = getStatusClasses(prediction)
                const statusLabel = getStatusLabel(prediction)

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`glass-card rounded-xl p-6 ${prediction?.daysUntilOverage <= 7 ? 'health-glow-critical' : prediction?.daysUntilOverage <= 14 ? 'health-glow-warning' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-aa-text">{platform.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses.bgLight} ${statusClasses.text}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {prediction ? (
                      <div className="space-y-3">
                        {/* Progress bar */}
                        <div className="h-2 bg-aa-border rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusClasses.bg} progress-animate`}
                            style={{ width: `${Math.min(prediction.lastThreshold || 50, 100)}%` }}
                          />
                        </div>

                        {/* Prediction */}
                        <div className="text-sm">
                          {prediction.daysUntilOverage <= 0 ? (
                            <span className="text-aa-critical font-medium">Over limit!</span>
                          ) : (
                            <>
                              <span className="text-aa-muted">Limit in </span>
                              <span className={`font-medium ${statusClasses.text}`}>
                                {prediction.daysUntilOverage} days
                              </span>
                            </>
                          )}
                        </div>

                        {/* Predicted date */}
                        <div className="text-xs text-aa-muted">
                          {formatDate(prediction.predictedOverageDate)}
                        </div>

                        {/* Confidence indicator */}
                        <div className="flex items-center gap-1 text-xs text-aa-muted">
                          <Icon name="info" size={12} />
                          {prediction.confidence} confidence ({prediction.dataPoints} data points)
                        </div>
                      </div>
                    ) : latestAlert ? (
                      <div className="space-y-2">
                        <div className="text-sm text-aa-text">
                          {latestAlert.summary || (latestAlert.threshold ? `Last alert: ${latestAlert.threshold}%` : 'Recent activity')}
                        </div>
                        <div className="text-xs text-aa-muted">
                          {formatDate(latestAlert.emailDate)}
                        </div>
                        <div className="text-xs text-aa-muted">
                          Need more data for predictions
                        </div>
                      </div>
                    ) : (
                      <div className="text-aa-muted text-sm">
                        No usage alerts found for {platform.name}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Predictions summary */}
            {Object.keys(data?.predictions || {}).length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
                  <Icon name="trending_up" size={24} className="text-aa-primary" />
                  Upcoming Limits
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.predictions)
                    .filter(([_, p]) => p.predictedOverageDate)
                    .sort((a, b) => new Date(a[1].predictedOverageDate) - new Date(b[1].predictedOverageDate))
                    .map(([platform, prediction]) => {
                      const platformInfo = PLATFORMS.find(p => p.id === platform)
                      const statusClasses = getStatusClasses(prediction)
                      return (
                        <div key={platform} className="flex items-center justify-between py-2 border-b border-aa-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${statusClasses.bg}`} />
                            <span className="text-aa-text font-medium">{platformInfo?.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-aa-text">
                              {formatDate(prediction.predictedOverageDate)}
                            </div>
                            <div className="text-xs text-aa-muted">
                              {prediction.daysUntilOverage > 0 ? `${prediction.daysUntilOverage} days` : 'Now'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Automation Errors */}
            {data?.errors?.length > 0 && (
              <div className="glass-card rounded-xl p-6 mt-6 border-l-4 border-aa-critical">
                <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
                  <Icon name="error" size={24} className="text-aa-critical" />
                  Automation Errors ({data.errors.length} recent)
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.errors.slice(0, 10).map((err) => {
                    const platformInfo = PLATFORMS.find(p => p.id === err.platform)
                    const isCritical = err.severity === 'critical'
                    return (
                      <div key={err.id} className={`p-4 rounded-lg border ${isCritical ? 'bg-aa-critical/5 border-aa-critical/20' : 'bg-aa-warning/5 border-aa-warning/20'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-aa-text capitalize">{platformInfo?.name || err.platform}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isCritical ? 'bg-aa-critical/20 text-aa-critical' : 'bg-aa-warning/20 text-aa-warning'}`}>
                              {err.severity?.toUpperCase() || err.category?.toUpperCase() || 'WARNING'}
                            </span>
                            {err.itemName && (
                              <span className="text-sm text-aa-muted">
                                {err.itemName}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-aa-muted flex-shrink-0">{formatDate(err.emailDate)}</span>
                        </div>
                        <p className={`text-sm ${isCritical ? 'text-aa-critical' : 'text-aa-warning'}`}>
                          {err.summary || err.errorMessage || err.emailSubject}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Custom Build Recommendations */}
            {platformsWithErrors.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-aa-text mb-2 flex items-center gap-2">
                  <Icon name="build" size={24} className="text-aa-accent" />
                  Outgrowing No-Code?
                </h2>
                <p className="text-aa-muted mb-6">
                  Based on your error patterns, here's what custom automation could do for you.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {platformsWithErrors.map((platformId) => {
                    const offer = CUSTOM_BUILD_OFFERS[platformId]
                    const platformInfo = PLATFORMS.find(p => p.id === platformId)
                    if (!offer) return null

                    return (
                      <div
                        key={platformId}
                        className="glass-card rounded-xl p-6 border-t-4 border-aa-accent"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-aa-primary px-2 py-0.5 bg-aa-primary/10 rounded">
                            {platformInfo?.name}
                          </span>
                        </div>

                        <h4 className="font-medium text-aa-text mb-3">{offer.problem}</h4>

                        <div className="mb-4">
                          <p className="text-xs text-aa-critical font-medium mb-2">The risks:</p>
                          <ul className="space-y-1">
                            {offer.risks.map((risk, i) => (
                              <li key={i} className="text-xs text-aa-muted flex items-start gap-2">
                                <Icon name="close" size={12} className="text-aa-critical mt-0.5 flex-shrink-0" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-aa-healthy/10 rounded-lg border border-aa-healthy/20 mb-4">
                          <p className="text-sm text-aa-healthy font-medium mb-2">The solution:</p>
                          <p className="text-sm text-aa-text">{offer.solution}</p>
                        </div>

                        <ul className="space-y-1 mb-4">
                          {offer.benefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-aa-muted flex items-start gap-2">
                              <Icon name="check" size={12} className="text-aa-healthy mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>

                        <a
                          href="https://cal.cameronobrien.dev/free"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-aa-accent text-white dark:text-black py-2 px-4 rounded-lg font-medium hover:bg-aa-accent/90 transition-colors text-sm"
                        >
                          Get a Custom Build Quote
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent alerts timeline */}
            {data?.alerts?.length > 0 && (
              <div className="glass-card rounded-xl p-6 mt-6">
                <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
                  <Icon name="history" size={24} className="text-aa-primary" />
                  Recent Activity ({data.stats?.totalAlerts || data.alerts.length} total)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.alerts.slice(0, 15).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between py-2 border-b border-aa-border last:border-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-medium bg-aa-border px-2 py-0.5 rounded capitalize flex-shrink-0">
                          {alert.platform}
                        </span>
                        <span className="text-sm text-aa-text truncate">
                          {alert.summary || (alert.threshold ? `${alert.threshold}% usage` : alert.emailSubject?.substring(0, 50) || 'Alert')}
                        </span>
                      </div>
                      <div className="text-xs text-aa-muted flex-shrink-0 ml-4">
                        {formatDate(alert.emailDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No predictions message */}
            {Object.keys(data?.predictions || {}).length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center mt-6">
                <Icon name="trending_up" size={48} className="text-aa-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-aa-text mb-2">No predictions yet</h3>
                <p className="text-aa-muted">
                  We need at least 2 usage alerts per platform to predict overage dates.
                  Keep using your tools and we'll analyze the patterns.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Beta feedback toast */}
      <BetaToast type="welcome" />

      {/* Footer */}
      <footer className="border-t border-aa-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-aa-muted">
            &copy; {new Date().getFullYear()} ClientFlow. All rights reserved.
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

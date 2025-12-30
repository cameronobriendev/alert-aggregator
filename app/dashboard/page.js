'use client'

import { useSession, signOut } from 'next-auth/react'
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

function getStatusColor(prediction) {
  if (!prediction) return 'aa-muted'
  const days = prediction.daysUntilOverage
  if (days <= 0) return 'aa-critical'
  if (days <= 7) return 'aa-critical'
  if (days <= 14) return 'aa-warning'
  return 'aa-healthy'
}

function getStatusLabel(prediction) {
  if (!prediction) return 'No data'
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
      router.push('/')
    }
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router, fetchData])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-aa-bg flex items-center justify-center">
        <div className="text-aa-muted">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
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
    setScanProgress('Refreshing...')
    try {
      const res = await fetch('/api/scan', { method: 'POST' })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setScanning(false)
      setScanProgress('')
    }
  }

  const hasScanned = data?.hasScanned

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
            <div className="flex items-center gap-3">
              <img
                src={session.user?.image}
                alt={session.user?.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-aa-muted hidden sm:block">{session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: 'https://www.clientflow.dev' })}
              className="text-aa-muted hover:text-aa-text transition-colors flex items-center gap-1"
            >
              <Icon name="logout" size={20} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasScanned ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto py-12"
          >
            <div className="w-20 h-20 bg-aa-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="email" size={40} className="text-aa-primary" />
            </div>
            <h1 className="text-3xl font-bold text-aa-text mb-4">
              Ready to scan your emails
            </h1>
            <p className="text-aa-muted mb-8">
              We'll search your Gmail for usage alerts from Zapier, Make.com, Airtable, and Bubble
              going back up to 3 years.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-aa-critical/10 border border-aa-critical/20 rounded-lg text-aa-critical text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={scanning}
              className="bg-aa-primary text-white px-8 py-4 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Icon name="sync" size={24} className="animate-spin" />
                  {scanProgress || 'Scanning...'}
                </>
              ) : (
                <>
                  <Icon name="history" size={24} />
                  Start Historical Scan
                </>
              )}
            </button>

            <p className="text-sm text-aa-muted mt-6">
              This may take a few minutes depending on your email volume.
            </p>
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
                const statusColor = getStatusColor(prediction)
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-${statusColor}/20 text-${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {prediction ? (
                      <div className="space-y-3">
                        {/* Progress bar */}
                        <div className="h-2 bg-aa-border rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${statusColor} progress-animate`}
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
                              <span className={`font-medium text-${statusColor}`}>
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
                          Last alert: {latestAlert.threshold}%
                        </div>
                        <div className="text-xs text-aa-muted">
                          {formatDate(latestAlert.email_date)}
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
            {Object.keys(data?.predictions || {}).length > 0 ? (
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
                      const statusColor = getStatusColor(prediction)
                      return (
                        <div key={platform} className="flex items-center justify-between py-2 border-b border-aa-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full bg-${statusColor}`} />
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
            ) : (
              <div className="glass-card rounded-xl p-8 text-center">
                <Icon name="trending_up" size={48} className="text-aa-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-aa-text mb-2">No predictions yet</h3>
                <p className="text-aa-muted">
                  We need at least 2 usage alerts per platform to predict overage dates.
                  Keep using your tools and we'll analyze the patterns.
                </p>
              </div>
            )}

            {/* Recent alerts timeline */}
            {data?.alerts?.length > 0 && (
              <div className="glass-card rounded-xl p-6 mt-6">
                <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
                  <Icon name="history" size={24} className="text-aa-primary" />
                  Recent Alerts ({data.alerts.length} total)
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.alerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between py-2 border-b border-aa-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-aa-text capitalize">{alert.platform}</span>
                        <span className="text-xs bg-aa-border px-2 py-0.5 rounded">{alert.threshold}%</span>
                      </div>
                      <div className="text-xs text-aa-muted">
                        {formatDate(alert.emailDate)}
                      </div>
                    </div>
                  ))}
                </div>
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

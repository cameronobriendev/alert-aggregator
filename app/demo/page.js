'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

// Mock data showing realistic usage patterns
const DEMO_DATA = {
  hasScanned: true,
  lastScanAt: new Date().toISOString(),
  predictions: {
    zapier: {
      daysUntilOverage: 5,
      predictedOverageDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      velocity_per_day: 3.2,
      confidence: 'high',
      dataPoints: 8,
      lastThreshold: 85,
    },
    make: {
      daysUntilOverage: 12,
      predictedOverageDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      velocity_per_day: 2.1,
      confidence: 'medium',
      dataPoints: 5,
      lastThreshold: 72,
    },
    airtable: {
      daysUntilOverage: 28,
      predictedOverageDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      velocity_per_day: 1.5,
      confidence: 'high',
      dataPoints: 12,
      lastThreshold: 45,
    },
    bubble: {
      daysUntilOverage: 3,
      predictedOverageDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      velocity_per_day: 4.8,
      confidence: 'medium',
      dataPoints: 4,
      lastThreshold: 92,
    },
  },
  alerts: [
    { id: 1, platform: 'bubble', threshold: 90, emailDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, platform: 'zapier', threshold: 85, emailDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, platform: 'make', threshold: 75, emailDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, platform: 'zapier', threshold: 75, emailDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 5, platform: 'bubble', threshold: 75, emailDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 6, platform: 'airtable', threshold: 50, emailDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 7, platform: 'make', threshold: 50, emailDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 8, platform: 'zapier', threshold: 50, emailDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  ],
}

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

export default function DemoPage() {
  const router = useRouter()
  const data = DEMO_DATA

  return (
    <div className="min-h-screen bg-aa-bg">
      {/* Demo Banner */}
      <div className="bg-aa-primary text-white py-2 px-4 text-center text-sm">
        <span className="font-medium">Demo Mode</span> - This is sample data showing what ClientFlow looks like in action.{' '}
        <button
          onClick={() => router.push('/')}
          className="underline hover:no-underline font-medium"
        >
          Sign up free to connect your Gmail
        </button>
      </div>

      {/* Header */}
      <header className="border-b border-aa-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="ClientFlow" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-aa-text">ClientFlow</span>
            <span className="text-xs bg-aa-primary/20 text-aa-primary px-2 py-0.5 rounded-full font-medium">DEMO</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push('/')}
              className="bg-aa-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name="login" size={20} />
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-aa-text">Platform Status</h1>
              <p className="text-sm text-aa-muted mt-1">
                Sample data from a typical no-code agency
              </p>
            </div>
            <div className="flex items-center gap-2 text-aa-muted text-sm">
              <Icon name="info" size={16} />
              Demo data refreshes on page load
            </div>
          </div>

          {/* Platform status cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {PLATFORMS.map((platform) => {
              const prediction = data.predictions[platform.id]
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
                      <span className="text-aa-muted">Limit in </span>
                      <span className={`font-medium text-${statusColor}`}>
                        {prediction.daysUntilOverage} days
                      </span>
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
                </motion.div>
              )
            })}
          </div>

          {/* Predictions summary */}
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

          {/* Recent alerts timeline */}
          <div className="glass-card rounded-xl p-6 mt-6">
            <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
              <Icon name="history" size={24} className="text-aa-primary" />
              Recent Alerts ({data.alerts.length} total)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.alerts.map((alert) => (
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

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-aa-text mb-2">
                Ready to see your actual usage?
              </h2>
              <p className="text-aa-muted mb-6">
                Connect your Gmail and we'll scan for usage alerts from your no-code platforms.
                Free during beta.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-aa-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-aa-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Icon name="email" size={20} />
                Connect Gmail Free
              </button>
            </div>
          </motion.div>
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

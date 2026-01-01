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
    { id: 1, platform: 'bubble', threshold: 92, emailDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, platform: 'zapier', threshold: 85, emailDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, platform: 'make', threshold: 72, emailDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, platform: 'airtable', threshold: 45, emailDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  // Error notifications from platforms
  errors: [
    {
      id: 1,
      platform: 'zapier',
      errorType: 'auth_failed',
      severity: 'critical',
      itemName: 'HubSpot (Sales CRM)',
      errorMessage: 'Authentication failed - reconnection required',
      emailDate: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      platform: 'make',
      errorType: 'connection_reauth',
      severity: 'critical',
      itemName: 'Google Sheets',
      errorMessage: 'Connection authentication failed - reauthorization required',
      emailDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      platform: 'zapier',
      errorType: 'zap_turned_off',
      severity: 'critical',
      itemName: 'New Lead to CRM',
      errorMessage: 'Zap was automatically turned off due to errors',
      errorCount: 12,
      emailDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      platform: 'airtable',
      errorType: 'automation_failure',
      severity: 'critical',
      itemName: 'Send Weekly Report',
      errorMessage: 'Automation failed 8 times this week',
      errorCount: 8,
      emailDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      platform: 'make',
      errorType: 'scenario_deactivated',
      severity: 'critical',
      itemName: 'Order Processing',
      errorMessage: 'Scenario was automatically stopped due to repeated errors',
      emailDate: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 6,
      platform: 'bubble',
      errorType: 'app_offline',
      severity: 'critical',
      itemName: 'Customer Portal',
      errorMessage: 'App taken offline due to workload limit (overages disabled)',
      emailDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 7,
      platform: 'zapier',
      errorType: 'payment_failed',
      severity: 'critical',
      itemName: null,
      errorMessage: 'Payment failed - service may be suspended',
      emailDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

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

const PLATFORMS = [
  { id: 'zapier', name: 'Zapier', metric: 'tasks' },
  { id: 'make', name: 'Make.com', metric: 'operations' },
  { id: 'airtable', name: 'Airtable', metric: 'automations' },
  { id: 'bubble', name: 'Bubble', metric: 'workload units' },
]

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
          onClick={() => router.push('/signup')}
          className="underline hover:no-underline font-medium"
        >
          Sign up free to connect your Gmail
        </button>
      </div>

      {/* Header */}
      <header className="border-b border-aa-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="ClientFlow" className="h-8 w-auto" />
              <span className="text-xl font-semibold text-aa-text">ClientFlow</span>
            </a>
            <span className="text-xs bg-aa-primary/20 text-aa-primary px-2 py-0.5 rounded-full font-medium">DEMO</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push('/signup')}
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
                Sample data showing what ClientFlow tracks
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
                      <span className="text-aa-muted">Limit in </span>
                      <span className={`font-medium ${statusClasses.text}`}>
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

          {/* Automation Errors */}
          <div className="glass-card rounded-xl p-6 mt-6 border-l-4 border-aa-critical">
            <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
              <Icon name="error" size={24} className="text-aa-critical" />
              Automation Errors ({data.errors.length} recent)
            </h3>
            <div className="space-y-4">
              {data.errors.map((error) => {
                const platformInfo = PLATFORMS.find(p => p.id === error.platform)
                const isCritical = error.severity === 'critical'
                return (
                  <div key={error.id} className={`p-4 rounded-lg border ${isCritical ? 'bg-aa-critical/5 border-aa-critical/20' : 'bg-aa-warning/5 border-aa-warning/20'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-aa-text capitalize">{platformInfo?.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isCritical ? 'bg-aa-critical/20 text-aa-critical' : 'bg-aa-warning/20 text-aa-warning'}`}>
                          {error.severity?.toUpperCase() || 'WARNING'}
                        </span>
                        {error.itemName && (
                          <span className="text-sm text-aa-muted">
                            {error.itemName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-aa-muted">{formatDate(error.emailDate)}</span>
                    </div>
                    <p className={`text-sm ${isCritical ? 'text-aa-critical' : 'text-aa-warning'}`}>{error.errorMessage}</p>
                    {error.errorCount > 3 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Icon name="warning" size={14} className="text-aa-warning" />
                        <span className="text-xs text-aa-warning">
                          Recurring issue - failed {error.errorCount} times
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Build Recommendations */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-aa-text mb-2 flex items-center gap-2">
              <Icon name="build" size={24} className="text-aa-accent" />
              Outgrowing No-Code?
            </h2>
            <p className="text-aa-muted mb-6">
              Based on your error patterns, here's what custom automation could do for you.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {data.errors.slice(0, 2).map((error) => {
                const offer = CUSTOM_BUILD_OFFERS[error.platform]
                const platformInfo = PLATFORMS.find(p => p.id === error.platform)
                if (!offer) return null

                return (
                  <div
                    key={error.id}
                    className="bg-aa-card rounded-xl p-6 border border-aa-border border-t-4 border-t-aa-accent shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-aa-primary px-2 py-0.5 bg-aa-primary/10 rounded">
                        {platformInfo?.name}
                      </span>
                      {error.itemName && (
                        <span className="text-sm text-aa-muted">{error.itemName}</span>
                      )}
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
                      href="/help"
                      className="block w-full text-center bg-aa-accent text-black py-2 px-4 rounded-lg font-medium hover:bg-aa-accent/90 transition-colors text-sm"
                    >
                      Get Help
                    </a>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent alerts timeline */}
          <div className="glass-card rounded-xl p-6 mt-6">
            <h3 className="text-lg font-medium text-aa-text mb-4 flex items-center gap-2">
              <Icon name="history" size={24} className="text-aa-primary" />
              Recent Usage Alerts ({data.alerts.length} total)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-2 border-b border-aa-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-aa-text capitalize">{alert.platform}</span>
                    <span className="text-xs bg-aa-border px-2 py-0.5 rounded">{alert.threshold}% of limit</span>
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
                onClick={() => router.push('/signup')}
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

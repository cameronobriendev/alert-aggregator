'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

const ADMIN_EMAIL = 'cameronobriendev@gmail.com'

function formatDate(dateString) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(dateString) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

function StatusBadge({ status }) {
  const styles = {
    complete: 'bg-aa-healthy/20 text-aa-healthy',
    scanning: 'bg-aa-primary/20 text-aa-primary',
    pending: 'bg-aa-warning/20 text-aa-warning',
    error: 'bg-aa-critical/20 text-aa-critical',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-aa-muted/20 text-aa-muted'}`}>
      {status || 'unknown'}
    </span>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email === ADMIN_EMAIL) {
      fetchUsers()
    }
  }, [status, session])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  if (session.user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-aa-bg flex items-center justify-center">
        <div className="text-center">
          <Icon name="lock" size={48} className="text-aa-critical mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-aa-text mb-2">Access Denied</h1>
          <p className="text-aa-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    )
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
            <span className="text-xs bg-aa-critical/20 text-aa-critical px-2 py-0.5 rounded-full font-medium">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-aa-muted hover:text-aa-text transition-colors">
              Dashboard
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-aa-text">Admin Panel</h1>
            <p className="text-sm text-aa-muted mt-1">
              {users.length} registered users
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 text-aa-primary hover:text-aa-primary/80 transition-colors disabled:opacity-50"
          >
            <Icon name="refresh" size={20} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-aa-critical/10 border border-aa-critical/20 rounded-lg text-aa-critical">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Icon name="sync" size={32} className="text-aa-primary animate-spin mx-auto mb-4" />
            <p className="text-aa-muted">Loading users...</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-aa-border/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-aa-muted">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-aa-muted">Signed Up</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-aa-muted">Scan Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-aa-muted">Last Scan</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-aa-muted">Alerts</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-aa-muted">Errors</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-aa-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aa-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-aa-border/10 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-aa-text">{user.name || 'Unknown'}</div>
                          <div className="text-sm text-aa-muted">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-aa-muted">
                        {formatRelative(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.scanStatus} />
                        {user.scanError && (
                          <div className="text-xs text-aa-critical mt-1 max-w-[200px] truncate" title={user.scanError}>
                            {user.scanError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-aa-muted">
                        {formatRelative(user.lastScanAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-aa-text font-medium">{user.totalAlerts}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.errorCount > 0 ? (
                          <span className="text-aa-critical font-medium">{user.errorCount}</span>
                        ) : (
                          <span className="text-aa-muted">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/dashboard?as=${encodeURIComponent(user.email)}`)}
                          className="inline-flex items-center gap-1 text-sm text-aa-primary hover:text-aa-primary/80 transition-colors"
                        >
                          <Icon name="visibility" size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Icon name="people" size={48} className="text-aa-muted mx-auto mb-4" />
                <p className="text-aa-muted">No users yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

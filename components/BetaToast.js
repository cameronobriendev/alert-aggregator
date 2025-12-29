'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/icons/Icon'

const LINKEDIN_URL = 'https://linkedin.com/in/cameronobrien'
const EMAIL = 'cameron@cameronobrien.dev'

export default function BetaToast({ type = 'welcome' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if we've already shown the welcome toast this session
    if (type === 'welcome') {
      const hasSeenWelcome = sessionStorage.getItem('beta-welcome-shown')
      if (!hasSeenWelcome) {
        const timer = setTimeout(() => {
          setIsVisible(true)
          sessionStorage.setItem('beta-welcome-shown', 'true')
        }, 1500)
        return () => clearTimeout(timer)
      }
    } else {
      // Show error/success toasts immediately
      setIsVisible(true)
    }
  }, [type])

  const messages = {
    welcome: {
      title: 'Welcome to the beta!',
      message: 'Your feedback shapes this product. Something feel off? DM me on LinkedIn or email me. I\'ll fix issues within 24 hours. Your voice matters!',
      icon: 'notifications',
    },
    scan_success: {
      title: 'Email history analyzed',
      message: 'This beta learns from real usage. Spot something wrong? Let me know and I\'ll make it right.',
      icon: 'check_circle',
    },
    error: {
      title: 'Hmm, that didn\'t work',
      message: 'This is a beta, so bugs happen! Shoot me a quick message and I\'ll fix it within 24 hours.',
      icon: 'error',
    },
  }

  const config = messages[type] || messages.welcome

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-4 right-4 max-w-sm z-50"
      >
        <div className="glass-card rounded-xl p-4 shadow-lg border border-aa-border">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <Icon
                name={config.icon}
                size={24}
                className={type === 'error' ? 'text-aa-critical' : 'text-aa-primary'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-aa-text mb-1">{config.title}</h4>
              <p className="text-sm text-aa-muted mb-3">{config.message}</p>

              <div className="flex items-center gap-3">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-aa-primary hover:text-aa-primary/80 transition-colors flex items-center gap-1"
                >
                  <Icon name="link" size={14} />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-xs text-aa-primary hover:text-aa-primary/80 transition-colors flex items-center gap-1"
                >
                  <Icon name="email" size={14} />
                  Email
                </a>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="shrink-0 text-aa-muted hover:text-aa-text transition-colors"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to show error toasts
export function useBetaToast() {
  const [toast, setToast] = useState(null)

  const showError = (message) => {
    setToast({ type: 'error', message })
  }

  const showSuccess = (message) => {
    setToast({ type: 'scan_success', message })
  }

  const hideToast = () => {
    setToast(null)
  }

  return { toast, showError, showSuccess, hideToast }
}

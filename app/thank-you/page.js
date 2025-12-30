'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

export default function ThankYou() {
  const router = useRouter()

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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-aa-healthy/20 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <Icon name="check_circle" size={56} className="text-aa-healthy" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-aa-text mb-4">
            You're on the list!
          </h1>

          <p className="text-xl text-aa-muted mb-8">
            Cameron will set up your account<br />
            and email you when it's ready.<br />
            Usually within 24 hours. Often much faster.
          </p>

          <div className="bg-aa-card border border-aa-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-aa-text mb-2">What happens next?</h2>
            <ul className="text-aa-muted text-left space-y-2">
              <li className="flex items-start gap-2">
                <Icon name="check" size={18} className="text-aa-healthy mt-0.5 flex-shrink-0" />
                <span>Cameron reviews your signup</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size={18} className="text-aa-healthy mt-0.5 flex-shrink-0" />
                <span>Your account gets created</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size={18} className="text-aa-healthy mt-0.5 flex-shrink-0" />
                <span>You get an email with login instructions</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => router.push('/')}
            className="text-aa-primary hover:underline flex items-center gap-2 mx-auto"
          >
            <Icon name="arrow_back" size={18} />
            Back to home
          </button>
        </motion.div>
      </main>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Icon from '@/components/icons/Icon'

export default function Help() {
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
          <div className="w-20 h-20 bg-aa-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="info" size={40} className="text-aa-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-aa-text mb-6">
            Welcome to the beta!
          </h1>

          <p className="text-lg text-aa-muted mb-8 leading-relaxed">
            Your feedback shapes this product. Something feel off?<br />
            DM me on LinkedIn or email me.<br />
            I'll fix issues within 24 hours. Your voice matters!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="https://linkedin.com/in/cameronobriendev"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0A66C2] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0A66C2]/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a
              href="mailto:cameron@cameronobrien.dev"
              className="bg-aa-card border border-aa-border text-aa-text px-6 py-3 rounded-xl font-medium hover:bg-aa-border/30 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="email" size={20} />
              Email
            </a>
          </div>

          <button
            onClick={() => router.back()}
            className="text-aa-primary hover:underline flex items-center gap-2 mx-auto"
          >
            <Icon name="arrow_back" size={18} />
            Go back
          </button>
        </motion.div>
      </main>
    </div>
  )
}

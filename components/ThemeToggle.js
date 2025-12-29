'use client'

import { motion } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import Icon from '@/components/icons/Icon'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-aa-border/50 transition-colors text-aa-muted hover:text-aa-text"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} size={24} />
      </motion.div>
    </button>
  )
}

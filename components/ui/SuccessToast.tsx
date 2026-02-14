'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  show: boolean
  message: string
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export default function SuccessToast({ 
  show, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: Props) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, autoClose, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-green-400/50 p-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-3xl"
              >
                ✨
              </motion.div>
              <div className="flex-1">
                <p className="text-white font-semibold">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

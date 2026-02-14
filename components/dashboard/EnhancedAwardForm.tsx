'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { KidWithBalance } from '@/lib/types/database'

interface Props {
  kids: KidWithBalance[]
  familyId: string
  userId: string
  onSuccess: () => void
}

export default function EnhancedAwardForm({ kids, familyId, userId, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedKid, setSelectedKid] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deductMode, setDeductMode] = useState(false)

  const quickAmounts = [10, 25, 50, 100]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKid || !amount) return

    setLoading(true)
    setError('')

    try {
      const pointAmount = deductMode ? -Math.abs(parseInt(amount)) : parseInt(amount)
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          family_id: familyId,
          kid_id: selectedKid,
          amount: pointAmount,
          reason: reason || (deductMode ? 'Points deducted' : 'Points awarded'),
          transaction_type: deductMode ? 'adjustment' : 'award',
          created_by: userId,
        })

      if (error) throw error

      // Clear form
      setAmount('')
      setReason('')
      
      // Success callback
      onSuccess()
      
      // Refresh after brief delay
      setTimeout(() => {
        router.refresh()
      }, 800)
    } catch (err: any) {
      setError(err.message || 'Failed to process transaction')
    } finally {
      setLoading(false)
    }
  }

  const selectedKidData = kids.find(k => k.id === selectedKid)

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Manual Entry</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDeductMode(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !deductMode 
                ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Award
          </button>
          <button
            onClick={() => setDeductMode(true)}
            className={`px-4 py-2 rounded-lg transition-all ${
              deductMode 
                ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Deduct
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kid Selection */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            Select Kid
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kids.map((kid) => (
              <motion.button
                key={kid.id}
                type="button"
                onClick={() => setSelectedKid(kid.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedKid === kid.id
                    ? 'border-indigo-500 bg-indigo-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold text-white">{kid.name}</div>
                <div className="text-sm text-white/60 mt-1">{kid.balance} pts</div>
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedKid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Quick Amount
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`py-3 rounded-lg border transition-all ${
                        amount === quickAmount.toString()
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <Input
                label="Custom Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                required
              />

              {/* Reason */}
              <Input
                label="Reason (optional)"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Cleaned room"
              />

              {/* Preview */}
              <div className={`p-4 rounded-lg border ${
                deductMode 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60">Preview</div>
                    <div className="text-white font-medium mt-1">
                      {selectedKidData?.name} • {selectedKidData?.balance} pts
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${
                    deductMode ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {deductMode ? '-' : '+'}{amount || '0'}
                  </div>
                </div>
                {amount && (
                  <div className="text-sm text-white/60 mt-2">
                    New balance: {selectedKidData ? selectedKidData.balance + (deductMode ? -parseInt(amount) : parseInt(amount)) : '—'} pts
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading || !amount}
                className="w-full text-lg py-4"
              >
                {loading ? 'Processing...' : `${deductMode ? 'Deduct' : 'Award'} Points`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Card>
  )
}

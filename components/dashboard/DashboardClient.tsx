'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Confetti from '@/components/ui/Confetti'
import { Family, KidWithBalance, TransactionWithKid, FamilySettings } from '@/lib/types/database'
import Link from 'next/link'

interface Props {
  family: Family | null
  kids: KidWithBalance[]
  transactions: TransactionWithKid[]
  settings: FamilySettings | null
  userId: string
  familyId: string
}

export default function DashboardClient({ family, kids, transactions, settings, userId, familyId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedKid, setSelectedKid] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [deductMode, setDeductMode] = useState(false)

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKid || !amount) return

    setLoading(true)
    setError('')
    setSuccess('')

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

      setSuccess(deductMode ? 'Points deducted successfully!' : 'Points awarded successfully!')
      setAmount('')
      setReason('')
      
      if (!deductMode) {
        setShowConfetti(true)
      }
      
      // Refresh the page data
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Failed to process transaction')
    } finally {
      setLoading(false)
    }
  }

  const quickAward = async (kidId: string, points: number, taskType: string) => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          family_id: familyId,
          kid_id: kidId,
          amount: points,
          reason: `${taskType} task completed`,
          transaction_type: 'award',
          created_by: userId,
        })

      if (error) throw error

      setShowConfetti(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to award points')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const totalPoints = kids.reduce((sum, kid) => sum + kid.balance, 0)
  const mostActiveKid = kids.length > 0
    ? kids.reduce((max, kid) => kid.balance > max.balance ? kid : max, kids[0])
    : null

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'gold': return 'from-yellow-500 to-orange-500'
      case 'silver': return 'from-gray-300 to-gray-500'
      default: return 'from-amber-700 to-amber-900'
    }
  }

  const getLevelEmoji = (level?: string) => {
    switch (level) {
      case 'gold': return '🏆'
      case 'silver': return '🥈'
      default: return '🥉'
    }
  }

  return (
    <>
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                {family?.name || 'Dashboard'}
              </h1>
              <p className="text-white/60">Parent Dashboard</p>
            </div>
            <div className="flex gap-3">
              <Link href="/settings">
                <Button variant="secondary">⚙️ Settings</Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <Card className="text-center">
              <p className="text-white/60 text-sm mb-1">Total Kids</p>
              <p className="text-3xl font-bold gradient-text">{kids.length}</p>
            </Card>
            <Card className="text-center">
              <p className="text-white/60 text-sm mb-1">Total Points</p>
              <p className="text-3xl font-bold gradient-text">{totalPoints}</p>
            </Card>
            <Card className="text-center">
              <p className="text-white/60 text-sm mb-1">Leading</p>
              <p className="text-3xl font-bold gradient-text">
                {mostActiveKid?.name || '—'}
              </p>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Kids overview with quick awards */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Kids</h2>
              <div className="space-y-4">
                {kids.map((kid, index) => (
                  <motion.div
                    key={kid.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card hover>
                      <div className="space-y-4">
                        {/* Kid info */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(kid.level)} flex items-center justify-center text-2xl`}>
                              {getLevelEmoji(kid.level)}
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white">{kid.name}</h3>
                              <p className="text-sm text-white/60">
                                {kid.age} years • {kid.level || 'bronze'} level
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold gradient-text">
                              {kid.balance}
                            </p>
                            <p className="text-xs text-white/60">
                              ${(kid.balance * (settings?.conversion_rate || 0.01)).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Quick award buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => quickAward(kid.id, settings?.point_values.small || 10, 'Small')}
                            disabled={loading}
                            className="py-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          >
                            <div className="text-2xl mb-1">⭐</div>
                            <div className="text-xs text-white/80">Small</div>
                            <div className="text-sm font-bold text-white">+{settings?.point_values.small || 10}</div>
                          </button>
                          <button
                            onClick={() => quickAward(kid.id, settings?.point_values.medium || 25, 'Medium')}
                            disabled={loading}
                            className="py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          >
                            <div className="text-2xl mb-1">🌟</div>
                            <div className="text-xs text-white/80">Medium</div>
                            <div className="text-sm font-bold text-white">+{settings?.point_values.medium || 25}</div>
                          </button>
                          <button
                            onClick={() => quickAward(kid.id, settings?.point_values.large || 50, 'Large')}
                            disabled={loading}
                            className="py-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          >
                            <div className="text-2xl mb-1">✨</div>
                            <div className="text-xs text-white/80">Large</div>
                            <div className="text-sm font-bold text-white">+{settings?.point_values.large || 50}</div>
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {kids.length === 0 && (
                  <Card>
                    <p className="text-center text-white/40">No kids added yet</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Award/Deduct points form */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Manual Entry</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeductMode(false)}
                    className={`px-4 py-2 rounded-lg transition-all ${!deductMode ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400' : 'bg-white/5 text-white/60'}`}
                  >
                    Award
                  </button>
                  <button
                    onClick={() => setDeductMode(true)}
                    className={`px-4 py-2 rounded-lg transition-all ${deductMode ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400' : 'bg-white/5 text-white/60'}`}
                  >
                    Deduct
                  </button>
                </div>
              </div>

              <Card>
                <form onSubmit={handleAwardPoints} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Select Kid
                    </label>
                    <select
                      value={selectedKid}
                      onChange={(e) => setSelectedKid(e.target.value)}
                      className="input-glass"
                      required
                    >
                      <option value="">Choose a kid...</option>
                      {kids.map((kid) => (
                        <option key={kid.id} value={kid.id}>
                          {kid.name} ({kid.balance} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter points"
                    required
                  />

                  <Input
                    label="Reason (optional)"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={deductMode ? "e.g., Broke house rule" : "e.g., Cleaned room"}
                  />

                  {/* Quick amount buttons (only for award mode) */}
                  {!deductMode && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAmount(String(settings?.point_values.small || 10))}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                      >
                        {settings?.point_values.small || 10}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmount(String(settings?.point_values.medium || 25))}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                      >
                        {settings?.point_values.medium || 25}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmount(String(settings?.point_values.large || 50))}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                      >
                        {settings?.point_values.large || 50}
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                      >
                        {success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className={`w-full ${deductMode ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  >
                    {loading ? 'Processing...' : deductMode ? 'Deduct Points' : 'Award Points'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          {/* Recent activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
            <Card>
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {tx.amount > 0 ? '✨' : '📉'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {(tx.kid as any)?.name}
                        </p>
                        <p className="text-sm text-white/60">{tx.reason}</p>
                        <p className="text-xs text-white/40">
                          {new Date(tx.created_at).toLocaleDateString()} at{' '}
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </motion.div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-white/40">No activity yet</p>
                    <p className="text-sm text-white/30 mt-2">Award some points to get started!</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}

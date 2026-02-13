'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedKid || !amount) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          family_id: familyId,
          kid_id: selectedKid,
          amount: parseInt(amount),
          reason: reason || 'Points awarded',
          transaction_type: 'award',
          created_by: userId,
        })

      if (error) throw error

      setSuccess('Points awarded successfully!')
      setAmount('')
      setReason('')
      
      // Refresh the page data
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              {family?.name || 'Dashboard'}
            </h1>
            <p className="text-white/60">Admin Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings">
              <Button variant="secondary">⚙️ Settings</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <p className="text-white/60 text-sm mb-1">Total Kids</p>
            <p className="text-3xl font-bold gradient-text">{kids.length}</p>
          </Card>
          <Card className="text-center">
            <p className="text-white/60 text-sm mb-1">Total Points Awarded</p>
            <p className="text-3xl font-bold gradient-text">{totalPoints}</p>
          </Card>
          <Card className="text-center">
            <p className="text-white/60 text-sm mb-1">Most Active</p>
            <p className="text-3xl font-bold gradient-text">
              {mostActiveKid?.name || '—'}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kids overview */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Kids</h2>
            <div className="space-y-3">
              {kids.map((kid) => (
                <Card key={kid.id} hover>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{kid.name}</h3>
                      <p className="text-sm text-white/60">{kid.age} years old</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">
                        {kid.balance}
                      </p>
                      <p className="text-xs text-white/60">
                        ${(kid.balance * (settings?.conversion_rate || 0.01)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {kids.length === 0 && (
                <Card>
                  <p className="text-center text-white/40">No kids added yet</p>
                </Card>
              )}
            </div>
          </div>

          {/* Award points form */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Award Points</h2>
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
                        {kid.name}
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
                  placeholder="e.g., Cleaned room"
                />

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(String(settings?.point_values.small || 10))}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    Small ({settings?.point_values.small || 10})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(String(settings?.point_values.medium || 25))}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    Medium ({settings?.point_values.medium || 25})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(String(settings?.point_values.large || 50))}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                  >
                    Large ({settings?.point_values.large || 50})
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    {success}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Awarding...' : 'Award Points'}
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <Card>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                >
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
                  <div className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-white/40 py-8">No activity yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { KidWithBalance, Transaction, FamilySettings } from '@/lib/types/database'

interface Props {
  kid: KidWithBalance
  transactions: Transaction[]
  settings: FamilySettings | null
}

export default function KidDashboardClient({ kid, transactions, settings }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const dollarValue = kid.balance * (settings?.conversion_rate || 0.01)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Hey, {kid.name}! 👋
            </h1>
            <p className="text-white/60">Your Points Dashboard</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Balance Card - Big and prominent */}
        <Card className="mb-8 text-center py-12">
          <p className="text-white/60 text-lg mb-4">Your Balance</p>
          <div className="mb-6">
            <p className="text-7xl md:text-8xl font-bold gradient-text mb-2 animate-glow">
              {kid.balance}
            </p>
            <p className="text-2xl text-white/80">
              points
            </p>
          </div>
          <div className="inline-block px-6 py-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm">Worth</p>
            <p className="text-3xl font-bold text-green-400">
              ${dollarValue.toFixed(2)}
            </p>
          </div>
        </Card>

        {/* Placeholder for future features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="text-center py-8 opacity-50">
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-white/60">Quests</p>
            <p className="text-xs text-white/40 mt-1">Coming Soon</p>
          </Card>
          <Card className="text-center py-8 opacity-50">
            <p className="text-4xl mb-2">🎁</p>
            <p className="text-white/60">Rewards Store</p>
            <p className="text-xs text-white/40 mt-1">Coming Soon</p>
          </Card>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <Card>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{tx.reason}</p>
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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('family_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.family_id) {
    redirect('/onboarding')
  }

  if (userData.role === 'kid') {
    redirect('/kid')
  }

  // Fetch family data
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', userData.family_id)
    .single()

  // Fetch kids with balances
  const { data: kids } = await supabase
    .from('kids')
    .select('*')
    .eq('family_id', userData.family_id)
    .order('created_at', { ascending: true })

  // Get balances for each kid
  const kidsWithBalances = await Promise.all(
    (kids || []).map(async (kid) => {
      const { data } = await supabase.rpc('get_kid_balance', { kid_uuid: kid.id })
      return { ...kid, balance: data || 0 }
    })
  )

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      kid:kids(name)
    `)
    .eq('family_id', userData.family_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch settings
  const { data: settings } = await supabase
    .from('family_settings')
    .select('*')
    .eq('family_id', userData.family_id)
    .single()

  // Fetch pending claimed tasks (Phase 1)
  const { data: pendingTasks } = await supabase
    .from('claimed_tasks')
    .select(`
      *,
      task_template:task_templates(*),
      kid:kids(name, id)
    `)
    .eq('family_id', userData.family_id)
    .in('status', ['pending_approval', 'completed'])
    .order('completed_at', { ascending: false })

  // Fetch family-wide gamification stats
  const totalPoints = kidsWithBalances.reduce((sum, kid) => sum + (kid.total_earned || 0), 0)
  
  const { count: achievementCount } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true })
    .in('kid_id', kidsWithBalances.map(k => k.id))
  
  const { data: streaks } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .in('kid_id', kidsWithBalances.map(k => k.id))
  
  const activeStreaks = streaks?.filter(s => s.current_streak > 0).length || 0
  const longestStreak = Math.max(...(streaks?.map(s => s.longest_streak) || [0]))
  
  const topKid = kidsWithBalances.length > 0
    ? kidsWithBalances.reduce((max, kid) => 
        (kid.total_earned || 0) > (max.total_earned || 0) ? kid : max
      )
    : null
  
  const familyStats = {
    totalKids: kidsWithBalances.length,
    totalPoints,
    totalAchievements: achievementCount || 0,
    activeStreaks,
    longestStreak,
    topKid: topKid ? { name: topKid.name, points: topKid.total_earned || 0 } : null
  }

  return (
    <DashboardClient
      family={family}
      kids={kidsWithBalances}
      transactions={transactions || []}
      settings={settings}
      pendingTasks={pendingTasks || []}
      userId={user.id}
      familyId={userData.family_id}
      familyStats={familyStats}
    />
  )
}

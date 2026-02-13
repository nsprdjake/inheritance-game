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

  return (
    <DashboardClient
      family={family}
      kids={kidsWithBalances}
      transactions={transactions || []}
      settings={settings}
      userId={user.id}
      familyId={userData.family_id}
    />
  )
}

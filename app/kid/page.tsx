import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KidDashboardClient from '@/components/dashboard/KidDashboardClient'

export default async function KidDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('family_id, role, kid_id')
    .eq('id', user.id)
    .single()

  if (!userData?.family_id || userData.role !== 'kid' || !userData.kid_id) {
    redirect('/dashboard')
  }

  // Fetch kid data
  const { data: kid } = await supabase
    .from('kids')
    .select('*')
    .eq('id', userData.kid_id)
    .single()

  if (!kid) {
    redirect('/dashboard')
  }

  // Get balance
  const { data: balance } = await supabase.rpc('get_kid_balance', { kid_uuid: kid.id })

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('kid_id', kid.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch settings
  const { data: settings } = await supabase
    .from('family_settings')
    .select('*')
    .eq('family_id', userData.family_id)
    .single()

  const kidWithBalance = { ...kid, balance: balance || 0 }

  return (
    <KidDashboardClient
      kid={kidWithBalance}
      transactions={transactions || []}
      settings={settings}
    />
  )
}

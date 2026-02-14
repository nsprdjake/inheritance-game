import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SkillsPageClient from '@/components/kid/SkillsPageClient'

export default async function SkillsPage() {
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

  // Fetch recent skill gains (from transactions)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('kid_id', kid.id)
    .eq('transaction_type', 'award')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <SkillsPageClient 
      kid={kid} 
      recentTransactions={recentTransactions || []}
    />
  )
}

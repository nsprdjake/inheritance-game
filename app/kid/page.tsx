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

  // Try to fetch achievements (may fail if table doesn't exist yet)
  let achievements = []
  try {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('kid_id', kid.id)
      .order('unlocked_at', { ascending: false })
    achievements = data || []
  } catch (e) {
    console.log('Achievements table not yet available')
  }

  // Try to fetch streak (may fail if table doesn't exist yet)
  let streak = null
  try {
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('kid_id', kid.id)
      .single()
    streak = data
  } catch (e) {
    console.log('Streaks table not yet available')
  }

  // Phase 1: Fetch available tasks
  let availableTasks = []
  try {
    const { data } = await supabase
      .from('task_templates')
      .select('*')
      .eq('family_id', userData.family_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    availableTasks = data || []
  } catch (e) {
    console.log('Task templates table not yet available')
  }

  // Phase 1: Fetch claimed tasks
  let claimedTasks = []
  try {
    const { data } = await supabase
      .from('claimed_tasks')
      .select(`
        *,
        task_template:task_templates(*)
      `)
      .eq('kid_id', kid.id)
      .in('status', ['claimed', 'completed', 'pending_approval'])
      .order('claimed_at', { ascending: false })
    claimedTasks = data || []
  } catch (e) {
    console.log('Claimed tasks table not yet available')
  }

  // Phase 1: Fetch educational modules
  let educationalModules = []
  try {
    const { data } = await supabase
      .from('educational_modules')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    educationalModules = data || []
  } catch (e) {
    console.log('Educational modules table not yet available')
  }

  // Phase 1: Fetch module progress
  let moduleProgress = []
  try {
    const { data } = await supabase
      .from('module_progress')
      .select(`
        *,
        module:educational_modules(*)
      `)
      .eq('kid_id', kid.id)
      .order('last_accessed_at', { ascending: false })
    moduleProgress = data || []
  } catch (e) {
    console.log('Module progress table not yet available')
  }

  // Phase 1: Fetch savings goals
  let savingsGoals = []
  try {
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('kid_id', kid.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
    savingsGoals = data || []
  } catch (e) {
    console.log('Savings goals table not yet available')
  }

  const kidWithBalance = { ...kid, balance: balance || 0 }

  return (
    <KidDashboardClient
      kid={kidWithBalance}
      transactions={transactions || []}
      settings={settings}
      achievements={achievements}
      streak={streak}
      availableTasks={availableTasks}
      claimedTasks={claimedTasks}
      educationalModules={educationalModules}
      moduleProgress={moduleProgress}
      savingsGoals={savingsGoals}
      familyId={userData.family_id}
    />
  )
}

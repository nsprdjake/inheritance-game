import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
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

  if (userData.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch family data
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', userData.family_id)
    .single()

  // Fetch kids
  const { data: kids } = await supabase
    .from('kids')
    .select('*')
    .eq('family_id', userData.family_id)
    .order('created_at', { ascending: true })

  // Fetch settings
  const { data: settings } = await supabase
    .from('family_settings')
    .select('*')
    .eq('family_id', userData.family_id)
    .single()

  return (
    <SettingsClient
      family={family}
      kids={kids || []}
      settings={settings}
      familyId={userData.family_id}
    />
  )
}

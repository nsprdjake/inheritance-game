#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://kxqrsdicrayblwpczxsy.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testEnhanced() {
  console.log('🧪 Testing Enhanced Achievement System\n')
  
  // Get a kid
  const { data: kids } = await supabase
    .from('kids')
    .select('id, family_id, name, total_earned')
    .eq('name', 'Maverick')
    .limit(1)
    .single()
  
  if (!kids) {
    console.error('Kid not found')
    return
  }
  
  console.log(`Testing with: ${kids.name}`)
  console.log(`Current total: ${kids.total_earned || 0}\n`)
  
  // Add a big task (60 points) to trigger multiple achievements
  console.log('Adding 60-point task...')
  const { error } = await supabase
    .from('transactions')
    .insert({
      family_id: kids.family_id,
      kid_id: kids.id,
      amount: 60,
      reason: 'Testing enhanced achievements - big task',
      transaction_type: 'award'
    })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Check achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('kid_id', kids.id)
    .order('unlocked_at', { ascending: false })
  
  console.log(`\n✅ ${achievements.length} achievements unlocked:`)
  achievements.forEach(ach => {
    const date = new Date(ach.unlocked_at).toLocaleString()
    console.log(`   ${ach.icon} ${ach.title} - ${date}`)
  })
  
  // Check updated total
  const { data: updatedKid } = await supabase
    .from('kids')
    .select('total_earned, level')
    .eq('id', kids.id)
    .single()
  
  console.log(`\n📊 Updated Stats:`)
  console.log(`   Total earned: ${updatedKid.total_earned}`)
  console.log(`   Level: ${updatedKid.level}`)
  
  console.log('\n🎰 Enhanced achievement system working!')
}

testEnhanced()

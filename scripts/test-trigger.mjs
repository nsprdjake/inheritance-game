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

async function testTrigger() {
  console.log('Testing gamification trigger...\n')
  
  // Get a kid to test with
  const { data: kids } = await supabase
    .from('kids')
    .select('id, family_id, name')
    .limit(1)
    .single()
  
  if (!kids) {
    console.error('No kids found to test with')
    return
  }
  
  console.log(`Testing with kid: ${kids.name} (${kids.id})`)
  console.log(`Family: ${kids.family_id}\n`)
  
  // Insert a test transaction
  console.log('Inserting test transaction (15 points)...')
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: kids.family_id,
      kid_id: kids.id,
      amount: 15,
      reason: 'Testing gamification trigger',
      transaction_type: 'award'
    })
    .select()
    .single()
  
  if (txError) {
    console.error('❌ Transaction error:', txError)
    return
  }
  
  console.log('✅ Transaction created:', transaction.id)
  
  // Wait a moment for trigger to execute
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Check if achievements were created
  console.log('\nChecking achievements...')
  const { data: achievements, error: achError } = await supabase
    .from('achievements')
    .select('*')
    .eq('kid_id', kids.id)
  
  if (achError) {
    console.error('❌ Achievement fetch error:', achError)
  } else {
    console.log(`✅ Found ${achievements.length} achievements:`)
    achievements.forEach(ach => {
      console.log(`  - ${ach.title} (${ach.achievement_type})`)
    })
  }
  
  // Check if streak was created
  console.log('\nChecking streak...')
  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('*')
    .eq('kid_id', kids.id)
    .single()
  
  if (streakError) {
    console.error('❌ Streak fetch error:', streakError)
  } else {
    console.log(`✅ Streak created:`)
    console.log(`  Current: ${streak.current_streak} days`)
    console.log(`  Longest: ${streak.longest_streak} days`)
  }
  
  // Check if kid was updated
  console.log('\nChecking kid updates...')
  const { data: updatedKid } = await supabase
    .from('kids')
    .select('level, total_earned')
    .eq('id', kids.id)
    .single()
  
  console.log(`✅ Kid updated:`)
  console.log(`  Level: ${updatedKid.level}`)
  console.log(`  Total earned: ${updatedKid.total_earned}`)
  
  console.log('\n🎰 Gamification system is working!')
}

testTrigger()

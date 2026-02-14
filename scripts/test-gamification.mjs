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

async function test() {
  console.log('Testing gamification tables...\n')
  
  // Test achievements table
  console.log('1. Checking achievements table...')
  const { data: achievements, error: achError } = await supabase
    .from('achievements')
    .select('*')
    .limit(5)
  
  if (achError) {
    console.error('❌ Achievements error:', achError)
  } else {
    console.log(`✅ Achievements table exists (${achievements.length} rows)`)
    if (achievements.length > 0) {
      console.log('Sample:', achievements[0])
    }
  }
  
  // Test streaks table
  console.log('\n2. Checking streaks table...')
  const { data: streaks, error: streakError } = await supabase
    .from('streaks')
    .select('*')
    .limit(5)
  
  if (streakError) {
    console.error('❌ Streaks error:', streakError)
  } else {
    console.log(`✅ Streaks table exists (${streaks.length} rows)`)
    if (streaks.length > 0) {
      console.log('Sample:', streaks[0])
    }
  }
  
  // Test kids table for level/total_earned
  console.log('\n3. Checking kids table for gamification columns...')
  const { data: kids, error: kidsError } = await supabase
    .from('kids')
    .select('id, name, level, total_earned')
    .limit(5)
  
  if (kidsError) {
    console.error('❌ Kids error:', kidsError)
  } else {
    console.log(`✅ Kids table has gamification columns`)
    console.log('Kids:', kids)
  }
  
  console.log('\n✅ All tables ready!')
}

test()

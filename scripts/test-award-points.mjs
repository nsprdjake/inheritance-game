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

async function testAward() {
  console.log('🧪 Testing point award (should NOT error now)...\n')
  
  // Get a kid
  const { data: kids } = await supabase
    .from('kids')
    .select('id, family_id, name')
    .limit(1)
    .single()
  
  if (!kids) {
    console.error('No kids found to test with')
    return
  }
  
  console.log(`Testing with: ${kids.name}\n`)
  
  // Try awarding points 3 times (this would trigger duplicates before)
  for (let i = 1; i <= 3; i++) {
    console.log(`Award #${i}: Adding 5 points...`)
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        family_id: kids.family_id,
        kid_id: kids.id,
        amount: 5,
        reason: `Test award #${i} - duplicate fix verification`,
        transaction_type: 'award'
      })
    
    if (error) {
      console.error(`❌ Award #${i} failed:`, error.message)
      return
    }
    
    console.log(`✅ Award #${i} successful`)
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n🎉 All 3 awards succeeded!')
  console.log('✅ Duplicate key error is FIXED!')
  console.log('\nYou can now award points without errors.')
}

testAward()

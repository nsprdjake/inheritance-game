#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'process.env.SUPABASE_SERVICE_ROLE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testAward() {
  console.log('🧪 Testing point award after emergency fix...\n')
  
  const { data: kids } = await supabase
    .from('kids')
    .select('id, family_id, name, total_earned')
    .limit(1)
    .single()
  
  if (!kids) {
    console.error('No kids found')
    return
  }
  
  console.log(`Testing with: ${kids.name}`)
  console.log(`Current total: ${kids.total_earned || 0}\n`)
  
  // Try awarding 10 points
  console.log('Awarding 10 points...')
  const { error } = await supabase
    .from('transactions')
    .insert({
      family_id: kids.family_id,
      kid_id: kids.id,
      amount: 10,
      reason: 'Emergency fix test',
      transaction_type: 'award'
    })
  
  if (error) {
    console.error('❌ STILL FAILING:', error.message)
    return
  }
  
  console.log('✅ Success! No error!\n')
  
  // Verify total_earned updated
  const { data: updated } = await supabase
    .from('kids')
    .select('total_earned, level')
    .eq('id', kids.id)
    .single()
  
  console.log('Updated stats:')
  console.log(`  Total earned: ${updated.total_earned}`)
  console.log(`  Level: ${updated.level}`)
  console.log('\n🎉 Point awarding is working perfectly!')
}

testAward()

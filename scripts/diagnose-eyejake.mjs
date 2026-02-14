#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kxqrsdicrayblwpczxsy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'process.env.SUPABASE_SERVICE_ROLE_KEY'
)

console.log('🔍 Diagnosing eyejake@me.com account issue...\n')

// Get eyejake's user ID
const { data: users } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'eyejake@me.com')

if (!users || users.length === 0) {
  console.log('❌ No user found for eyejake@me.com')
  process.exit(1)
}

const user = users[0]
console.log('User ID:', user.id)
console.log('Family ID:', user.family_id)
console.log('Role:', user.role)

// Get kids for this family
const { data: kids } = await supabase
  .from('kids')
  .select('*')
  .eq('family_id', user.family_id)

console.log(`\nKids in family: ${kids.length}`)
kids.forEach(kid => {
  console.log(`  - ${kid.name} (ID: ${kid.id}, total_earned: ${kid.total_earned})`)
})

// Check for duplicate achievements for these kids
console.log('\nChecking for duplicate achievements...')
for (const kid of kids) {
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('kid_id', kid.id)
  
  const grouped = {}
  for (const ach of achievements || []) {
    grouped[ach.achievement_type] = (grouped[ach.achievement_type] || 0) + 1
  }
  
  const duplicates = Object.entries(grouped).filter(([_, count]) => count > 1)
  
  if (duplicates.length > 0) {
    console.log(`\n❌ ${kid.name} has duplicate achievements:`)
    duplicates.forEach(([type, count]) => {
      console.log(`   ${type}: ${count} copies`)
    })
    
    // Clean them up
    console.log(`   Cleaning up...`)
    const { data: allAch } = await supabase
      .from('achievements')
      .select('*')
      .eq('kid_id', kid.id)
      .order('unlocked_at', { ascending: true })
    
    const seen = new Set()
    const toDelete = []
    
    for (const ach of allAch || []) {
      const key = ach.achievement_type
      if (seen.has(key)) {
        toDelete.push(ach.id)
      } else {
        seen.add(key)
      }
    }
    
    if (toDelete.length > 0) {
      await supabase
        .from('achievements')
        .delete()
        .in('id', toDelete)
      
      console.log(`   ✅ Deleted ${toDelete.length} duplicates`)
    }
  } else {
    console.log(`  ✅ ${kid.name}: No duplicates`)
  }
}

console.log('\n✅ Cleanup complete. Testing award...')

const testKid = kids[0]
const { error: testError } = await supabase
  .from('transactions')
  .insert({
    family_id: user.family_id,
    kid_id: testKid.id,
    amount: 5,
    reason: 'Post-cleanup diagnostic test',
    transaction_type: 'award'
  })

if (testError) {
  console.log('❌ Still failing:', testError.message)
  process.exit(1)
} else {
  console.log('✅ Award successful! eyejake@me.com account is fixed.')
}

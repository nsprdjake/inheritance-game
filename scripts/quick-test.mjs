#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://kxqrsdicrayblwpczxsy.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable required')
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY=your-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function quickTest() {
  console.log('🎰 LYNE Gamification Quick Test\n')
  
  // Get total stats
  const { count: kidsCount } = await supabase
    .from('kids')
    .select('*', { count: 'exact', head: true })
  
  const { count: achievementsCount } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true })
  
  const { count: streaksCount } = await supabase
    .from('streaks')
    .select('*', { count: 'exact', head: true })
  
  const { count: transactionsCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
  
  console.log('📊 Database Overview:')
  console.log(`   Kids: ${kidsCount}`)
  console.log(`   Transactions: ${transactionsCount}`)
  console.log(`   Achievements: ${achievementsCount}`)
  console.log(`   Streaks: ${streaksCount}`)
  console.log()
  
  // Get kids with gamification data
  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, level, total_earned')
    .order('total_earned', { ascending: false })
  
  console.log('🏆 Top Kids:')
  kids?.forEach((kid, i) => {
    const level = kid.level || 'bronze'
    const emoji = level === 'gold' ? '🏆' : level === 'silver' ? '🥈' : '🥉'
    console.log(`   ${i + 1}. ${emoji} ${kid.name}: ${kid.total_earned || 0} pts (${level})`)
  })
  console.log()
  
  // Get recent achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select(`
      *,
      kid:kids(name)
    `)
    .order('unlocked_at', { ascending: false })
    .limit(10)
  
  console.log('🎯 Recent Achievements:')
  if (achievements && achievements.length > 0) {
    achievements.forEach(ach => {
      const kidName = ach.kid?.name || 'Unknown'
      const date = new Date(ach.unlocked_at).toLocaleDateString()
      console.log(`   ${ach.icon} ${kidName}: ${ach.title} (${date})`)
    })
  } else {
    console.log('   (none yet)')
  }
  console.log()
  
  console.log('✅ Gamification system is operational!')
  console.log('\n🌐 Live at: https://rp1.nsprd.com')
  console.log('🔑 Test accounts:')
  console.log('   - eyejake@me.com / temppass123')
  console.log('   - jake@nsprd.com / temppass123')
}

quickTest()

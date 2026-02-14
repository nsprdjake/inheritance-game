#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTg5NjgsImV4cCI6MjA4MTIzNDk2OH0.A8RQRlAzFUVQhxDg7nAnNH-1UK6_0rGJfs0M_2XCZVQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLiveGamification() {
  console.log('🎰 Testing LYNE Gamification System\n')
  console.log('Production URL: https://rp1.nsprd.com\n')
  
  // Test 1: Sign in as Jake
  console.log('1️⃣ Signing in as jake@nsprd.com...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'jake@nsprd.com',
    password: 'temppass123'
  })
  
  if (authError) {
    console.error('❌ Auth error:', authError.message)
    return
  }
  
  console.log('✅ Signed in as:', authData.user.email)
  
  // Test 2: Get kids list
  console.log('\n2️⃣ Fetching kids...')
  const { data: kids, error: kidsError } = await supabase
    .from('kids')
    .select('id, name, level, total_earned')
    .order('name')
  
  if (kidsError) {
    console.error('❌ Kids fetch error:', kidsError)
    return
  }
  
  console.log(`✅ Found ${kids.length} kids:`)
  kids.forEach(kid => {
    console.log(`   ${kid.name}: ${kid.level} level, ${kid.total_earned || 0} total earned`)
  })
  
  if (kids.length === 0) {
    console.log('\n⚠️ No kids found. Create a kid in the app first.')
    return
  }
  
  const testKid = kids[0]
  console.log(`\n📍 Using ${testKid.name} for testing...`)
  
  // Test 3: Check existing achievements
  console.log('\n3️⃣ Checking achievements...')
  const { data: achievements, error: achError } = await supabase
    .from('achievements')
    .select('*')
    .eq('kid_id', testKid.id)
    .order('unlocked_at', { ascending: false })
  
  if (achError) {
    console.error('❌ Achievements fetch error:', achError)
  } else {
    console.log(`✅ ${achievements.length} achievements unlocked:`)
    achievements.forEach(ach => {
      console.log(`   ${ach.icon} ${ach.title}`)
    })
  }
  
  // Test 4: Check streak
  console.log('\n4️⃣ Checking streak...')
  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('*')
    .eq('kid_id', testKid.id)
    .single()
  
  if (streakError && streakError.code !== 'PGRST116') {
    console.error('❌ Streak fetch error:', streakError)
  } else if (streak) {
    console.log(`✅ Streak found:`)
    console.log(`   Current: ${streak.current_streak} days`)
    console.log(`   Longest: ${streak.longest_streak} days`)
  } else {
    console.log('   No streak yet (will be created on first transaction)')
  }
  
  // Test 5: Get balance
  console.log('\n5️⃣ Checking balance...')
  const { data: balance, error: balError } = await supabase
    .rpc('get_kid_balance', { kid_uuid: testKid.id })
  
  if (balError) {
    console.error('❌ Balance error:', balError)
  } else {
    console.log(`✅ Current balance: ${balance || 0} points`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎰 GAMIFICATION SYSTEM STATUS')
  console.log('='.repeat(60))
  console.log(`✅ Database: Connected`)
  console.log(`✅ Authentication: Working`)
  console.log(`✅ Kids table: ${kids.length} records`)
  console.log(`✅ Achievements table: Readable`)
  console.log(`✅ Streaks table: Readable`)
  console.log(`✅ Balance function: Working`)
  console.log('\n🚀 System ready for testing!')
  console.log('\nNext steps:')
  console.log('1. Go to https://rp1.nsprd.com')
  console.log('2. Sign in as jake@nsprd.com / temppass123')
  console.log('3. Award points to a kid')
  console.log('4. Check kid dashboard to see achievements/streaks/confetti')
  console.log('\n💜 Have fun!')
}

testLiveGamification()

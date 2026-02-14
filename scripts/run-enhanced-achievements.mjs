#!/usr/bin/env node

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'kxqrsdicrayblwpczxsy'
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('Error: SUPABASE_ACCESS_TOKEN environment variable required')
  process.exit(1)
}

async function runMigration() {
  try {
    const sqlPath = join(__dirname, 'add-more-achievements.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('🎯 Adding enhanced achievement system...\n')
    
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }
    )
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Migration failed:')
      console.error(JSON.stringify(result, null, 2))
      process.exit(1)
    }
    
    console.log('✅ Enhanced achievement system deployed!')
    console.log('\n🏆 New Achievement Types:')
    console.log('   Earning Milestones:')
    console.log('   - 🎯 Getting Started (first task)')
    console.log('   - 🌟 First Steps (10 pts)')
    console.log('   - ⭐ Half Century (50 pts)')
    console.log('   - 💯 Century Club (100 pts)')
    console.log('   - 🥈 Silver Status (200 pts)')
    console.log('   - 🏆 High Roller (500 pts)')
    console.log('   - 👑 Elite Status (1000 pts)')
    console.log('   - 🌟 Living Legend (2500 pts)')
    console.log('')
    console.log('   Task Size:')
    console.log('   - 💪 Big Task Master (50+ pt task)')
    console.log('   - 🔥 Huge Achievement (100+ pt task)')
    console.log('')
    console.log('   Streaks:')
    console.log('   - 🔥 3-Day Streak')
    console.log('   - 🔥🔥 Week Warrior (7 days)')
    console.log('   - 🔥🔥🔥 Month Master (30 days)')
    console.log('')
    console.log('   Spending:')
    console.log('   - 🎁 First Reward (first redemption)')
    console.log('   - 💸 Big Spender (100+ pt redemption)')
    console.log('')
    console.log('   Activity:')
    console.log('   - 📊 Active Kid (10 transactions)')
    console.log('   - 📈 Super Active (50 transactions)')
    console.log('   - 🎯 Transaction Pro (100 transactions)')
    console.log('\n🎰 Total: 18 achievement types!')
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

runMigration()

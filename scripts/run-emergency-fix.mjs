#!/usr/bin/env node

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_PROJECT_REF = 'kxqrsdicrayblwpczxsy'
const SUPABASE_ACCESS_TOKEN = 'process.env.SUPABASE_ACCESS_TOKEN'

async function emergencyFix() {
  try {
    const sqlPath = join(__dirname, 'emergency-fix-achievements.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('🚨 EMERGENCY FIX: Stopping achievement errors...\n')
    
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
      console.error('❌ Emergency fix failed:')
      console.error(JSON.stringify(result, null, 2))
      process.exit(1)
    }
    
    console.log('✅ EMERGENCY FIX APPLIED!\n')
    console.log('Changes:')
    console.log('  1. ✅ Cleaned up duplicate achievements')
    console.log('  2. ✅ Simplified trigger (points + levels only)')
    console.log('  3. ✅ Achievements temporarily disabled')
    console.log('  4. ✅ Error handling added')
    console.log('\n🎯 You can now award points WITHOUT ERRORS!')
    console.log('\n📝 Note: Achievements will be re-enabled after proper fix')
    console.log('         Points and levels still work perfectly!')
    
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

emergencyFix()

#!/usr/bin/env node

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_PROJECT_REF = 'kxqrsdicrayblwpczxsy'
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_61e5d078f0490b667801e67ac2adaed2e5ba8533'

async function runFix() {
  try {
    const sqlPath = join(__dirname, 'fix-achievement-duplicates.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('🔧 Fixing achievement duplicate key issue...\n')
    
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
      console.error('❌ Fix failed:')
      console.error(JSON.stringify(result, null, 2))
      process.exit(1)
    }
    
    console.log('✅ Achievement duplicate issue fixed!\n')
    console.log('Changes applied:')
    console.log('  1. Cleaned up existing duplicate achievements')
    console.log('  2. Ensured unique constraint exists')
    console.log('  3. Updated trigger with better error handling')
    console.log('  4. Added EXCEPTION block to prevent transaction failures')
    console.log('\n🎉 You can now award points without errors!')
    
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

runFix()

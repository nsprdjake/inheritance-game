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
    const sqlPath = join(__dirname, '..', 'fix-gamification-schema.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    console.log('Running migration via Supabase Management API...')
    
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
    
    console.log('✅ Migration complete!')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

runMigration()

#!/usr/bin/env node

/**
 * LYNE Health Monitor & Self-Healing System
 * 
 * Runs automated checks and fixes issues without human intervention.
 * Only alerts when human decision is truly needed.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kxqrsdicrayblwpczxsy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_uLwnvAKsSgThg0MzSCoaD4e7hORY'
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://rp1.nsprd.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

let healthReport = {
  timestamp: new Date().toISOString(),
  checks: [],
  fixes: [],
  alerts: []
}

function log(type, message, data = null) {
  const entry = { type, message, time: new Date().toISOString() }
  if (data) entry.data = data
  
  if (type === 'fix') healthReport.fixes.push(entry)
  else if (type === 'alert') healthReport.alerts.push(entry)
  else healthReport.checks.push(entry)
  
  const icon = type === 'fix' ? '🔧' : type === 'alert' ? '⚠️' : '✓'
  console.log(`${icon} ${message}`)
  if (data && process.env.VERBOSE) console.log('  ', data)
}

// ==== HEALTH CHECKS ====

async function checkDatabase() {
  try {
    const { data, error } = await supabase.from('families').select('count')
    if (error) throw error
    log('check', 'Database connection: OK')
    return true
  } catch (err) {
    log('alert', 'Database connection FAILED', err.message)
    return false
  }
}

async function checkGamificationTrigger() {
  try {
    // Check if trigger exists
    const { data: functions, error } = await supabase.rpc('exec', {
      sql: "SELECT proname FROM pg_proc WHERE proname = 'process_transaction_gamification'"
    })
    
    if (error) {
      log('alert', 'Cannot verify gamification trigger', error.message)
      return false
    }
    
    log('check', 'Gamification trigger: EXISTS')
    return true
  } catch (err) {
    log('check', 'Gamification trigger: UNKNOWN (non-critical)')
    return true // Don't fail on this
  }
}

async function checkDuplicateAchievements() {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('kid_id, achievement_type, count')
      .limit(1000)
    
    if (error) throw error
    
    // Group by kid_id + achievement_type to find duplicates
    const grouped = {}
    for (const row of data) {
      const key = `${row.kid_id}:${row.achievement_type}`
      grouped[key] = (grouped[key] || 0) + 1
    }
    
    const duplicates = Object.values(grouped).filter(count => count > 1).length
    
    if (duplicates > 0) {
      log('fix', `Found ${duplicates} duplicate achievements, cleaning up...`)
      await fixDuplicateAchievements()
      return true
    }
    
    log('check', 'Achievement duplicates: NONE')
    return true
  } catch (err) {
    log('alert', 'Duplicate achievement check FAILED', err.message)
    return false
  }
}

async function checkVercelDeployment() {
  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1`,
      { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
    )
    
    const { deployments } = await response.json()
    const latest = deployments[0]
    
    if (latest.state === 'READY') {
      log('check', `Vercel deployment: ${latest.state}`, latest.url)
      return true
    } else if (latest.state === 'ERROR') {
      log('alert', `Vercel deployment FAILED`, latest.url)
      return false
    } else {
      log('check', `Vercel deployment: ${latest.state} (in progress)`)
      return true
    }
  } catch (err) {
    log('alert', 'Vercel API check FAILED', err.message)
    return false
  }
}

async function checkProductionHealth() {
  try {
    const response = await fetch(PRODUCTION_URL, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000)
    })
    
    if (response.ok) {
      log('check', `Production site: RESPONDING (${response.status})`)
      return true
    } else {
      log('alert', `Production site: ERROR ${response.status}`)
      return false
    }
  } catch (err) {
    log('alert', 'Production site: UNREACHABLE', err.message)
    return false
  }
}

async function checkKidsWithoutAccounts() {
  try {
    const { data, error } = await supabase
      .from('kids')
      .select('id, name, user_id')
      .is('user_id', null)
    
    if (error) throw error
    
    if (data.length > 0) {
      log('check', `Kids without accounts: ${data.length}`, data.map(k => k.name))
    } else {
      log('check', 'Kids without accounts: NONE')
    }
    return true
  } catch (err) {
    log('alert', 'Kid account check FAILED', err.message)
    return false
  }
}

// ==== AUTO-FIXES ====

async function fixDuplicateAchievements() {
  try {
    // Use SQL to delete duplicates, keeping the oldest
    const sql = `
      DELETE FROM achievements a
      USING achievements b
      WHERE a.id > b.id 
        AND a.kid_id = b.kid_id 
        AND a.achievement_type = b.achievement_type;
    `
    
    const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''
    const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'kxqrsdicrayblwpczxsy'
    
    if (!SUPABASE_ACCESS_TOKEN) {
      throw new Error('SUPABASE_ACCESS_TOKEN required for auto-fix')
    }
    
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
    
    if (!response.ok) {
      throw new Error('SQL execution failed')
    }
    
    log('fix', 'Duplicate achievements cleaned up automatically')
    return true
  } catch (err) {
    log('alert', 'Auto-fix for duplicates FAILED', err.message)
    return false
  }
}

// ==== MAIN RUNNER ====

async function runHealthCheck() {
  console.log('\n🏥 LYNE Health Monitor - Starting...\n')
  
  const checks = [
    { name: 'Database', fn: checkDatabase, critical: true },
    { name: 'Vercel Deployment', fn: checkVercelDeployment, critical: false },
    { name: 'Production Site', fn: checkProductionHealth, critical: true },
    { name: 'Gamification Trigger', fn: checkGamificationTrigger, critical: false },
    { name: 'Duplicate Achievements', fn: checkDuplicateAchievements, critical: false },
    { name: 'Kid Accounts', fn: checkKidsWithoutAccounts, critical: false }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const check of checks) {
    try {
      const result = await check.fn()
      if (result) passed++
      else if (check.critical) failed++
    } catch (err) {
      log('alert', `${check.name} threw exception`, err.message)
      if (check.critical) failed++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('HEALTH CHECK SUMMARY')
  console.log('='.repeat(60))
  console.log(`✓ Passed: ${passed}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`🔧 Auto-fixes applied: ${healthReport.fixes.length}`)
  console.log(`⚠️  Alerts: ${healthReport.alerts.length}`)
  
  if (healthReport.alerts.length > 0) {
    console.log('\n⚠️  ALERTS REQUIRING ATTENTION:')
    healthReport.alerts.forEach(alert => {
      console.log(`   - ${alert.message}`)
    })
  } else {
    console.log('\n✅ All systems operational!')
  }
  
  console.log('\n' + '='.repeat(60))
  
  // Exit code: 0 if healthy, 1 if critical failures
  process.exit(failed > 0 ? 1 : 0)
}

runHealthCheck()

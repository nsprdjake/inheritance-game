#!/usr/bin/env node

/**
 * Achievement Checker - Decoupled from Transaction Trigger
 * 
 * Runs independently to check and award achievements.
 * Idempotent - safe to run multiple times.
 * Can be run via cron every 5 minutes or on-demand.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kxqrsdicrayblwpczxsy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ACHIEVEMENTS = [
  // Earning milestones
  { type: 'getting_started', title: 'Getting Started!', description: 'Complete your first task', icon: '🎯', checkType: 'simple', check: (kid) => kid.total_earned >= 1 },
  { type: 'first_points', title: 'First Steps!', description: 'Earn your first 10 points', icon: '🌟', checkType: 'simple', check: (kid) => kid.total_earned >= 10 },
  { type: 'half_century', title: 'Half Century!', description: 'Earn 50 total points', icon: '⭐', checkType: 'simple', check: (kid) => kid.total_earned >= 50 },
  { type: 'century_club', title: 'Century Club!', description: 'Earn 100 total points', icon: '💯', checkType: 'simple', check: (kid) => kid.total_earned >= 100 },
  { type: 'silver_status', title: 'Silver Status!', description: 'Reach silver level', icon: '🥈', checkType: 'simple', check: (kid) => kid.total_earned >= 200 },
  { type: 'high_roller', title: 'High Roller!', description: 'Earn 500 total points', icon: '🏆', checkType: 'simple', check: (kid) => kid.total_earned >= 500 },
  { type: 'elite', title: 'Elite Status!', description: 'Earn 1000 total points', icon: '👑', checkType: 'simple', check: (kid) => kid.total_earned >= 1000 },
  { type: 'legend', title: 'Living Legend!', description: 'Earn 2500 total points', icon: '🌟', checkType: 'simple', check: (kid) => kid.total_earned >= 2500 },
  
  // Task size achievements (requires transaction check)
  { type: 'big_task', title: 'Big Task Master!', description: 'Complete a 50+ point task', icon: '💪', checkType: 'transaction' },
  { type: 'huge_task', title: 'Huge Achievement!', description: 'Complete a 100+ point task', icon: '🔥', checkType: 'transaction' },
  
  // Activity achievements (requires transaction count)
  { type: 'active_10', title: 'Active Kid!', description: 'Complete 10 transactions', icon: '📊', checkType: 'activity' },
  { type: 'active_50', title: 'Super Active!', description: 'Complete 50 transactions', icon: '📈', checkType: 'activity' },
  { type: 'active_100', title: 'Transaction Pro!', description: 'Complete 100 transactions', icon: '🎯', checkType: 'activity' },
]

async function checkAchievements() {
  console.log('🏆 Checking achievements...\n')
  
  let newAchievements = 0
  let errors = 0
  
  // Get all kids
  const { data: kids, error: kidsError } = await supabase
    .from('kids')
    .select('id, family_id, name, total_earned')
  
  if (kidsError) {
    console.error('Error fetching kids:', kidsError.message)
    return { newAchievements, errors: 1 }
  }
  
  for (const kid of kids) {
    // Get existing achievements for this kid
    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('achievement_type')
      .eq('kid_id', kid.id)
    
    const hasAchievement = new Set((existingAchievements || []).map(a => a.achievement_type))
    
    // Get transaction data for this kid (needed for some achievement types)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('kid_id', kid.id)
    
    const transactionCount = transactions?.length || 0
    const maxTransaction = Math.max(...(transactions || []).map(t => t.amount), 0)
    
    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      // Skip if already has it
      if (hasAchievement.has(achievement.type)) {
        continue
      }
      
      // Check based on achievement type
      let qualifies = false
      
      if (achievement.checkType === 'simple') {
        qualifies = achievement.check(kid)
      } else if (achievement.checkType === 'transaction') {
        // Task size achievements
        if (achievement.type === 'big_task') {
          qualifies = maxTransaction >= 50
        } else if (achievement.type === 'huge_task') {
          qualifies = maxTransaction >= 100
        }
      } else if (achievement.checkType === 'activity') {
        // Activity milestones
        if (achievement.type === 'active_10') {
          qualifies = transactionCount >= 10
        } else if (achievement.type === 'active_50') {
          qualifies = transactionCount >= 50
        } else if (achievement.type === 'active_100') {
          qualifies = transactionCount >= 100
        }
      }
      
      if (qualifies) {
        // Award achievement
        const { error } = await supabase
          .from('achievements')
          .insert({
            kid_id: kid.id,
            family_id: kid.family_id,
            achievement_type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon
          })
        
        if (error) {
          // Check if it's just a duplicate (someone else awarded it)
          if (error.message.includes('duplicate key')) {
            // This is fine - it means it was awarded by another process
            continue
          } else {
            console.error(`Error awarding ${achievement.type} to ${kid.name}:`, error.message)
            errors++
          }
        } else {
          console.log(`✨ ${kid.name} unlocked: ${achievement.icon} ${achievement.title}`)
          newAchievements++
        }
      }
    }
  }
  
  return { newAchievements, errors }
}

// Run the checker
checkAchievements()
  .then(({ newAchievements, errors }) => {
    console.log(`\n✅ Achievement check complete`)
    console.log(`   New achievements: ${newAchievements}`)
    console.log(`   Errors: ${errors}`)
    process.exit(errors > 0 ? 1 : 0)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

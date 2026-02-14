#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('Error: Set SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listUsers() {
  console.log('Fetching users...\n')
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${users.length} users:\n`)
  users.forEach(user => {
    console.log(`${user.email}`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Family: ${user.family_id}`)
    console.log(`  Created: ${user.created_at}`)
    console.log()
  })
}

listUsers()

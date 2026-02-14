#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1ODk2OCwiZXhwIjoyMDgxMjM0OTY4fQ.aS08Saba5oOQsJZqfRf3tUuaCXqwcwyyno4kzMgzsEc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sql = readFileSync('./supabase/migrations/20260214_fix_achievement_duplicates.sql', 'utf-8');

console.log('🔧 Applying achievement duplicate fix to Supabase...\n');

async function applyFix() {
try {
  // Use the Supabase REST API to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    // Try alternative: use node-postgres with session pooler
    console.log('Trying alternative method with PostgreSQL client...\n');
    
    const pg = await import('pg');
    const { Client } = pg.default;
    
    // Use IPv4 session pooler
    const client = new Client({
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres.kxqrsdicrayblwpczxsy',
      password: 'Eyejande072801!$',
    });
    
    await client.connect();
    console.log('✅ Connected to Supabase database');
    
    await client.query(sql);
    await client.end();
    
    console.log('✅ Achievement fix applied successfully!');
    console.log('   The check_achievements() function now uses ON CONFLICT DO NOTHING');
    console.log('   No more duplicate key errors! 🎉\n');
    return;
  }

  const result = await response.json();
  console.log('✅ Achievement fix applied successfully!');
  console.log('   The check_achievements() function now uses ON CONFLICT DO NOTHING');
  console.log('   No more duplicate key errors! 🎉\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
}

applyFix();

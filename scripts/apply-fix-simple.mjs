#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

const connectionString = 'postgresql://postgres:Eyejande072801!$@db.kxqrsdicrayblwpczxsy.supabase.co:5432/postgres';

const sql = readFileSync('./supabase/migrations/20260214_fix_achievement_duplicates.sql', 'utf-8');

console.log('🔧 Applying achievement duplicate fix to Supabase...\n');

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('✅ Connected to Supabase database');
  
  await client.query(sql);
  
  console.log('✅ Achievement fix applied successfully!');
  console.log('   The check_achievements() function now uses ON CONFLICT DO NOTHING');
  console.log('   No more duplicate key errors! 🎉\n');
} catch (error) {
  console.error('❌ Error applying fix:', error.message);
  process.exit(1);
} finally {
  await client.end();
}

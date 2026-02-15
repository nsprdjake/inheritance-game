#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  console.error('\nPlease add your Supabase connection string:');
  console.error('DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Applying Phase 2 Legacy System Migration\n');

  const client = new pg.Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20260214_phase2_legacy_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executing migration...\n');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');
    console.log('🎉 Phase 2 Legacy System is now ready!\n');
    console.log('📋 What was created:');
    console.log('   • legacy_accounts table');
    console.log('   • beneficiaries table');
    console.log('   • legacy_quests table');
    console.log('   • legacy_milestones table');
    console.log('   • legacy_media table');
    console.log('   • legacy_trustees table');
    console.log('   • milestone_evidence table');
    console.log('   • legacy_audit_log table');
    console.log('   • legacy_achievement_templates table (23 seeded templates)');
    console.log('   • All RLS policies configured');
    console.log('   • Triggers and automation functions\n');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables may already exist. This is OK if re-running.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('👋 Database connection closed\n');
  }
}

runMigration();

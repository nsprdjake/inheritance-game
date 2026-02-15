#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Read DATABASE_URL from .env.local
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envFile = readFileSync('.env.local', 'utf-8');
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) {
      connectionString = match[1].trim();
    }
  } catch (e) {
    // .env.local not found
  }
}

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function runMigration(sqlFilePath) {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    const sql = readFileSync(sqlFilePath, 'utf-8');
    console.log(`   File size: ${(sql.length / 1024).toFixed(1)}KB\n`);
    
    console.log('⚡ Executing migration...');
    await client.query(sql);
    
    console.log('✅ Migration successful!\n');
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(`   ${error.message}\n`);
    
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    
    return false;
  } finally {
    await client.end();
    console.log('🔌 Disconnected from Supabase');
  }
}

// Get SQL file from command line argument
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('Usage: node apply-migration.mjs <path-to-sql-file>');
  console.error('Example: node scripts/apply-migration.mjs supabase/migrations/20260214_phase2_legacy_system.sql');
  process.exit(1);
}

runMigration(sqlFile).then(success => {
  process.exit(success ? 0 : 1);
});

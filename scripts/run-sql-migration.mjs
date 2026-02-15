#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Supabase connection details
const connectionString = `postgresql://postgres.kxqrsdicrayblwpczxsy:Eyejande072801!$@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

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
    const result = await client.query(sql);
    
    console.log('✅ Migration successful!');
    console.log(`   Rows affected: ${result.rowCount || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(`   ${error.message}`);
    
    if (error.position) {
      const lines = sql.split('\n');
      const errorLine = parseInt(error.position) / 80; // Rough estimate
      console.error(`\n   Near line ${Math.floor(errorLine)}:`);
      console.error(`   ${lines[Math.floor(errorLine)] || ''}`);
    }
    
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from Supabase');
  }
}

// Get SQL file from command line argument
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('Usage: node run-sql-migration.mjs <path-to-sql-file>');
  process.exit(1);
}

runMigration(sqlFile).then(success => {
  process.exit(success ? 0 : 1);
});

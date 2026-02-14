import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Eyejande072801!$@db.kxqrsdicrayblwpczxsy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const sql = fs.readFileSync('./supabase/migrations/20260213_gamification.sql', 'utf8');
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

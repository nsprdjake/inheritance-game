#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY0MDk0MywiZXhwIjoyMDU0MjE2OTQzfQ.1DAJQR_nItAH10KqHF5bDPZq3U4mRqLhQ3u1c8-pGSw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = readFileSync(join(__dirname, '../supabase/migrations/20260214_fix_achievement_duplicates.sql'), 'utf-8');

console.log('🔧 Applying achievement duplicate fix...\n');

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✅ Achievement fix applied successfully!');
  console.log('   The check_achievements() function now uses ON CONFLICT DO NOTHING');
  console.log('   No more duplicate key errors! 🎉\n');
} catch (err) {
  // If exec_sql doesn't exist, try direct SQL execution
  console.log('📝 Attempting direct SQL execution...\n');
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    try {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });
      if (error) throw error;
    } catch (e) {
      console.error('Failed, trying alternative method...');
      // Last resort: use PostgreSQL REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to apply migration:', errorText);
        process.exit(1);
      }
      break;
    }
  }
  
  console.log('✅ Achievement fix applied successfully!');
  console.log('   The check_achievements() function now uses ON CONFLICT DO NOTHING');
  console.log('   No more duplicate key errors! 🎉\n');
}

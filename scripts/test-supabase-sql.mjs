#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1ODk2OCwiZXhwIjoyMDgxMjM0OTY4fQ.aS08Saba5oOQsJZqfRf3tUuaCXqwcwyyno4kzMgzsEc';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Testing Supabase SQL execution...\n');

// Simple test query
const testSql = 'SELECT current_database(), current_user, version();';

try {
  console.log('Method 1: Using Supabase RPC (if available)...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: testSql });
  
  if (!rpcError) {
    console.log('✅ RPC method works!');
    console.log('Result:', rpcData);
  } else {
    console.log('❌ RPC method failed:', rpcError.message);
    
    // Try direct SQL via REST API
    console.log('\nMethod 2: Direct REST API...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ sql: testSql })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ REST API works!');
      console.log('Result:', result);
    } else {
      console.log('❌ REST API failed:', result);
      
      // Last resort: try using pg client
      console.log('\nMethod 3: PostgreSQL client (requires pg package)...');
      console.log('Attempting to install pg...');
    }
  }
} catch (error) {
  console.error('Error:', error.message);
}

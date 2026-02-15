#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (() => { const fs = require('fs'); try { const env = fs.readFileSync('.env.local', 'utf-8'); const match = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/); return match ? match[1].trim() : ''; } catch { return ''; } })();

const supabase = createClient(supabaseUrl, serviceKey);

const JAKE_USER_ID = '40fa30b9-3ea3-44b0-aa10-70f00a9e4bcf';

async function debug() {
  console.log('🔍 Debugging quest data...\n');
  
  // Check legacy accounts
  const { data: accounts } = await supabase
    .from('legacy_accounts')
    .select('*');
  
  console.log('Legacy Accounts:', accounts?.length || 0);
  accounts?.forEach(a => {
    console.log(`  - ${a.id}: ${a.estate_name} (benefactor: ${a.benefactor_id}, status: ${a.status})`);
  });
  
  // Check quests
  const { data: quests } = await supabase
    .from('legacy_quests')
    .select('*');
  
  console.log('\nLegacy Quests:', quests?.length || 0);
  quests?.forEach(q => {
    console.log(`  - ${q.id}: ${q.title} (account: ${q.legacy_account_id}, status: ${q.status})`);
  });
  
  // Check what query the page is using
  console.log('\nWhat the page queries:');
  console.log(`  Jake user ID: ${JAKE_USER_ID}`);
  
  const { data: jakeAccount } = await supabase
    .from('legacy_accounts')
    .select('*')
    .eq('benefactor_id', JAKE_USER_ID)
    .single();
  
  console.log(`  Jake's legacy account:`, jakeAccount ? jakeAccount.id : 'NOT FOUND');
  
  if (jakeAccount) {
    const { data: draftQuest } = await supabase
      .from('legacy_quests')
      .select('*, legacy_milestones(*)')
      .eq('legacy_account_id', jakeAccount.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    console.log(`  Draft quest for Jake:`, draftQuest ? draftQuest.title : 'NOT FOUND');
    if (draftQuest) {
      console.log(`    - Milestones:`, draftQuest.legacy_milestones?.length || 0);
    }
  }
}

debug();

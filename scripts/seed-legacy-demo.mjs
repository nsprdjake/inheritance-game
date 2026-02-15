#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (() => { const fs = require('fs'); try { const env = fs.readFileSync('.env.local', 'utf-8'); const match = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/); return match ? match[1].trim() : ''; } catch { return ''; } })();

const supabase = createClient(supabaseUrl, serviceKey);

const JAKE_USER_ID = '40fa30b9-3ea3-44b0-aa10-70f00a9e4bcf';

console.log('🎬 Setting up Legacy Mode demo data for Jake...\n');

async function seedDemoData() {
  try {
    // 1. Create legacy account for Jake
    console.log('1. Creating legacy account...');
    const { data: legacyAccount, error: accountError } = await supabase
      .from('legacy_accounts')
      .insert({
        benefactor_id: JAKE_USER_ID,
        estate_name: "Jake's Estate",
        estate_value_cents: 15000000, // $150,000 in cents
        status: 'active',
        welcome_message: 'Welcome to your legacy quest!'
      })
      .select()
      .single();
    
    if (accountError) throw accountError;
    console.log(`   ✅ Created legacy account: ${legacyAccount.id}\n`);
    
    // 2. Create a beneficiary (using maverick from family mode)
    console.log('2. Creating beneficiary...');
    
    // First get maverick's kid_id
    const { data: users } = await supabase
      .from('users')
      .select('kid_id, family_id')
      .eq('id', JAKE_USER_ID)
      .single();
    
    const { data: kids } = await supabase
      .from('kids')
      .select('*')
      .eq('family_id', users.family_id)
      .limit(1)
      .single();
    
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .insert({
        legacy_account_id: legacyAccount.id,
        name: kids?.name || 'Demo Beneficiary',
        email: 'demo@example.com',
        relationship: 'nephew',
        invitation_status: 'accepted'
      })
      .select()
      .single();
    
    if (beneficiaryError) throw beneficiaryError;
    console.log(`   ✅ Created beneficiary: ${beneficiary.name}\n`);
    
    // 3. Create a legacy quest
    console.log('3. Creating legacy quest...');
    const { data: quest, error: questError } = await supabase
      .from('legacy_quests')
      .insert({
        legacy_account_id: legacyAccount.id,
        beneficiary_id: beneficiary.id,
        title: 'Financial Foundations Quest',
        description: 'Learn financial responsibility and unlock your inheritance',
        total_value_cents: 5000000, // $50,000 in cents
        status: 'active'
      })
      .select()
      .single();
    
    if (questError) throw questError;
    console.log(`   ✅ Created quest: ${quest.title}\n`);
    
    // 4. Create milestones
    console.log('4. Creating milestones...');
    const milestones = [
      {
        quest_id: quest.id,
        title: 'Complete Budgeting Course',
        description: 'Finish the online budgeting course and maintain a budget for 30 days',
        unlock_value_cents: 500000, // $5,000 in cents
        order_index: 1,
        status: 'locked',
        milestone_type: 'education',
        verification_type: 'manual'
      },
      {
        quest_id: quest.id,
        title: 'Build Emergency Fund',
        description: 'Save $1,000 in an emergency fund and keep it for 90 days',
        unlock_value_cents: 1000000, // $10,000 in cents
        order_index: 2,
        status: 'locked',
        milestone_type: 'financial',
        verification_type: 'manual',
        prerequisites: []
      },
      {
        quest_id: quest.id,
        title: 'Achieve Good Credit Score',
        description: 'Reach and maintain a credit score above 700',
        unlock_value_cents: 1500000, // $15,000 in cents
        order_index: 3,
        status: 'locked',
        milestone_type: 'financial',
        verification_type: 'manual'
      }
    ];
    
    for (const milestone of milestones) {
      const { data, error } = await supabase
        .from('legacy_milestones')
        .insert(milestone)
        .select()
        .single();
      
      if (error) throw error;
      console.log(`   ✅ Created: ${data.title} ($${(data.unlock_value_cents / 100).toLocaleString()})`);
    }
    
    console.log('\n✅ Demo data created successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Legacy Account: ${legacyAccount.estate_name}`);
    console.log(`   Total Estate: $${(legacyAccount.estate_value_cents / 100).toLocaleString()}`);
    console.log(`   Beneficiary: ${beneficiary.name}`);
    console.log(`   Quest: ${quest.title}`);
    console.log(`   Milestones: 3 ($${(milestones.reduce((sum, m) => sum + m.unlock_value_cents, 0) / 100).toLocaleString()} total)\n`);
    console.log('🚀 Visit /legacy/create to see the quest builder!');
    console.log('🎯 Visit /kid/legacy to see the beneficiary view!');
    console.log('⚖️  Visit /trustee/dashboard to verify milestones!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) console.error('   Details:', error.details);
    process.exit(1);
  }
}

seedDemoData();

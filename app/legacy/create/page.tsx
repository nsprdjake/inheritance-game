'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuestBuilder from '@/components/legacy/QuestBuilder';
import { 
  LegacyQuest, 
  LegacyMilestone, 
  AchievementTemplate,
  CreateMilestoneInput,
  Beneficiary
} from '@/lib/types/legacy';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CreateQuestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [quest, setQuest] = useState<LegacyQuest | null>(null);
  const [milestones, setMilestones] = useState<LegacyMilestone[]>([]);
  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  
  // Setup form state
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newBeneficiaryEmail, setNewBeneficiaryEmail] = useState('');
  const [newBeneficiaryRelationship, setNewBeneficiaryRelationship] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load achievement templates
      const { data: templatesData } = await supabase
        .from('legacy_achievement_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (templatesData) setTemplates(templatesData);

      // Load user's legacy account and beneficiaries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get or create legacy account
      let { data: legacyAccount } = await supabase
        .from('legacy_accounts')
        .select('*')
        .eq('benefactor_id', user.id)
        .single();

      if (!legacyAccount) {
        // Create first legacy account
        const { data: newAccount } = await supabase
          .from('legacy_accounts')
          .insert({
            benefactor_id: user.id,
            estate_name: 'My Legacy',
            status: 'draft'
          })
          .select()
          .single();
        
        legacyAccount = newAccount;
      }

      if (legacyAccount) {
        // Load beneficiaries
        const { data: beneficiariesData } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('legacy_account_id', legacyAccount.id);
        
        if (beneficiariesData) setBeneficiaries(beneficiariesData);

        // Check if we have an active quest in progress
        const { data: existingQuest } = await supabase
          .from('legacy_quests')
          .select('*, legacy_milestones(*)')
          .eq('legacy_account_id', legacyAccount.id)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingQuest) {
          setQuest(existingQuest);
          setMilestones(existingQuest.legacy_milestones || []);
        } else {
          setShowSetup(true);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createQuest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let beneficiaryId = selectedBeneficiary;

      // Create new beneficiary if needed
      if (!beneficiaryId && newBeneficiaryEmail) {
        const { data: legacyAccount } = await supabase
          .from('legacy_accounts')
          .select('id')
          .eq('benefactor_id', user.id)
          .single();

        if (!legacyAccount) return;

        const { data: newBeneficiary } = await supabase
          .from('beneficiaries')
          .insert({
            legacy_account_id: legacyAccount.id,
            email: newBeneficiaryEmail,
            name: newBeneficiaryName,
            relationship: newBeneficiaryRelationship,
            invitation_status: 'pending'
          })
          .select()
          .single();

        if (newBeneficiary) {
          beneficiaryId = newBeneficiary.id;
          setBeneficiaries([...beneficiaries, newBeneficiary]);
        }
      }

      if (!beneficiaryId) {
        alert('Please select or create a beneficiary');
        return;
      }

      // Get legacy account
      const { data: legacyAccount } = await supabase
        .from('legacy_accounts')
        .select('id')
        .eq('benefactor_id', user.id)
        .single();

      if (!legacyAccount) return;

      // Create quest
      const { data: newQuest } = await supabase
        .from('legacy_quests')
        .insert({
          legacy_account_id: legacyAccount.id,
          beneficiary_id: beneficiaryId,
          title: questTitle || 'New Legacy Quest',
          description: questDescription,
          status: 'draft',
          total_value_cents: 0,
          order_index: 0
        })
        .select()
        .single();

      if (newQuest) {
        setQuest(newQuest);
        setShowSetup(false);
      }
    } catch (error) {
      console.error('Error creating quest:', error);
      alert('Failed to create quest. Please try again.');
    }
  };

  const saveMilestones = async (milestonesData: CreateMilestoneInput[]) => {
    if (!quest) return;

    try {
      // Delete existing milestones
      await supabase
        .from('legacy_milestones')
        .delete()
        .eq('quest_id', quest.id);

      // Insert new milestones
      const { data: newMilestones, error } = await supabase
        .from('legacy_milestones')
        .insert(
          milestonesData.map(m => ({
            ...m,
            status: m.order_index === 0 ? 'unlocked' : 'locked' // First milestone is unlocked
          }))
        )
        .select();

      if (error) throw error;

      if (newMilestones) {
        setMilestones(newMilestones);
        
        // Update quest total value
        const totalValue = milestonesData.reduce((sum, m) => sum + m.unlock_value_cents, 0);
        await supabase
          .from('legacy_quests')
          .update({ total_value_cents: totalValue })
          .eq('id', quest.id);
      }

      alert('Quest saved successfully!');
    } catch (error) {
      console.error('Error saving milestones:', error);
      alert('Failed to save milestones. Please try again.');
    }
  };

  const publishQuest = async () => {
    if (!quest) return;

    if (milestones.length === 0) {
      alert('Please add at least one milestone before publishing');
      return;
    }

    const confirmed = confirm(
      'Publishing will make this quest visible to the beneficiary. ' +
      'You can still edit it after publishing. Continue?'
    );

    if (!confirmed) return;

    try {
      await supabase
        .from('legacy_quests')
        .update({ status: 'active' })
        .eq('id', quest.id);

      alert('Quest published! Your beneficiary will now see it.');
      router.push('/legacy/dashboard');
    } catch (error) {
      console.error('Error publishing quest:', error);
      alert('Failed to publish quest. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (showSetup && !quest) {
    return (
      <div className="setup-container">
        <div className="setup-card">
          <h1>Create Your Legacy Quest</h1>
          <p className="subtitle">
            Build a meaningful journey for your beneficiary with milestones that unlock real inheritance.
          </p>

          <div className="form-section">
            <label>Quest Title</label>
            <input
              type="text"
              value={questTitle}
              onChange={(e) => setQuestTitle(e.target.value)}
              placeholder="e.g., Path to Financial Independence"
              className="input"
            />
          </div>

          <div className="form-section">
            <label>Quest Description</label>
            <textarea
              value={questDescription}
              onChange={(e) => setQuestDescription(e.target.value)}
              placeholder="Describe the journey and what this quest represents..."
              className="input"
              rows={4}
            />
          </div>

          <div className="form-section">
            <label>Choose Beneficiary</label>
            {beneficiaries.length > 0 && (
              <select
                value={selectedBeneficiary}
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                className="input"
              >
                <option value="">Select existing or create new...</option>
                {beneficiaries.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.email})
                  </option>
                ))}
              </select>
            )}
            
            {(!selectedBeneficiary || beneficiaries.length === 0) && (
              <div className="new-beneficiary-form">
                <h3>Or Create New Beneficiary</h3>
                <input
                  type="text"
                  value={newBeneficiaryName}
                  onChange={(e) => setNewBeneficiaryName(e.target.value)}
                  placeholder="Name"
                  className="input"
                />
                <input
                  type="email"
                  value={newBeneficiaryEmail}
                  onChange={(e) => setNewBeneficiaryEmail(e.target.value)}
                  placeholder="Email"
                  className="input"
                />
                <input
                  type="text"
                  value={newBeneficiaryRelationship}
                  onChange={(e) => setNewBeneficiaryRelationship(e.target.value)}
                  placeholder="Relationship (e.g., grandson, daughter)"
                  className="input"
                />
              </div>
            )}
          </div>

          <button onClick={createQuest} className="btn-primary">
            Create Quest & Start Building
          </button>
        </div>

        <style jsx>{`
          .setup-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: var(--bg-primary);
          }

          .setup-card {
            max-width: 600px;
            width: 100%;
            background: var(--card-bg);
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }

          .setup-card h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
          }

          .subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
          }

          .form-section {
            margin-bottom: 1.5rem;
          }

          .form-section label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }

          .input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-secondary);
            font-family: inherit;
            font-size: 1rem;
          }

          .new-beneficiary-form {
            margin-top: 1rem;
            padding: 1rem;
            background: var(--bg-secondary);
            border-radius: 8px;
          }

          .new-beneficiary-form h3 {
            margin-top: 0;
            font-size: 1rem;
          }

          .new-beneficiary-form input {
            margin-bottom: 0.75rem;
          }

          .btn-primary {
            width: 100%;
            padding: 1rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.125rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="loading-container">
        <p>No quest found. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <QuestBuilder
        quest={quest}
        initialMilestones={milestones}
        templates={templates}
        onSave={saveMilestones}
        onPublish={publishQuest}
      />

      <style jsx global>{`
        :root {
          --primary-color: #6366f1;
          --primary-color-alpha: rgba(99, 102, 241, 0.1);
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --card-bg: #1e293b;
          --border-color: #334155;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
        }

        .page-container {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

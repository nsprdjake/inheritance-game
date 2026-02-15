'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LegacyAccount, LegacyQuest, Beneficiary, formatCents } from '@/lib/types/legacy';

export default function LegacyDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [account, setAccount] = useState<LegacyAccount | null>(null);
  const [quests, setQuests] = useState<LegacyQuest[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
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
        setAccount(legacyAccount);

        // Load quests
        const { data: questsData } = await supabase
          .from('legacy_quests')
          .select('*')
          .eq('legacy_account_id', legacyAccount.id)
          .order('order_index', { ascending: true });

        if (questsData) setQuests(questsData);

        // Load beneficiaries
        const { data: beneficiariesData } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('legacy_account_id', legacyAccount.id);

        if (beneficiariesData) setBeneficiaries(beneficiariesData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your legacy...</p>
      </div>
    );
  }

  const totalValue = quests.reduce((sum, q) => sum + (q.total_value_cents || 0), 0);

  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <h1>Legacy Dashboard</h1>
          <p className="subtitle">Manage your generational wealth transfer</p>
        </div>
        <button onClick={() => router.push('/legacy/create')} className="btn-primary">
          + Create New Quest
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Quests</span>
          <span className="stat-value">{quests.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Beneficiaries</span>
          <span className="stat-value">{beneficiaries.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Legacy Value</span>
          <span className="stat-value">{formatCents(totalValue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Quests</span>
          <span className="stat-value">
            {quests.filter(q => q.status === 'active').length}
          </span>
        </div>
      </div>

      {/* Quests List */}
      <div className="section">
        <h2>Your Quests</h2>
        {quests.length === 0 ? (
          <div className="empty-state">
            <p>No quests created yet.</p>
            <button onClick={() => router.push('/legacy/create')} className="btn-secondary">
              Create Your First Quest
            </button>
          </div>
        ) : (
          <div className="quests-grid">
            {quests.map(quest => {
              const beneficiary = beneficiaries.find(b => b.id === quest.beneficiary_id);
              return (
                <div key={quest.id} className="quest-card" onClick={() => router.push(`/legacy/create?quest=${quest.id}`)}>
                  <div className="quest-header">
                    <h3>{quest.title}</h3>
                    <span className={`status-badge status-${quest.status}`}>
                      {quest.status}
                    </span>
                  </div>
                  {beneficiary && (
                    <p className="quest-beneficiary">For: {beneficiary.name}</p>
                  )}
                  {quest.description && (
                    <p className="quest-description">{quest.description}</p>
                  )}
                  <div className="quest-footer">
                    <span className="quest-value">{formatCents(quest.total_value_cents)}</span>
                    <span className="quest-action">Edit →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Beneficiaries */}
      <div className="section">
        <h2>Beneficiaries</h2>
        {beneficiaries.length === 0 ? (
          <p className="empty-text">No beneficiaries added yet. Add one when creating a quest.</p>
        ) : (
          <div className="beneficiaries-list">
            {beneficiaries.map(beneficiary => (
              <div key={beneficiary.id} className="beneficiary-card">
                <div className="beneficiary-avatar">
                  {beneficiary.name.charAt(0).toUpperCase()}
                </div>
                <div className="beneficiary-info">
                  <h4>{beneficiary.name}</h4>
                  <p>{beneficiary.email}</p>
                  {beneficiary.relationship && (
                    <span className="beneficiary-relationship">{beneficiary.relationship}</span>
                  )}
                </div>
                <span className={`invitation-status status-${beneficiary.invitation_status}`}>
                  {beneficiary.invitation_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--bg-primary, #0f172a);
          color: var(--text-primary, #f1f5f9);
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header h1 {
          margin: 0;
          font-size: 2.5rem;
        }

        .subtitle {
          color: var(--text-secondary, #94a3b8);
          margin: 0.5rem 0 0 0;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .btn-secondary {
          background: var(--bg-secondary, #1e293b);
          color: var(--text-primary, #f1f5f9);
          border: 2px solid var(--border-color, #334155);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: var(--card-bg, #1e293b);
          padding: 2rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary, #94a3b8);
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #6366f1;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.75rem;
        }

        .empty-state, .empty-text {
          background: var(--card-bg, #1e293b);
          padding: 3rem;
          border-radius: 12px;
          text-align: center;
          color: var(--text-secondary, #94a3b8);
        }

        .empty-state button {
          margin-top: 1rem;
        }

        .quests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .quest-card {
          background: var(--card-bg, #1e293b);
          border: 2px solid var(--border-color, #334155);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quest-card:hover {
          border-color: #6366f1;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .quest-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .quest-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-draft { background: #6b7280; color: white; }
        .status-active { background: #10b981; color: white; }
        .status-paused { background: #f59e0b; color: white; }
        .status-completed { background: #8b5cf6; color: white; }

        .quest-beneficiary {
          font-size: 0.875rem;
          color: var(--text-secondary, #94a3b8);
          margin: 0.5rem 0;
        }

        .quest-description {
          color: var(--text-secondary, #94a3b8);
          margin: 1rem 0;
          line-height: 1.6;
        }

        .quest-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #334155);
        }

        .quest-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #6366f1;
        }

        .quest-action {
          color: var(--text-secondary, #94a3b8);
        }

        .beneficiaries-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .beneficiary-card {
          background: var(--card-bg, #1e293b);
          border: 2px solid var(--border-color, #334155);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .beneficiary-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
        }

        .beneficiary-info {
          flex: 1;
        }

        .beneficiary-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
        }

        .beneficiary-info p {
          margin: 0;
          color: var(--text-secondary, #94a3b8);
        }

        .beneficiary-relationship {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          font-size: 0.75rem;
          color: #6366f1;
        }

        .invitation-status {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-pending { background: #f59e0b; color: white; }
        .status-accepted { background: #10b981; color: white; }
        .status-declined { background: #ef4444; color: white; }

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
          border: 4px solid var(--border-color, #334155);
          border-top-color: #6366f1;
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

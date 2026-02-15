'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  LegacyMilestone,
  MilestoneEvidence,
  formatCents,
  getMilestoneIcon 
} from '@/lib/types/legacy';

interface PendingMilestone extends LegacyMilestone {
  beneficiary_name?: string;
  quest_title?: string;
  evidence?: MilestoneEvidence[];
}

export default function TrusteeDashboardPage() {
  const supabase = createClient();
  const [pendingMilestones, setPendingMilestones] = useState<PendingMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<PendingMilestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingMilestones();
  }, []);

  const loadPendingMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get trustee assignments
      const { data: trusteeData } = await supabase
        .from('legacy_trustees')
        .select('legacy_account_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (!trusteeData || trusteeData.length === 0) {
        setIsLoading(false);
        return;
      }

      const accountIds = trusteeData.map(t => t.legacy_account_id);

      // Get all pending verification milestones
      const { data: milestonesData } = await supabase
        .from('legacy_milestones')
        .select(`
          *,
          quest:legacy_quests (
            title,
            beneficiary:beneficiaries (
              name,
              email
            )
          )
        `)
        .in('quest_id', 
          supabase
            .from('legacy_quests')
            .select('id')
            .in('legacy_account_id', accountIds)
        )
        .eq('status', 'pending_verification')
        .order('updated_at', { ascending: false });

      if (milestonesData) {
        // Load evidence for each milestone
        const milestonesWithEvidence = await Promise.all(
          milestonesData.map(async (milestone: any) => {
            const { data: evidenceData } = await supabase
              .from('milestone_evidence')
              .select('*')
              .eq('milestone_id', milestone.id)
              .order('submitted_at', { ascending: false });

            return {
              ...milestone,
              beneficiary_name: milestone.quest?.beneficiary?.name,
              quest_title: milestone.quest?.title,
              evidence: evidenceData || []
            };
          })
        );

        setPendingMilestones(milestonesWithEvidence);
      }
    } catch (error) {
      console.error('Error loading pending milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveMilestone = async (milestoneId: string) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('legacy_milestones')
        .update({ 
          status: 'completed',
          verified_at: new Date().toISOString(),
          verified_by: user.id
        })
        .eq('id', milestoneId);

      alert('Milestone approved! Funds are now unlocked for the beneficiary.');
      setSelectedMilestone(null);
      await loadPendingMilestones();
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectMilestone = async (milestoneId: string) => {
    const reason = prompt('Reason for rejection (will be sent to beneficiary):');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('legacy_milestones')
        .update({ 
          status: 'in_progress', // Send back to in_progress
          rejection_reason: reason,
          verified_by: user.id
        })
        .eq('id', milestoneId);

      alert('Milestone rejected. Beneficiary can resubmit after making improvements.');
      setSelectedMilestone(null);
      await loadPendingMilestones();
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      alert('Failed to reject milestone. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading trustee dashboard...</p>
      </div>
    );
  }

  return (
    <div className="trustee-dashboard">
      <div className="header">
        <h1>Trustee Dashboard</h1>
        <p className="subtitle">Review and verify milestone achievements</p>
      </div>

      {pendingMilestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h2>All Caught Up!</h2>
          <p>No milestones pending verification at this time.</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Pending Queue */}
          <div className="pending-queue">
            <h2>Pending Verification ({pendingMilestones.length})</h2>
            <div className="queue-list">
              {pendingMilestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`queue-item ${selectedMilestone?.id === milestone.id ? 'active' : ''}`}
                  onClick={() => setSelectedMilestone(milestone)}
                >
                  <div className="queue-icon">{getMilestoneIcon(milestone.milestone_type)}</div>
                  <div className="queue-info">
                    <h4>{milestone.title}</h4>
                    <p className="queue-meta">
                      {milestone.beneficiary_name} • {milestone.quest_title}
                    </p>
                    <p className="queue-value">{formatCents(milestone.unlock_value_cents)}</p>
                  </div>
                  <div className="queue-arrow">→</div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Panel */}
          {selectedMilestone ? (
            <div className="review-panel">
              <div className="review-header">
                <div>
                  <div className="milestone-icon-large">
                    {getMilestoneIcon(selectedMilestone.milestone_type)}
                  </div>
                  <h2>{selectedMilestone.title}</h2>
                  <p className="review-meta">
                    {selectedMilestone.beneficiary_name} • {selectedMilestone.quest_title}
                  </p>
                </div>
                <div className="review-value">
                  {formatCents(selectedMilestone.unlock_value_cents)}
                </div>
              </div>

              <div className="review-section">
                <h3>Description</h3>
                <p>{selectedMilestone.description || 'No description provided.'}</p>
              </div>

              {selectedMilestone.verification_instructions && (
                <div className="review-section">
                  <h3>Verification Instructions</h3>
                  <p>{selectedMilestone.verification_instructions}</p>
                </div>
              )}

              {selectedMilestone.evidence && selectedMilestone.evidence.length > 0 && (
                <div className="review-section">
                  <h3>Evidence Submitted</h3>
                  <div className="evidence-list">
                    {selectedMilestone.evidence.map(evidence => (
                      <div key={evidence.id} className="evidence-item">
                        <div className="evidence-type">
                          {evidence.evidence_type === 'text' && '📝'}
                          {evidence.evidence_type === 'photo' && '📷'}
                          {evidence.evidence_type === 'document' && '📄'}
                          {evidence.evidence_type === 'link' && '🔗'}
                          {' '}{evidence.evidence_type}
                        </div>
                        {evidence.content && (
                          <p className="evidence-content">{evidence.content}</p>
                        )}
                        {evidence.file_name && (
                          <p className="evidence-file">📎 {evidence.file_name}</p>
                        )}
                        <p className="evidence-date">
                          Submitted: {new Date(evidence.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="review-actions">
                <button
                  onClick={() => rejectMilestone(selectedMilestone.id)}
                  disabled={isProcessing}
                  className="btn-reject"
                >
                  {isProcessing ? 'Processing...' : 'Reject & Request Changes'}
                </button>
                <button
                  onClick={() => approveMilestone(selectedMilestone.id)}
                  disabled={isProcessing}
                  className="btn-approve"
                >
                  {isProcessing ? 'Processing...' : `Approve & Unlock ${formatCents(selectedMilestone.unlock_value_cents)}`}
                </button>
              </div>

              <div className="review-note">
                <strong>Note:</strong> Approving will immediately unlock the funds for the beneficiary.
                Make sure all requirements have been met before approving.
              </div>
            </div>
          ) : (
            <div className="review-panel-empty">
              <p>Select a milestone from the queue to review</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .trustee-dashboard {
          min-height: 100vh;
          background: var(--bg-primary, #0f172a);
          color: var(--text-primary, #f1f5f9);
          padding: 2rem;
        }

        .header {
          max-width: 1400px;
          margin: 0 auto 2rem;
        }

        .header h1 {
          margin: 0;
          font-size: 2.5rem;
        }

        .subtitle {
          color: var(--text-secondary, #94a3b8);
          margin: 0.5rem 0 0 0;
        }

        .dashboard-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
        }

        .pending-queue {
          background: var(--card-bg, #1e293b);
          border-radius: 16px;
          padding: 1.5rem;
          height: fit-content;
        }

        .pending-queue h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .queue-item {
          padding: 1rem;
          background: var(--bg-secondary, #1e293b);
          border: 2px solid var(--border-color, #334155);
          border-radius: 12px;
          display: flex;
          gap: 1rem;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .queue-item:hover {
          border-color: #6366f1;
          transform: translateX(4px);
        }

        .queue-item.active {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }

        .queue-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .queue-info {
          flex: 1;
          min-width: 0;
        }

        .queue-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-meta {
          font-size: 0.75rem;
          color: var(--text-secondary, #94a3b8);
          margin: 0;
        }

        .queue-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #6366f1;
          margin: 0.25rem 0 0 0;
        }

        .queue-arrow {
          color: var(--text-secondary, #94a3b8);
          font-size: 1.5rem;
          opacity: 0.5;
        }

        .review-panel {
          background: var(--card-bg, #1e293b);
          border-radius: 16px;
          padding: 2rem;
        }

        .review-panel-empty {
          background: var(--card-bg, #1e293b);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary, #94a3b8);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 2rem;
          border-bottom: 2px solid var(--border-color, #334155);
          margin-bottom: 2rem;
        }

        .milestone-icon-large {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .review-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
        }

        .review-meta {
          color: var(--text-secondary, #94a3b8);
          margin: 0;
        }

        .review-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #6366f1;
        }

        .review-section {
          margin-bottom: 2rem;
        }

        .review-section h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.25rem;
          color: var(--text-secondary, #94a3b8);
          text-transform: uppercase;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .review-section p {
          margin: 0;
          line-height: 1.6;
        }

        .evidence-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .evidence-item {
          background: var(--bg-secondary, #1e293b);
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #6366f1;
        }

        .evidence-type {
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: capitalize;
        }

        .evidence-content {
          margin: 0.5rem 0;
          color: var(--text-secondary, #94a3b8);
        }

        .evidence-file {
          margin: 0.5rem 0;
          color: #6366f1;
          font-weight: 600;
        }

        .evidence-date {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary, #94a3b8);
        }

        .review-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-approve, .btn-reject {
          flex: 1;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn-reject {
          background: transparent;
          color: #ef4444;
          border: 2px solid #ef4444;
        }

        .btn-reject:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-approve:disabled,
        .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .review-note {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(245, 158, 11, 0.1);
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
          color: #fbbf24;
          font-size: 0.875rem;
        }

        .loading-container, .empty-state {
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
          border-top-color: var(--primary-color, #6366f1);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h2 {
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: var(--text-secondary, #94a3b8);
        }
      `}</style>
    </div>
  );
}

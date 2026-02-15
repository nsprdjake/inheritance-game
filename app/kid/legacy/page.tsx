'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LegacyQuest, 
  LegacyMilestone, 
  LegacyMedia,
  formatCents,
  getMilestoneIcon,
  getMilestoneStatusColor 
} from '@/lib/types/legacy';
import LockedVideoDisplay from '@/components/legacy/LockedVideoDisplay';

export default function BeneficiaryLegacyPage() {
  const supabase = createClientComponentClient();
  const [quests, setQuests] = useState<LegacyQuest[]>([]);
  const [milestones, setMilestones] = useState<Record<string, LegacyMilestone[]>>({});
  const [media, setMedia] = useState<Record<string, LegacyMedia[]>>({});
  const [selectedQuest, setSelectedQuest] = useState<LegacyQuest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    loadLegacyQuests();
  }, []);

  const loadLegacyQuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get beneficiary record
      const { data: beneficiaryData } = await supabase
        .from('beneficiaries')
        .select('id, legacy_account_id')
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (!beneficiaryData || beneficiaryData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get quests for this beneficiary
      const { data: questsData } = await supabase
        .from('legacy_quests')
        .select('*')
        .in('beneficiary_id', beneficiaryData.map(b => b.id))
        .eq('status', 'active')
        .order('order_index', { ascending: true });

      if (questsData && questsData.length > 0) {
        setQuests(questsData);
        setSelectedQuest(questsData[0]);

        // Load milestones for each quest
        for (const quest of questsData) {
          const { data: milestonesData } = await supabase
            .from('legacy_milestones')
            .select('*')
            .eq('quest_id', quest.id)
            .order('order_index', { ascending: true });

          if (milestonesData) {
            setMilestones(prev => ({ ...prev, [quest.id]: milestonesData }));

            // Load media for all milestones (both locked and unlocked)
            for (const milestone of milestonesData) {
              const { data: mediaData } = await supabase
                .from('legacy_media')
                .select('*')
                .eq('milestone_id', milestone.id);

              if (mediaData) {
                setMedia(prev => ({ ...prev, [milestone.id]: mediaData }));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading legacy quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMilestone = async (milestoneId: string) => {
    try {
      await supabase
        .from('legacy_milestones')
        .update({ status: 'in_progress' })
        .eq('id', milestoneId);

      // Reload quests to update UI
      await loadLegacyQuests();
    } catch (error) {
      console.error('Error starting milestone:', error);
    }
  };

  const submitForVerification = async (milestoneId: string, notes?: string) => {
    try {
      await supabase
        .from('legacy_milestones')
        .update({ status: 'pending_verification' })
        .eq('id', milestoneId);

      if (notes) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('milestone_evidence')
            .insert({
              milestone_id: milestoneId,
              submitted_by: user.id,
              evidence_type: 'text',
              content: notes
            });
        }
      }

      alert('Submitted for verification! Your trustee will review it soon.');
      await loadLegacyQuests();
    } catch (error) {
      console.error('Error submitting milestone:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your legacy quest...</p>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📜</div>
        <h2>No Legacy Quests Yet</h2>
        <p>When someone creates a legacy quest for you, it will appear here.</p>
      </div>
    );
  }

  const currentMilestones = selectedQuest ? milestones[selectedQuest.id] || [] : [];
  const completedMilestones = currentMilestones.filter(m => m.status === 'completed');
  const totalUnlocked = completedMilestones.reduce((sum, m) => sum + m.unlock_value_cents, 0);
  const totalValue = selectedQuest?.total_value_cents || 0;
  const progress = totalValue > 0 ? (totalUnlocked / totalValue) * 100 : 0;

  return (
    <div className="legacy-page">
      <div className="header">
        <div>
          <h1>Your Legacy Quest</h1>
          <p className="subtitle">A journey left for you with love and wisdom</p>
        </div>
      </div>

      {selectedQuest && (
        <>
          {/* Progress Overview */}
          <div className="progress-card">
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">{formatCents(totalUnlocked)}</span>
                <span className="stat-label">Unlocked</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatCents(totalValue - totalUnlocked)}</span>
                <span className="stat-label">Remaining</span>
              </div>
              <div className="stat">
                <span className="stat-value">{completedMilestones.length}/{currentMilestones.length}</span>
                <span className="stat-label">Milestones</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Intro Message */}
          {selectedQuest.intro_message && (
            <div className="message-card">
              <div className="message-icon">💌</div>
              <div className="message-content">
                <h3>Message for You</h3>
                <p>{selectedQuest.intro_message}</p>
              </div>
            </div>
          )}

          {/* Quest Timeline */}
          <div className="timeline">
            <h2>Quest Timeline</h2>
            {currentMilestones.map((milestone, index) => {
              const milestoneMedia = media[milestone.id] || [];
              const isLocked = milestone.status === 'locked';
              const isCompleted = milestone.status === 'completed';
              const isPending = milestone.status === 'pending_verification';
              const isInProgress = milestone.status === 'in_progress';

              return (
                <div key={milestone.id} className={`milestone-item milestone-${milestone.status}`}>
                  <div className="milestone-indicator">
                    <div className={`milestone-number ${isCompleted ? 'completed' : ''}`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    {index < currentMilestones.length - 1 && (
                      <div className={`connector ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>

                  <div className="milestone-content">
                    <div className="milestone-header">
                      <div>
                        <div className="milestone-meta">
                          <span className="milestone-icon">{getMilestoneIcon(milestone.milestone_type)}</span>
                          <h3>{milestone.title}</h3>
                          {isLocked && <span className="locked-badge">🔒 Locked</span>}
                          {isPending && <span className="pending-badge">⏳ Pending Review</span>}
                          {isCompleted && <span className="completed-badge">✅ Completed</span>}
                        </div>
                        <p className="milestone-description">{milestone.description}</p>
                      </div>
                      <div className="milestone-value">
                        {formatCents(milestone.unlock_value_cents)}
                      </div>
                    </div>

                    {!isLocked && (
                      <>
                        {milestone.verification_instructions && (
                          <div className="instructions">
                            <strong>What to do:</strong> {milestone.verification_instructions}
                          </div>
                        )}

                        {/* Media (Videos/Letters) */}
                        {milestoneMedia.length > 0 && (
                          <div className="milestone-media">
                            {milestoneMedia.map(m => (
                              <div key={m.id} className="media-item">
                                {m.media_type === 'video' && (
                                  <LockedVideoDisplay
                                    video={m}
                                    milestone={milestone}
                                    showUnlockCeremony={false}
                                  />
                                )}
                                {m.media_type === 'letter' && (
                                  <div className="letter-card">
                                    <div className="letter-icon">✉️</div>
                                    <div>
                                      <h4>{m.title || 'Letter'}</h4>
                                      <p>{m.content}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {!isCompleted && !isPending && (
                          <div className="milestone-actions">
                            {!isInProgress && (
                              <button 
                                onClick={() => startMilestone(milestone.id)}
                                className="btn-secondary"
                              >
                                Start Working
                              </button>
                            )}
                            {isInProgress && (
                              <button 
                                onClick={() => {
                                  const notes = prompt('Add any notes or proof of completion (optional):');
                                  submitForVerification(milestone.id, notes || undefined);
                                }}
                                className="btn-primary"
                              >
                                Submit for Verification
                              </button>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <div className="pending-message">
                            ⏳ Waiting for trustee verification...
                          </div>
                        )}

                        {isCompleted && (
                          <div className="completed-message">
                            🎉 Congratulations! You unlocked {formatCents(milestone.unlock_value_cents)}!
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {completedMilestones.length === currentMilestones.length && selectedQuest.completion_message && (
            <div className="completion-card">
              <div className="completion-icon">🏆</div>
              <h2>Quest Complete!</h2>
              <p>{selectedQuest.completion_message}</p>
              <div className="final-value">
                Total Unlocked: {formatCents(totalUnlocked)}
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .legacy-page {
          min-height: 100vh;
          background: var(--bg-primary, #0f172a);
          color: var(--text-primary, #f1f5f9);
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 2rem;
        }

        .header h1 {
          margin: 0;
          font-size: 2.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          margin: 0.5rem 0 0 0;
          color: var(--text-secondary, #94a3b8);
          font-size: 1.125rem;
        }

        .progress-card {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          color: white;
        }

        .progress-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .progress-bar-container {
          height: 12px;
          background: rgba(255,255,255,0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: white;
          transition: width 0.5s ease;
        }

        .message-card {
          background: var(--card-bg, #1e293b);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          gap: 1rem;
          border: 2px solid #fbbf24;
        }

        .message-icon {
          font-size: 2rem;
        }

        .message-content h3 {
          margin: 0 0 0.5rem 0;
          color: #fbbf24;
        }

        .timeline {
          margin-top: 2rem;
        }

        .timeline h2 {
          margin-bottom: 2rem;
        }

        .milestone-item {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .milestone-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 0.5rem;
        }

        .milestone-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-secondary, #1e293b);
          border: 3px solid var(--border-color, #334155);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .milestone-number.completed {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .connector {
          width: 3px;
          flex: 1;
          background: var(--border-color, #334155);
          margin: 0.5rem 0;
          min-height: 60px;
        }

        .connector.completed {
          background: #10b981;
        }

        .milestone-content {
          flex: 1;
          background: var(--card-bg, #1e293b);
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid var(--border-color, #334155);
        }

        .milestone-locked .milestone-content {
          opacity: 0.6;
        }

        .milestone-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .milestone-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .milestone-icon {
          font-size: 1.5rem;
        }

        .milestone-meta h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .locked-badge, .pending-badge, .completed-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .locked-badge {
          background: #6b7280;
          color: white;
        }

        .pending-badge {
          background: #f59e0b;
          color: white;
        }

        .completed-badge {
          background: #10b981;
          color: white;
        }

        .milestone-description {
          color: var(--text-secondary, #94a3b8);
          margin: 0.5rem 0;
        }

        .milestone-value {
          font-size: 2rem;
          font-weight: 700;
          color: #6366f1;
          flex-shrink: 0;
        }

        .instructions {
          background: var(--bg-secondary, #1e293b);
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          border-left: 4px solid #6366f1;
        }

        .milestone-media {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .video-card, .letter-card {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary, #1e293b);
          border-radius: 8px;
        }

        .video-icon, .letter-icon {
          font-size: 2rem;
        }

        .milestone-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .btn-primary, .btn-secondary, .btn-play {
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

        .btn-secondary {
          background: var(--bg-secondary, #1e293b);
          color: var(--text-primary, #f1f5f9);
          border: 2px solid var(--border-color, #334155);
        }

        .btn-play {
          background: transparent;
          color: #6366f1;
          border: 2px solid #6366f1;
          padding: 0.5rem 1rem;
        }

        .pending-message, .completed-message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
        }

        .pending-message {
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
        }

        .completed-message {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .completion-card {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          color: white;
          margin-top: 2rem;
        }

        .completion-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .completion-card h2 {
          margin: 0 0 1rem 0;
          font-size: 2.5rem;
        }

        .final-value {
          margin-top: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
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

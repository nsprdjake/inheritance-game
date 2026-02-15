'use client';

import { useState, useEffect } from 'react';
import { 
  LegacyQuest, 
  LegacyMilestone, 
  CreateMilestoneInput,
  AchievementTemplate,
  formatCents,
  getMilestoneIcon,
  MilestoneType
} from '@/lib/types/legacy';
import { createClient } from '@/lib/supabase/client';
import VideoMessageSection from './VideoMessageSection';

interface QuestBuilderProps {
  quest: LegacyQuest;
  initialMilestones?: LegacyMilestone[];
  templates: AchievementTemplate[];
  onSave: (milestones: CreateMilestoneInput[]) => Promise<void>;
  onPublish?: () => Promise<void>;
}

export default function QuestBuilder({ 
  quest, 
  initialMilestones = [], 
  templates,
  onSave,
  onPublish 
}: QuestBuilderProps) {
  const supabase = createClient();
  const [milestones, setMilestones] = useState<CreateMilestoneInput[]>(
    initialMilestones.map(m => ({
      quest_id: quest.id,
      title: m.title,
      description: m.description,
      milestone_type: m.milestone_type,
      unlock_value_cents: m.unlock_value_cents,
      verification_type: m.verification_type,
      verification_instructions: m.verification_instructions,
      order_index: m.order_index,
      prerequisites: m.prerequisites,
    }))
  );
  const [milestoneVideos, setMilestoneVideos] = useState<Record<string, any>>({});
  const [isEditingMilestone, setIsEditingMilestone] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing videos for milestones
  useEffect(() => {
    loadMilestoneVideos();
  }, [initialMilestones]);

  const loadMilestoneVideos = async () => {
    if (initialMilestones.length === 0) return;

    const milestoneIds = initialMilestones.map(m => m.id).filter(Boolean);
    if (milestoneIds.length === 0) return;

    try {
      const { data: videos } = await supabase
        .from('legacy_media')
        .select('*')
        .in('milestone_id', milestoneIds)
        .eq('media_type', 'video');

      if (videos) {
        const videoMap: Record<string, any> = {};
        videos.forEach(video => {
          if (video.milestone_id) {
            videoMap[video.milestone_id] = video;
          }
        });
        setMilestoneVideos(videoMap);
      }
    } catch (err) {
      console.error('Error loading milestone videos:', err);
    }
  };

  const addMilestone = (template?: AchievementTemplate) => {
    const newMilestone: CreateMilestoneInput = {
      quest_id: quest.id,
      title: template?.title || 'New Milestone',
      description: template?.description,
      milestone_type: (template?.category as MilestoneType) || 'custom',
      unlock_value_cents: template?.suggested_value_cents || 100000,
      verification_type: template?.verification_type || 'manual',
      verification_instructions: template?.verification_instructions,
      order_index: milestones.length,
      prerequisites: milestones.length > 0 ? [milestones[milestones.length - 1].title] : [],
    };
    setMilestones([...milestones, newMilestone]);
    setIsEditingMilestone(milestones.length);
    setShowTemplates(false);
  };

  const updateMilestone = (index: number, updates: Partial<CreateMilestoneInput>) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], ...updates };
    setMilestones(updated);
  };

  const deleteMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    // Reorder indices
    const reordered = updated.map((m, i) => ({ ...m, order_index: i }));
    setMilestones(reordered);
    setIsEditingMilestone(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...milestones];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    // Reorder indices
    const reordered = updated.map((m, i) => ({ ...m, order_index: i }));
    setMilestones(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(milestones);
    } finally {
      setIsSaving(false);
    }
  };

  const totalValue = milestones.reduce((sum, m) => sum + m.unlock_value_cents, 0);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="quest-builder">
      {/* Header */}
      <div className="quest-builder-header">
        <div>
          <h2>{quest.title}</h2>
          <p className="text-sm opacity-70">{quest.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving} className="btn-secondary">
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          {onPublish && (
            <button onClick={onPublish} className="btn-primary">
              Publish Quest
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="quest-stats">
        <div className="stat-card">
          <span className="stat-label">Total Milestones</span>
          <span className="stat-value">{milestones.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">{formatCents(totalValue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className={`status-badge status-${quest.status}`}>
            {quest.status}
          </span>
        </div>
      </div>

      {/* Quest Timeline */}
      <div className="quest-timeline">
        <div className="timeline-header">
          <h3>Quest Timeline</h3>
          <button onClick={() => setShowTemplates(!showTemplates)} className="btn-sm">
            {showTemplates ? 'Hide Templates' : '+ Add from Template'}
          </button>
        </div>

        {/* Template Library */}
        {showTemplates && (
          <div className="template-library">
            <div className="template-filters">
              {['all', 'education', 'financial', 'career', 'life', 'community', 'skill'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="template-grid">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card" onClick={() => addMilestone(template)}>
                  <div className="template-icon">{template.icon}</div>
                  <div>
                    <h4>{template.title}</h4>
                    <p className="text-sm">{template.description}</p>
                    <div className="template-meta">
                      <span className={`difficulty-badge difficulty-${template.difficulty}`}>
                        {template.difficulty}
                      </span>
                      <span className="template-value">
                        {template.suggested_value_cents ? formatCents(template.suggested_value_cents) : 'Custom'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone List */}
        <div className="milestone-list">
          {milestones.length === 0 ? (
            <div className="empty-state">
              <p>No milestones yet. Add your first milestone to get started!</p>
              <button onClick={() => addMilestone()} className="btn-primary">
                + Create Custom Milestone
              </button>
            </div>
          ) : (
            milestones.map((milestone, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`milestone-card ${isEditingMilestone === index ? 'editing' : ''} ${
                  draggedIndex === index ? 'dragging' : ''
                }`}
              >
                <div className="milestone-handle">☰</div>
                <div className="milestone-icon">{getMilestoneIcon(milestone.milestone_type)}</div>
                
                {isEditingMilestone === index ? (
                  <div className="milestone-editor">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, { title: e.target.value })}
                      className="milestone-title-input"
                      placeholder="Milestone title"
                    />
                    <textarea
                      value={milestone.description || ''}
                      onChange={(e) => updateMilestone(index, { description: e.target.value })}
                      className="milestone-description-input"
                      placeholder="Describe what needs to be achieved..."
                      rows={3}
                    />
                    
                    <div className="milestone-config">
                      <div className="config-row">
                        <label>Unlock Amount</label>
                        <input
                          type="number"
                          value={milestone.unlock_value_cents / 100}
                          onChange={(e) => updateMilestone(index, { 
                            unlock_value_cents: Math.round(parseFloat(e.target.value) * 100) 
                          })}
                          className="config-input"
                          min="0"
                          step="100"
                        />
                      </div>
                      
                      <div className="config-row">
                        <label>Type</label>
                        <select
                          value={milestone.milestone_type}
                          onChange={(e) => updateMilestone(index, { 
                            milestone_type: e.target.value as MilestoneType 
                          })}
                          className="config-input"
                        >
                          <option value="custom">Custom</option>
                          <option value="education">Education</option>
                          <option value="financial">Financial</option>
                          <option value="career">Career</option>
                          <option value="life_event">Life Event</option>
                          <option value="community">Community</option>
                          <option value="skill">Skill</option>
                        </select>
                      </div>
                      
                      <div className="config-row">
                        <label>Verification</label>
                        <select
                          value={milestone.verification_type}
                          onChange={(e) => updateMilestone(index, { 
                            verification_type: e.target.value as any
                          })}
                          className="config-input"
                        >
                          <option value="manual">Manual (Trustee)</option>
                          <option value="document">Document Upload</option>
                          <option value="photo">Photo Proof</option>
                        </select>
                      </div>
                    </div>
                    
                    <textarea
                      value={milestone.verification_instructions || ''}
                      onChange={(e) => updateMilestone(index, { verification_instructions: e.target.value })}
                      className="milestone-instructions-input"
                      placeholder="Verification instructions for trustee..."
                      rows={2}
                    />
                    
                    {/* Video Message Section */}
                    {initialMilestones[index]?.id && (
                      <VideoMessageSection
                        legacyAccountId={quest.legacy_account_id}
                        milestoneId={initialMilestones[index].id}
                        existingVideo={milestoneVideos[initialMilestones[index].id]}
                        onVideoSaved={loadMilestoneVideos}
                      />
                    )}
                    
                    <div className="milestone-actions">
                      <button onClick={() => setIsEditingMilestone(null)} className="btn-sm btn-secondary">
                        Done
                      </button>
                      <button onClick={() => deleteMilestone(index)} className="btn-sm btn-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="milestone-view" onClick={() => setIsEditingMilestone(index)}>
                    <div className="milestone-header">
                      <h4>{milestone.title}</h4>
                      <span className="milestone-value">{formatCents(milestone.unlock_value_cents)}</span>
                    </div>
                    {milestone.description && (
                      <p className="milestone-description">{milestone.description}</p>
                    )}
                    <div className="milestone-meta">
                      <span className="meta-tag">{milestone.milestone_type}</span>
                      <span className="meta-tag">{milestone.verification_type} verification</span>
                    </div>
                  </div>
                )}
                
                {index < milestones.length - 1 && <div className="milestone-connector">↓</div>}
              </div>
            ))
          )}
        </div>

        {/* Add Milestone Button */}
        {milestones.length > 0 && (
          <button onClick={() => addMilestone()} className="btn-add-milestone">
            + Add Another Milestone
          </button>
        )}
      </div>

      <style jsx>{`
        .quest-builder {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .quest-builder-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--border-color);
        }

        .quest-builder-header h2 {
          margin: 0;
          font-size: 2rem;
        }

        .quest-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--card-bg);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.7;
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .quest-timeline {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 2rem;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .template-library {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .template-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 2px solid transparent;
          background: var(--card-bg);
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }

        .filter-btn.active {
          border-color: var(--primary-color);
          background: var(--primary-color-alpha);
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .template-card {
          background: var(--card-bg);
          padding: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          gap: 1rem;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .template-icon {
          font-size: 2rem;
        }

        .template-meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          align-items: center;
        }

        .difficulty-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .difficulty-easy { background: #10b981; color: white; }
        .difficulty-medium { background: #f59e0b; color: white; }
        .difficulty-hard { background: #ef4444; color: white; }
        .difficulty-epic { background: #8b5cf6; color: white; }

        .template-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-color);
        }

        .milestone-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .milestone-card {
          position: relative;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          transition: all 0.2s;
        }

        .milestone-card.editing {
          border-color: var(--primary-color);
          background: var(--card-bg);
        }

        .milestone-card.dragging {
          opacity: 0.5;
        }

        .milestone-handle {
          cursor: grab;
          font-size: 1.5rem;
          color: var(--text-secondary);
        }

        .milestone-handle:active {
          cursor: grabbing;
        }

        .milestone-icon {
          font-size: 2rem;
        }

        .milestone-view {
          flex: 1;
          cursor: pointer;
        }

        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .milestone-header h4 {
          margin: 0;
          font-size: 1.25rem;
        }

        .milestone-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .milestone-description {
          color: var(--text-secondary);
          margin: 0.5rem 0;
        }

        .milestone-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .meta-tag {
          padding: 0.25rem 0.75rem;
          background: var(--primary-color-alpha);
          border-radius: 12px;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .milestone-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .milestone-title-input,
        .milestone-description-input,
        .milestone-instructions-input,
        .config-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          font-family: inherit;
        }

        .milestone-title-input {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .milestone-config {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .config-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .config-row label {
          font-size: 0.875rem;
          font-weight: 600;
          opacity: 0.7;
        }

        .milestone-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .milestone-connector {
          position: absolute;
          bottom: -1.5rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          color: var(--primary-color);
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .btn-add-milestone {
          width: 100%;
          padding: 1rem;
          margin-top: 1rem;
          border: 2px dashed var(--border-color);
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-add-milestone:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .btn-primary, .btn-secondary, .btn-sm, .btn-danger {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .btn-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-draft { background: #6b7280; color: white; }
        .status-active { background: #10b981; color: white; }
        .status-paused { background: #f59e0b; color: white; }
        .status-completed { background: #8b5cf6; color: white; }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';;
import VideoUploader from './VideoUploader';
import VideoRecorder from './VideoRecorder';

interface VideoMessageSectionProps {
  legacyAccountId: string;
  milestoneId?: string;
  existingVideo?: {
    id: string;
    storage_path: string;
    thumbnail_path?: string;
    duration_seconds?: number;
  } | null;
  onVideoSaved?: () => void;
}

type Mode = 'choice' | 'upload' | 'record' | 'preview';

export default function VideoMessageSection({
  legacyAccountId,
  milestoneId,
  existingVideo,
  onVideoSaved
}: VideoMessageSectionProps) {
  const [mode, setMode] = useState<Mode>(existingVideo ? 'preview' : 'choice');
  const [currentVideo, setCurrentVideo] = useState(existingVideo);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleVideoComplete = async (videoData: {
    storage_path: string;
    thumbnail_path?: string;
    duration_seconds?: number;
    file_size_bytes: number;
    mime_type: string;
  }) => {
    try {
      // Save to legacy_media table
      const { data, error } = await supabase
        .from('legacy_media')
        .insert({
          legacy_account_id: legacyAccountId,
          milestone_id: milestoneId,
          media_type: 'video',
          storage_path: videoData.storage_path,
          thumbnail_path: videoData.thumbnail_path,
          duration_seconds: videoData.duration_seconds,
          file_size_bytes: videoData.file_size_bytes,
          mime_type: videoData.mime_type,
          unlock_condition: 'milestone_complete',
          is_unlocked: false
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentVideo(data);
      setMode('preview');
      
      if (onVideoSaved) {
        onVideoSaved();
      }
    } catch (err: any) {
      console.error('Error saving video metadata:', err);
      alert('Video uploaded but failed to save metadata. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!currentVideo) return;

    const confirmed = confirm('Are you sure you want to delete this video message? This cannot be undone.');
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete from legacy_media
      const { error: dbError } = await supabase
        .from('legacy_media')
        .delete()
        .eq('id', currentVideo.id);

      if (dbError) throw dbError;

      // Delete from storage
      const pathMatch = currentVideo.storage_path.match(/legacy-videos\/(.+)/);
      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage.from('legacy-videos').remove([filePath]);

        // Delete thumbnail if exists
        if (currentVideo.thumbnail_path) {
          await supabase.storage.from('legacy-videos').remove([currentVideo.thumbnail_path]);
        }
      }

      setCurrentVideo(null);
      setMode('choice');
    } catch (err: any) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-message-section">
      <div className="section-header">
        <h3>🎬 Video Message</h3>
        <p className="section-description">
          Record or upload a video message that will unlock when this milestone is completed
        </p>
      </div>

      {mode === 'choice' && (
        <div className="mode-selector">
          <button 
            className="mode-button record"
            onClick={() => setMode('record')}
          >
            <div className="mode-icon">🎥</div>
            <div className="mode-label">Record Now</div>
            <div className="mode-hint">Use your camera</div>
          </button>

          <button 
            className="mode-button upload"
            onClick={() => setMode('upload')}
          >
            <div className="mode-icon">📁</div>
            <div className="mode-label">Upload File</div>
            <div className="mode-hint">From your device</div>
          </button>
        </div>
      )}

      {mode === 'upload' && (
        <VideoUploader
          legacyAccountId={legacyAccountId}
          milestoneId={milestoneId}
          onUploadComplete={handleVideoComplete}
          onCancel={() => setMode('choice')}
        />
      )}

      {mode === 'record' && (
        <VideoRecorder
          legacyAccountId={legacyAccountId}
          milestoneId={milestoneId}
          onRecordComplete={handleVideoComplete}
          onCancel={() => setMode('choice')}
        />
      )}

      {mode === 'preview' && currentVideo && (
        <div className="video-preview-card">
          <video
            src={currentVideo.storage_path}
            controls
            className="preview-video"
          />
          
          <div className="video-info">
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="status-badge locked">
                🔒 Locked until milestone complete
              </span>
            </div>
            {currentVideo.duration_seconds && (
              <div className="info-row">
                <span className="info-label">Duration:</span>
                <span>{formatDuration(currentVideo.duration_seconds)}</span>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button 
              onClick={() => setMode('choice')} 
              className="btn-secondary"
              disabled={isDeleting}
            >
              Replace Video
            </button>
            <button 
              onClick={handleDelete} 
              className="btn-danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Video'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-message-section {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .section-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .section-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .mode-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .mode-button {
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 2rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          font-family: inherit;
        }

        .mode-button:hover {
          border-color: var(--primary-color);
          background: var(--primary-color-alpha);
          transform: translateY(-2px);
        }

        .mode-button.record:hover {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .mode-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .mode-label {
          font-weight: 700;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .mode-hint {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .video-preview-card {
          margin-top: 1.5rem;
        }

        .preview-video {
          width: 100%;
          border-radius: 8px;
          background: #000;
          max-height: 400px;
        }

        .video-info {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.locked {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .preview-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .btn-secondary,
        .btn-danger {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-family: inherit;
        }

        .btn-secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--border-color);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }

        .btn-secondary:disabled,
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .mode-selector {
            grid-template-columns: 1fr;
          }

          .preview-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

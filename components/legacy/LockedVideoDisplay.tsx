'use client';

import { useState } from 'react';
import UnlockCeremony from './UnlockCeremony';

interface VideoData {
  id: string;
  storage_path: string;
  thumbnail_path?: string;
  duration_seconds?: number;
  is_unlocked: boolean;
  unlocked_at?: string;
}

interface MilestoneData {
  id: string;
  title: string;
  status: string;
}

interface BenefactorData {
  relationship?: string;
}

interface LockedVideoDisplayProps {
  video: VideoData;
  milestone: MilestoneData;
  benefactor?: BenefactorData;
  showUnlockCeremony?: boolean;
  onCeremonyComplete?: () => void;
}

export default function LockedVideoDisplay({
  video,
  milestone,
  benefactor,
  showUnlockCeremony = false,
  onCeremonyComplete
}: LockedVideoDisplayProps) {
  const [showCeremony, setShowCeremony] = useState(showUnlockCeremony);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    if (!video.is_unlocked) return;

    setIsDownloading(true);
    try {
      const response = await fetch(video.storage_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-${milestone.title.replace(/[^a-z0-9]/gi, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download video. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCeremonyComplete = () => {
    setShowCeremony(false);
    if (onCeremonyComplete) {
      onCeremonyComplete();
    }
  };

  if (showCeremony && video.is_unlocked) {
    return (
      <UnlockCeremony
        milestoneName={milestone.title}
        relationship={benefactor?.relationship || 'benefactor'}
        videoUrl={video.storage_path}
        onComplete={handleCeremonyComplete}
      />
    );
  }

  if (!video.is_unlocked) {
    // Locked state
    return (
      <div className="video-card locked">
        <div className="lock-overlay">
          <div className="lock-icon">🔒</div>
          <h3>Locked Message</h3>
          <p className="lock-message">
            Complete <strong>{milestone.title}</strong> to unlock this message
          </p>
          {video.duration_seconds && (
            <div className="video-hint">
              Video message: {formatDuration(video.duration_seconds)}
            </div>
          )}
        </div>

        <style jsx>{`
          .video-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 3rem 2rem;
            text-align: center;
            border: 2px solid var(--border-color);
          }

          .video-card.locked {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(251, 191, 36, 0.1));
            border-color: rgba(251, 191, 36, 0.3);
          }

          .lock-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.8;
          }

          .lock-overlay h3 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
            color: #fbbf24;
          }

          .lock-message {
            margin: 0;
            font-size: 1.125rem;
            line-height: 1.6;
            color: var(--text-secondary);
          }

          .lock-message strong {
            color: var(--text-primary);
            font-weight: 600;
          }

          .video-hint {
            margin-top: 1.5rem;
            padding: 0.75rem 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.6);
            display: inline-block;
          }
        `}</style>
      </div>
    );
  }

  // Unlocked state
  return (
    <div className="video-card unlocked">
      <div className="unlock-header">
        <div className="unlock-badge">
          <span className="unlock-icon">🎉</span>
          <span>Unlocked!</span>
        </div>
        <p className="unlock-message">
          Your {benefactor?.relationship || 'benefactor'} left this for you
        </p>
      </div>

      <div className="video-player">
        <video
          src={video.storage_path}
          controls
          className="unlocked-video"
          poster={video.thumbnail_path}
        />
      </div>

      <div className="video-metadata">
        {video.duration_seconds && (
          <div className="metadata-item">
            <span className="metadata-label">Duration:</span>
            <span>{formatDuration(video.duration_seconds)}</span>
          </div>
        )}
        {video.unlocked_at && (
          <div className="metadata-item">
            <span className="metadata-label">Unlocked:</span>
            <span>{formatDate(video.unlocked_at)}</span>
          </div>
        )}
      </div>

      <div className="video-actions">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-download"
        >
          {isDownloading ? '⏳ Downloading...' : '⬇️ Download Video'}
        </button>
      </div>

      <style jsx>{`
        .video-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid var(--border-color);
        }

        .video-card.unlocked {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.1));
        }

        .unlock-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .unlock-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid rgba(34, 197, 94, 0.3);
          margin-bottom: 0.75rem;
        }

        .unlock-icon {
          font-size: 1.125rem;
        }

        .unlock-message {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .video-player {
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          margin-bottom: 1rem;
        }

        .unlocked-video {
          width: 100%;
          display: block;
          max-height: 500px;
        }

        .video-metadata {
          display: flex;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 8px;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .metadata-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .metadata-label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .video-actions {
          display: flex;
          justify-content: center;
        }

        .btn-download {
          padding: 0.75rem 1.5rem;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .btn-download:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .btn-download:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .video-metadata {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';;

interface VideoRecorderProps {
  legacyAccountId: string;
  milestoneId?: string;
  onRecordComplete: (videoData: {
    storage_path: string;
    thumbnail_path?: string;
    duration_seconds?: number;
    file_size_bytes: number;
    mime_type: string;
  }) => void;
  onCancel?: () => void;
}

export default function VideoRecorder({
  legacyAccountId,
  milestoneId,
  onRecordComplete,
  onCancel
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const MAX_DURATION = 5 * 60; // 5 minutes in seconds

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setError('Camera and microphone access is required. Please grant permission and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      chunksRef.current = [];
      
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus'
      };

      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stopCamera();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => {
        const next = prev + 1;
        if (next >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return next;
      });
    }, 1000);
  };

  const resetRecording = async () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
    await requestCameraPermission();
  };

  const generateThumbnail = async (videoBlob: Blob): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1;
      });

      video.addEventListener('seeked', () => {
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            resolve(blob);
            URL.revokeObjectURL(video.src);
          }, 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      });

      video.src = URL.createObjectURL(videoBlob);
    });
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `recorded_${timestamp}.webm`;
      const storagePath = `${legacyAccountId}/${milestoneId || 'general'}/${fileName}`;

      // Upload video file
      const { error: uploadError } = await supabase.storage
        .from('legacy-videos')
        .upload(storagePath, recordedBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Generate and upload thumbnail
      let thumbnailPath: string | undefined;
      const thumbnailBlob = await generateThumbnail(recordedBlob);
      
      if (thumbnailBlob) {
        const thumbFileName = `recorded_${timestamp}_thumb.jpg`;
        const thumbPath = `${legacyAccountId}/${milestoneId || 'general'}/${thumbFileName}`;
        
        const { error: thumbError } = await supabase.storage
          .from('legacy-videos')
          .upload(thumbPath, thumbnailBlob);

        if (!thumbError) {
          thumbnailPath = thumbPath;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('legacy-videos')
        .getPublicUrl(storagePath);

      onRecordComplete({
        storage_path: publicUrl,
        thumbnail_path: thumbnailPath,
        duration_seconds: duration,
        file_size_bytes: recordedBlob.size,
        mime_type: recordedBlob.type
      });

      // Cleanup
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to save recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission && !error) {
    return (
      <div className="recorder-loading">
        <div className="spinner"></div>
        <p>Requesting camera and microphone access...</p>
      </div>
    );
  }

  if (error && !hasPermission) {
    return (
      <div className="recorder-error">
        <div className="error-icon">🎥</div>
        <p>{error}</p>
        <button onClick={requestCameraPermission} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="video-recorder">
      {!recordedBlob ? (
        <>
          <div className="camera-preview">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="preview-video"
            />
            
            <div className="recording-overlay">
              {isRecording && (
                <>
                  <div className={`recording-indicator ${isPaused ? 'paused' : ''}`}>
                    <div className="record-dot"></div>
                    {isPaused ? 'PAUSED' : 'REC'}
                  </div>
                  <div className="timer">{formatTime(duration)} / {formatTime(MAX_DURATION)}</div>
                </>
              )}
            </div>
          </div>

          <div className="recording-controls">
            {!isRecording && (
              <button onClick={startRecording} className="btn-record">
                <span className="record-icon">⏺</span>
                Start Recording
              </button>
            )}

            {isRecording && !isPaused && (
              <>
                <button onClick={pauseRecording} className="btn-control">
                  <span>⏸</span> Pause
                </button>
                <button onClick={stopRecording} className="btn-stop">
                  <span>⏹</span> Stop
                </button>
              </>
            )}

            {isRecording && isPaused && (
              <>
                <button onClick={resumeRecording} className="btn-control">
                  <span>▶️</span> Resume
                </button>
                <button onClick={stopRecording} className="btn-stop">
                  <span>⏹</span> Stop
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="preview-container">
          <video
            ref={previewRef}
            src={recordedUrl || undefined}
            controls
            className="recorded-video"
          />

          <div className="recorded-info">
            <div className="duration-badge">
              Duration: {formatTime(duration)}
            </div>
            <div className="file-size">
              Size: {(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="preview-actions">
            <button 
              onClick={resetRecording} 
              className="btn-secondary"
              disabled={isUploading}
            >
              Re-record
            </button>
            <button 
              onClick={handleUpload} 
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Saving...' : 'Save Recording'}
            </button>
          </div>
        </div>
      )}

      {onCancel && (
        <button onClick={onCancel} className="btn-text cancel-btn">
          Cancel
        </button>
      )}

      <style jsx>{`
        .video-recorder {
          width: 100%;
        }

        .recorder-loading,
        .recorder-error {
          text-align: center;
          padding: 3rem 2rem;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .camera-preview {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .preview-video,
        .recorded-video {
          width: 100%;
          display: block;
          background: #000;
          max-height: 400px;
        }

        .recording-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.9);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
        }

        .recording-indicator.paused {
          background: rgba(251, 191, 36, 0.9);
        }

        .record-dot {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .timer {
          background: rgba(0, 0, 0, 0.7);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
          color: white;
          font-variant-numeric: tabular-nums;
        }

        .recording-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }

        .btn-record,
        .btn-control,
        .btn-stop {
          padding: 1rem 2rem;
          border-radius: 50px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-family: inherit;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-record {
          background: #ef4444;
          color: white;
          font-size: 1.125rem;
        }

        .btn-record:hover {
          background: #dc2626;
          transform: scale(1.05);
        }

        .record-icon {
          font-size: 1.5rem;
        }

        .btn-control {
          background: var(--primary-color);
          color: white;
        }

        .btn-control:hover {
          background: #4f46e5;
        }

        .btn-stop {
          background: #64748b;
          color: white;
        }

        .btn-stop:hover {
          background: #475569;
        }

        .preview-container {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .recorded-info {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .duration-badge,
        .file-size {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.875rem;
        }

        .preview-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }

        .btn-secondary,
        .btn-primary {
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

        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .btn-secondary:disabled,
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cancel-btn {
          display: block;
          margin: 1rem auto 0;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: inherit;
        }

        .cancel-btn:hover {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

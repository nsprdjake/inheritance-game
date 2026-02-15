'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';;

interface VideoUploaderProps {
  legacyAccountId: string;
  milestoneId?: string;
  onUploadComplete: (videoData: {
    storage_path: string;
    thumbnail_path?: string;
    duration_seconds?: number;
    file_size_bytes: number;
    mime_type: string;
  }) => void;
  onCancel?: () => void;
}

export default function VideoUploader({
  legacyAccountId,
  milestoneId,
  onUploadComplete,
  onCancel
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ACCEPTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Please upload a video file (MP4, MOV, or WebM)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 100MB';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFile(selectedFile);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const generateThumbnail = async (videoFile: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
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

      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `${legacyAccountId}/${milestoneId || 'general'}/${fileName}`;

      // Upload video file
      const { error: uploadError } = await supabase.storage
        .from('legacy-videos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          }
        });

      if (uploadError) throw uploadError;

      // Generate and upload thumbnail
      let thumbnailPath: string | undefined;
      const thumbnailBlob = await generateThumbnail(file);
      
      if (thumbnailBlob) {
        const thumbFileName = `${timestamp}_thumb.jpg`;
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

      onUploadComplete({
        storage_path: publicUrl,
        thumbnail_path: thumbnailPath,
        duration_seconds: videoDuration || undefined,
        file_size_bytes: file.size,
        mime_type: file.type
      });

      // Cleanup
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setVideoDuration(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="video-uploader">
      {!file && (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">🎬</div>
          <h3>Upload Video Message</h3>
          <p>Drag and drop or click to select</p>
          <p className="upload-hint">
            MP4, MOV, or WebM • Max 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {file && previewUrl && (
        <div className="video-preview">
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            onLoadedMetadata={handleVideoLoadedMetadata}
            className="preview-video"
          />
          
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-details">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
              {videoDuration && ` • ${Math.floor(videoDuration / 60)}:${Math.floor(videoDuration % 60).toString().padStart(2, '0')}`}
            </div>
          </div>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(uploadProgress)}%</div>
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="actions">
            <button 
              onClick={handleRemove} 
              className="btn-secondary"
              disabled={isUploading}
            >
              Remove
            </button>
            <button 
              onClick={handleUpload} 
              className="btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
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
        .video-uploader {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .upload-zone:hover {
          border-color: var(--primary-color);
          background: var(--primary-color-alpha);
        }

        .upload-zone.dragging {
          border-color: var(--primary-color);
          background: var(--primary-color-alpha);
          transform: scale(1.02);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-zone h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .upload-zone p {
          margin: 0.25rem 0;
          color: var(--text-secondary);
        }

        .upload-hint {
          font-size: 0.875rem;
          margin-top: 1rem !important;
        }

        .video-preview {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .preview-video {
          width: 100%;
          border-radius: 8px;
          background: #000;
          max-height: 400px;
        }

        .file-info {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .file-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .file-details {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .upload-progress {
          margin-top: 1rem;
        }

        .progress-bar {
          height: 8px;
          background: var(--bg-primary);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          margin-top: 0.5rem;
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

        .actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }

        .btn-secondary, .btn-primary {
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

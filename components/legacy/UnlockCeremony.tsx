'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from '@/components/ui/Confetti';

interface UnlockCeremonyProps {
  milestoneName: string;
  relationship?: string;
  videoUrl: string;
  onComplete?: () => void;
}

export default function UnlockCeremony({
  milestoneName,
  relationship = 'benefactor',
  videoUrl,
  onComplete
}: UnlockCeremonyProps) {
  const [stage, setStage] = useState<'unlock' | 'reveal' | 'playing'>('unlock');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Unlock animation sequence
    const timer1 = setTimeout(() => {
      setShowConfetti(true);
      setStage('reveal');
    }, 2000);

    const timer2 = setTimeout(() => {
      setStage('playing');
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="unlock-ceremony-overlay">
      <AnimatePresence mode="wait">
        {stage === 'unlock' && (
          <motion.div
            key="unlock"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6 }}
            className="ceremony-stage"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1] 
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="lock-icon"
            >
              🔓
            </motion.div>
            <h2>Unlocking Message...</h2>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="ceremony-stage"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15 
              }}
              className="gift-icon"
            >
              🎁
            </motion.div>
            <h2>Your {relationship} left this for you</h2>
            <p className="celebration-text">
              Congratulations on completing:<br />
              <strong>{milestoneName}</strong>
            </p>
          </motion.div>
        )}

        {stage === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="video-stage"
          >
            <div className="video-container">
              <video
                src={videoUrl}
                controls
                autoPlay
                onEnded={handleVideoEnd}
                className="ceremony-video"
              />
            </div>
            <p className="video-caption">
              A message from your {relationship}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && <Confetti />}

      <style jsx>{`
        .unlock-ceremony-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .ceremony-stage {
          text-align: center;
          color: white;
          max-width: 600px;
        }

        .lock-icon,
        .gift-icon {
          font-size: 6rem;
          margin-bottom: 2rem;
        }

        h2 {
          font-size: 2.5rem;
          margin: 0 0 1rem 0;
          font-weight: 700;
        }

        .celebration-text {
          font-size: 1.25rem;
          line-height: 1.6;
          opacity: 0.9;
        }

        .celebration-text strong {
          display: block;
          margin-top: 0.5rem;
          font-size: 1.5rem;
          color: var(--primary-color);
        }

        .video-stage {
          width: 100%;
          max-width: 900px;
        }

        .video-container {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .ceremony-video {
          width: 100%;
          display: block;
          background: #000;
        }

        .video-caption {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .lock-icon,
          .gift-icon {
            font-size: 4rem;
          }

          h2 {
            font-size: 1.75rem;
          }

          .celebration-text {
            font-size: 1rem;
          }

          .celebration-text strong {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

'use client'

import { useState } from 'react'
import { useImageGeneration } from '@/lib/hooks/useImageGeneration'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function ImageGeneratorDemo() {
  const { loading, error, result, generateAvatar, generateAchievementBadge } = useImageGeneration()
  const [kidName, setKidName] = useState('Maverick')

  return (
    <Card>
      <h2 className="text-2xl font-bold text-white mb-6">🎨 Image Generation Demo</h2>

      <div className="space-y-6">
        {/* Avatar Generator */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Generate Kid Avatar</h3>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={kidName}
              onChange={(e) => setKidName(e.target.value)}
              placeholder="Kid's name"
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              onClick={() => generateAvatar(kidName, 10, 'loves space and dinosaurs')}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Avatar'}
            </Button>
          </div>
        </div>

        {/* Achievement Badge Generator */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Generate Achievement Badge</h3>
          <Button
            onClick={() => generateAchievementBadge('High Roller', 'gold trophy, 500 points')}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Generating...' : 'Generate Badge'}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin text-6xl mb-4">🎨</div>
            <p className="text-white/60">Creating your image...</p>
            <p className="text-sm text-white/40 mt-2">This usually takes 10-15 seconds</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400">❌ {error}</p>
            {error.includes('API key') && (
              <p className="text-sm text-red-400/80 mt-2">
                Make sure OPENAI_API_KEY is configured in your environment
              </p>
            )}
          </div>
        )}

        {/* Success State */}
        {result?.url && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-400">✅ Image generated successfully!</p>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img
                src={result.url}
                alt="Generated image"
                className="w-full h-auto"
              />
            </div>

            {result.revised_prompt && (
              <details className="p-4 rounded-lg bg-white/5 border border-white/10">
                <summary className="text-white/80 cursor-pointer">
                  View AI-revised prompt
                </summary>
                <p className="text-sm text-white/60 mt-2">
                  {result.revised_prompt}
                </p>
              </details>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => window.open(result.url, '_blank')}
                variant="secondary"
              >
                Open in New Tab
              </Button>
              <Button
                onClick={() => navigator.clipboard.writeText(result.url || '')}
                variant="ghost"
              >
                Copy URL
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

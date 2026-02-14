import { useState } from 'react'

interface GenerateImageParams {
  type: 'avatar' | 'achievement' | 'educational' | 'custom'
  [key: string]: any
}

interface ImageResult {
  url?: string
  error?: string
  revised_prompt?: string
}

export function useImageGeneration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImageResult | null>(null)

  const generate = async (params: GenerateImageParams): Promise<ImageResult | null> => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate image'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const generateAvatar = async (
    name: string,
    age?: number,
    preferences?: string
  ) => {
    return generate({
      type: 'avatar',
      name,
      age,
      preferences,
    })
  }

  const generateAchievementBadge = async (
    achievementName: string,
    theme?: string
  ) => {
    return generate({
      type: 'achievement',
      achievementName,
      theme,
    })
  }

  const generateEducationalImage = async (
    topic: string,
    ageLevel: 'young' | 'middle' | 'teen' | 'advanced' = 'middle'
  ) => {
    return generate({
      type: 'educational',
      topic,
      ageLevel,
    })
  }

  const generateCustomImage = async (
    prompt: string,
    options?: {
      style?: 'natural' | 'cartoon' | 'comic' | 'digital-art' | 'illustration' | 'realistic'
      size?: '1024x1024' | '1792x1024' | '1024x1792'
      quality?: 'standard' | 'hd'
    }
  ) => {
    return generate({
      type: 'custom',
      prompt,
      ...options,
    })
  }

  return {
    loading,
    error,
    result,
    generate,
    generateAvatar,
    generateAchievementBadge,
    generateEducationalImage,
    generateCustomImage,
  }
}

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export type ImageStyle = 
  | 'natural' 
  | 'cartoon' 
  | 'comic' 
  | 'digital-art' 
  | 'illustration'
  | 'realistic'

export interface ImageGenerationOptions {
  prompt: string
  style?: ImageStyle
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  n?: number
}

export interface ImageGenerationResult {
  url?: string
  b64_json?: string
  error?: string
  revised_prompt?: string
}

/**
 * Generate an image using OpenAI DALL-E 3
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  if (!openai) {
    return { error: 'OpenAI API key not configured' }
  }

  try {
    // Build style-specific prompt enhancement
    const stylePrompts = {
      natural: '',
      cartoon: 'cartoon style, colorful, playful, fun',
      comic: 'comic book style, bold lines, dynamic composition',
      'digital-art': 'digital art, modern, vibrant, detailed',
      illustration: 'illustration style, clean lines, professional',
      realistic: 'photorealistic, highly detailed, professional photography'
    }

    const styleEnhancement = stylePrompts[options.style || 'natural']
    const enhancedPrompt = styleEnhancement 
      ? `${options.prompt}. Style: ${styleEnhancement}`
      : options.prompt

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      response_format: 'url' // Can also be 'b64_json'
    })

    const image = response.data[0]
    
    return {
      url: image.url,
      revised_prompt: image.revised_prompt
    }
  } catch (error: any) {
    console.error('Image generation error:', error)
    return {
      error: error.message || 'Failed to generate image'
    }
  }
}

/**
 * Generate an avatar for a kid based on their name and preferences
 */
export async function generateKidAvatar(
  name: string,
  age?: number,
  preferences?: string
): Promise<ImageGenerationResult> {
  const ageContext = age ? `, ${age} years old` : ''
  const prefContext = preferences ? `, ${preferences}` : ''
  
  const prompt = `A friendly, warm, cartoon-style avatar for a child named ${name}${ageContext}${prefContext}. Colorful, approachable, suitable for a kids' financial learning app. Diverse, inclusive representation. No text or words in the image.`

  return generateImage({
    prompt,
    style: 'cartoon',
    size: '1024x1024',
    quality: 'standard'
  })
}

/**
 * Generate a celebratory achievement badge image
 */
export async function generateAchievementBadge(
  achievementName: string,
  theme?: string
): Promise<ImageGenerationResult> {
  const prompt = `A celebratory badge or medal design for the achievement "${achievementName}". ${theme ? theme + '. ' : ''}Vibrant, rewarding, exciting. Digital badge design suitable for a kids' app. No text except the achievement name if appropriate. Colorful, fun, motivating.`

  return generateImage({
    prompt,
    style: 'digital-art',
    size: '1024x1024',
    quality: 'hd'
  })
}

/**
 * Generate an educational illustration
 */
export async function generateEducationalIllustration(
  topic: string,
  ageLevel: 'young' | 'middle' | 'teen' | 'advanced'
): Promise<ImageGenerationResult> {
  const ageStyles = {
    young: 'simple, colorful, playful cartoon style for ages 4-8',
    middle: 'clear, engaging illustration style for ages 9-12',
    teen: 'modern, clean digital art style for ages 13-16',
    advanced: 'sophisticated, detailed infographic style for ages 17+'
  }

  const prompt = `An educational illustration explaining "${topic}". ${ageStyles[ageLevel]}. Clear, informative, engaging. Suitable for financial literacy education.`

  return generateImage({
    prompt,
    style: 'illustration',
    size: '1792x1024',
    quality: 'hd'
  })
}

/**
 * Test the image generation service
 */
export async function testImageGeneration(): Promise<boolean> {
  if (!openai) {
    console.error('❌ OpenAI API key not configured')
    return false
  }

  try {
    const result = await generateImage({
      prompt: 'A simple test image: a smiling cartoon sun',
      style: 'cartoon',
      size: '1024x1024'
    })

    if (result.url) {
      console.log('✅ Image generation test successful!')
      console.log('Test image URL:', result.url)
      return true
    } else {
      console.error('❌ Image generation test failed:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Image generation test error:', error)
    return false
  }
}

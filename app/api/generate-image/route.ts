import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage, generateKidAvatar, generateAchievementBadge, generateEducationalIllustration } from '@/lib/services/imageGeneration'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, ...params } = body

    let result

    switch (type) {
      case 'avatar':
        result = await generateKidAvatar(
          params.name,
          params.age,
          params.preferences
        )
        break

      case 'achievement':
        result = await generateAchievementBadge(
          params.achievementName,
          params.theme
        )
        break

      case 'educational':
        result = await generateEducationalIllustration(
          params.topic,
          params.ageLevel || 'middle'
        )
        break

      case 'custom':
        result = await generateImage({
          prompt: params.prompt,
          style: params.style,
          size: params.size,
          quality: params.quality
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid image type. Use: avatar, achievement, educational, or custom' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Image generation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

#!/usr/bin/env node

import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable required')
  console.error('\nGet your API key from: https://platform.openai.com/api-keys')
  console.error('\nThen run:')
  console.error('export OPENAI_API_KEY=sk-...')
  console.error('node scripts/test-image-generation.mjs')
  process.exit(1)
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

async function testImageGeneration() {
  console.log('🎨 Testing OpenAI DALL-E 3 Image Generation\n')
  
  try {
    console.log('1️⃣ Generating test image (simple cartoon sun)...')
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A simple, friendly cartoon sun with a smiling face. Bright yellow, cheerful, suitable for a kids app.',
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    })

    const imageUrl = response.data[0].url
    const revisedPrompt = response.data[0].revised_prompt

    console.log('✅ Image generated successfully!\n')
    console.log('📸 Image URL:', imageUrl)
    console.log('\n📝 Revised prompt:', revisedPrompt)
    console.log('\n🌐 Open this URL in your browser to view the image')
    
    // Test kid avatar generation
    console.log('\n2️⃣ Generating kid avatar (Maverick)...')
    
    const avatarResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A friendly, warm, cartoon-style avatar for a child named Maverick. Colorful, approachable, suitable for a kids financial learning app. Diverse, inclusive representation. No text or words in the image.',
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    })

    const avatarUrl = avatarResponse.data[0].url
    
    console.log('✅ Avatar generated!\n')
    console.log('📸 Avatar URL:', avatarUrl)
    
    // Test achievement badge
    console.log('\n3️⃣ Generating achievement badge (High Roller)...')
    
    const badgeResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A celebratory badge or medal design for the achievement "High Roller - 500 points earned". Vibrant, rewarding, exciting. Digital badge design suitable for a kids app. Colorful, fun, motivating. Gold and purple colors.',
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    })

    const badgeUrl = badgeResponse.data[0].url
    
    console.log('✅ Badge generated!\n')
    console.log('📸 Badge URL:', badgeUrl)
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 All tests passed!')
    console.log('='.repeat(60))
    console.log('\n✅ OpenAI DALL-E 3 integration is working perfectly')
    console.log('\n💡 Next steps:')
    console.log('   1. Add OPENAI_API_KEY to .env.local')
    console.log('   2. Deploy to Vercel with env var configured')
    console.log('   3. Use API route: POST /api/generate-image')
    console.log('\n📚 Example usage:')
    console.log('   POST /api/generate-image')
    console.log('   Body: {')
    console.log('     "type": "avatar",')
    console.log('     "name": "Maverick",')
    console.log('     "age": 10,')
    console.log('     "preferences": "loves dinosaurs and space"')
    console.log('   }')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    
    if (error.message.includes('quota')) {
      console.error('\n💡 You may have exceeded your API quota.')
      console.error('Check usage at: https://platform.openai.com/usage')
    } else if (error.message.includes('invalid')) {
      console.error('\n💡 Your API key may be invalid.')
      console.error('Get a new key at: https://platform.openai.com/api-keys')
    }
    
    process.exit(1)
  }
}

testImageGeneration()

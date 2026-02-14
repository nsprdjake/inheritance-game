# 🎨 Image Generation Setup

LYNE now has comprehensive AI image generation capabilities using OpenAI's DALL-E 3!

## Quick Start

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "LYNE Image Generation"
4. Copy the key (starts with `sk-proj-...`)

**Cost:** ~$0.04 per 1024x1024 standard image, ~$0.08 per HD image

### 2. Add to Environment

**Local development:**
```bash
# Add to .env.local
OPENAI_API_KEY=sk-proj-your-key-here
```

**Vercel production:**
```bash
# Using Vercel CLI
vercel env add OPENAI_API_KEY

# Or via dashboard:
# 1. Go to https://vercel.com/jake-eyermans-projects/inheritance-game/settings/environment-variables
# 2. Add OPENAI_API_KEY
# 3. Value: sk-proj-your-key-here
# 4. Environment: Production, Preview, Development
```

### 3. Test It Works

```bash
export OPENAI_API_KEY=sk-proj-your-key-here
node scripts/test-image-generation.mjs
```

You should see:
- ✅ Test image generated
- ✅ Avatar generated
- ✅ Achievement badge generated
- 🌐 URLs to view images

---

## Features

### 1. Kid Avatars
Generate custom avatars for each kid based on their name, age, and interests.

```typescript
// API route
POST /api/generate-image
{
  "type": "avatar",
  "name": "Maverick",
  "age": 10,
  "preferences": "loves dinosaurs and space"
}

// Returns
{
  "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "revised_prompt": "..."
}
```

### 2. Achievement Badges
Create unique visual badges for achievements.

```typescript
POST /api/generate-image
{
  "type": "achievement",
  "achievementName": "High Roller",
  "theme": "gold and purple, celebratory"
}
```

### 3. Educational Illustrations
Generate visual content for educational modules.

```typescript
POST /api/generate-image
{
  "type": "educational",
  "topic": "Understanding compound interest",
  "ageLevel": "middle" // young, middle, teen, advanced
}
```

### 4. Custom Images
Full control for any use case.

```typescript
POST /api/generate-image
{
  "type": "custom",
  "prompt": "Your detailed prompt here",
  "style": "cartoon", // natural, cartoon, comic, digital-art, illustration, realistic
  "size": "1024x1024", // 1024x1024, 1792x1024, 1024x1792
  "quality": "standard" // standard, hd
}
```

---

## Integration Examples

### Add Avatar Upload to Kid Profile

```typescript
// In kid profile page
const generateAvatar = async () => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'avatar',
      name: kid.name,
      age: kid.age,
      preferences: avatarPreferences
    })
  })
  
  const { url } = await response.json()
  
  // Download image
  const imageBlob = await fetch(url).then(r => r.blob())
  
  // Upload to Supabase Storage
  const fileName = `avatars/${kid.id}.png`
  await supabase.storage
    .from('kid-avatars')
    .upload(fileName, imageBlob)
  
  // Update kid record
  await supabase
    .from('kids')
    .update({ avatar: fileName })
    .eq('id', kid.id)
}
```

### Auto-Generate Achievement Badges

```typescript
// When creating new achievement types
const badge = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'achievement',
    achievementName: 'Century Club',
    theme: 'gold trophy, 100 points milestone'
  })
}).then(r => r.json())

// Store badge URL in achievement record
```

---

## Architecture

### Service Layer
`lib/services/imageGeneration.ts` - Core image generation functions

**Functions:**
- `generateImage(options)` - Generic image generation
- `generateKidAvatar(name, age, preferences)` - Kid avatars
- `generateAchievementBadge(name, theme)` - Achievement badges
- `generateEducationalIllustration(topic, ageLevel)` - Educational content
- `testImageGeneration()` - Service health check

### API Route
`app/api/generate-image/route.ts` - RESTful endpoint

**Authentication:** Required (Supabase session)
**Rate limiting:** None yet (consider adding for production)

### Type Definitions
```typescript
interface ImageGenerationOptions {
  prompt: string
  style?: 'natural' | 'cartoon' | 'comic' | 'digital-art' | 'illustration' | 'realistic'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  n?: number
}

interface ImageGenerationResult {
  url?: string
  b64_json?: string
  error?: string
  revised_prompt?: string
}
```

---

## Cost Management

### DALL-E 3 Pricing
- **1024×1024 standard:** $0.040 per image
- **1024×1024 HD:** $0.080 per image
- **1024×1792 / 1792×1024 standard:** $0.080 per image
- **1024×1792 / 1792×1024 HD:** $0.120 per image

### Optimization Tips
1. **Use standard quality** for avatars and badges
2. **Use HD quality** only for educational content or marketing
3. **Cache generated images** in Supabase Storage (don't regenerate)
4. **Batch generate** achievement badges during setup, not on-demand
5. **Consider image limits** - maybe 1 custom avatar per kid per month

### Monthly Budget Estimates
- **100 avatars/month:** ~$4
- **50 achievement badges:** ~$2 (one-time)
- **20 educational illustrations:** ~$2
- **Total:** ~$8/month for moderate usage

---

## Alternative: Gemini Imagen

If you prefer Google's Gemini (or want a fallback), here's how:

### Setup Gemini
```bash
npm install @google/generative-ai
```

Add to `.env.local`:
```
GEMINI_API_KEY=your-key-here
```

### Gemini Integration (Future)
Currently on hold due to experimental API instability. When Gemini Imagen reaches GA (general availability), we can add it as an alternative provider.

**Pros:**
- Free tier available
- Integrated with Gemini models

**Cons:**
- Image generation still experimental
- Less reliable than DALL-E 3
- Quality not quite as good

---

## Next Steps

1. ✅ Image generation service created
2. ✅ API route implemented
3. ✅ Test script ready
4. ⏳ **Get OpenAI API key** (you need to do this)
5. ⏳ **Add to .env.local** for local testing
6. ⏳ **Add to Vercel** for production
7. ⏳ **Test locally** with `node scripts/test-image-generation.mjs`
8. ⏳ **Integrate into UI** (avatar upload, achievement badges, etc.)

---

## Security Notes

- ✅ Authentication required (Supabase session)
- ✅ API key stored in environment variables (not committed)
- ⚠️ Consider adding rate limiting for production
- ⚠️ Consider adding content moderation (OpenAI has built-in safety)

---

## Support

**OpenAI Documentation:** https://platform.openai.com/docs/guides/images
**OpenAI Pricing:** https://openai.com/pricing
**OpenAI Usage Dashboard:** https://platform.openai.com/usage

Questions? Check the test script output or API error messages for debugging.

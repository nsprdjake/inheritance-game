/**
 * ChatGPT Image Generation via Browser Automation
 * 
 * Uses your existing ChatGPT Plus subscription instead of paying API fees.
 * Automates the web interface to generate images with DALL-E 3.
 */

import { chromium } from 'playwright'

interface ChatGPTImageOptions {
  prompt: string
  sessionCookies?: string // Optional: reuse session
}

export async function generateImageViaChatGPT(
  options: ChatGPTImageOptions
): Promise<{ url?: string; error?: string }> {
  let browser
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true, // Run in background
    })
    
    const context = await browser.newContext({
      // Use saved cookies if available (to stay logged in)
      ...(options.sessionCookies ? {
        storageState: JSON.parse(options.sessionCookies)
      } : {})
    })
    
    const page = await context.newPage()
    
    // Navigate to ChatGPT
    await page.goto('https://chat.openai.com/')
    
    // Check if logged in
    const isLoggedIn = await page.locator('[data-testid="profile-button"]').isVisible({ timeout: 5000 })
      .catch(() => false)
    
    if (!isLoggedIn) {
      return {
        error: 'Not logged in to ChatGPT. Please log in manually first and save session.'
      }
    }
    
    // Start new chat or use existing
    const newChatButton = page.locator('a[href="/"]').first()
    if (await newChatButton.isVisible()) {
      await newChatButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Type the image generation prompt
    const promptInput = page.locator('textarea[placeholder*="Message"]')
    await promptInput.fill(`Generate an image: ${options.prompt}`)
    await promptInput.press('Enter')
    
    // Wait for image to be generated (DALL-E 3 usually takes 10-30 seconds)
    const imageSelector = 'img[alt*="DALL"]'
    await page.waitForSelector(imageSelector, { timeout: 60000 })
    
    // Get the image URL
    const imageUrl = await page.locator(imageSelector).first().getAttribute('src')
    
    if (!imageUrl) {
      return { error: 'Image generated but URL not found' }
    }
    
    // Download the image
    const imageResponse = await page.request.get(imageUrl)
    const imageBuffer = await imageResponse.body()
    
    // Convert to base64 data URL
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`
    
    await browser.close()
    
    return { url: dataUrl }
    
  } catch (error: any) {
    if (browser) await browser.close()
    
    return {
      error: error.message || 'Failed to generate image via ChatGPT'
    }
  }
}

/**
 * Save ChatGPT session for reuse
 */
export async function saveChatGPTSession(): Promise<string> {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  await page.goto('https://chat.openai.com/')
  
  console.log('Please log in to ChatGPT in the browser window...')
  console.log('Waiting for login...')
  
  // Wait for profile button to appear (means logged in)
  await page.locator('[data-testid="profile-button"]').waitFor({ timeout: 300000 })
  
  console.log('Login detected! Saving session...')
  
  const state = await context.storageState()
  await browser.close()
  
  return JSON.stringify(state)
}

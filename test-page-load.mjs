import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('[CREATE]')) {
      console.log(`[BROWSER ${type.toUpperCase()}]`, text);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    console.log(error.stack);
  });
  
  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/auth/login');
  
  console.log('2. Logging in...');
  await page.fill('input[type="email"]', 'eyejake@me.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL(/dashboard|kid/, { timeout: 10000 });
  console.log('3. Logged in successfully');
  
  console.log('4. Navigating to /legacy/create...');
  await page.goto('http://localhost:3000/legacy/create');
  
  // Wait a bit for any errors
  await page.waitForTimeout(3000);
  
  // Check what's on the page
  const content = await page.content();
  if (content.includes('Application error')) {
    console.log('❌ Application error detected');
    const screenshot = await page.screenshot();
    console.log('Screenshot saved');
  } else if (content.includes('Error Loading Page')) {
    const errorText = await page.textContent('body');
    console.log('❌ Custom error:', errorText);
  } else if (content.includes('Quest Builder')) {
    console.log('✅ Quest Builder loaded successfully!');
  } else if (content.includes('Loading')) {
    console.log('⏳ Still loading...');
  } else {
    console.log('📄 Page content preview:', content.substring(0, 500));
  }
  
  await browser.close();
})();

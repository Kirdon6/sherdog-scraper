const puppeteer = require('puppeteer');

async function simplePuppeteerTest() {
  console.log('🚀 Starting simple Puppeteer test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show the browser so you can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    console.log('📍 Testing Sherdog homepage...');
    await page.goto('https://www.sherdog.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    const title = await page.title();
    console.log(`✅ Homepage title: ${title}`);
    
    // Check if we got the real page or Cloudflare challenge
    const content = await page.content();
    if (content.includes('Just a moment')) {
      console.log('❌ Cloudflare is blocking the page');
    } else {
      console.log('✅ Got real content (not Cloudflare challenge)');
    }
    
    console.log('\n📍 Testing fighter page...');
    await page.goto('https://www.sherdog.com/fighter/Jon-Jones-27944', {
      waitUntil: 'domcontentloaded', 
      timeout: 15000
    });
    
    const fighterTitle = await page.title();
    console.log(`✅ Fighter page title: ${fighterTitle}`);
    
    // Try to get fighter name
    const name = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : 'Not found';
    });
    
    console.log(`✅ Fighter name: ${name}`);
    
    if (name.toLowerCase().includes('jon') || name.toLowerCase().includes('jones')) {
      console.log('🎉 SUCCESS! Everything is working!');
    } else {
      console.log('⚠️ Page accessible but name extraction needs work');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    // Keep browser open for 5 seconds so you can see what happened
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

simplePuppeteerTest().catch(console.error); 
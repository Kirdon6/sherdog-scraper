const { SherdogScraper, FighterDiscovery } = require('../dist/index');

async function testPuppeteerIntegration() {
  console.log('🧪 Testing Puppeteer Integration\n');

  const scraper = new SherdogScraper({
    rateLimit: 3000,
    cache: true,
    retries: 3,
    verbose: true
  });

  try {
    console.log('1. Testing direct fighter access by URL...');
    const jonJones = await scraper.getFighterByUrl('https://www.sherdog.com/fighter/Jon-Jones-27944');
    console.log(`✅ Found: ${jonJones.basicInfo.name}`);
    console.log(jonJones);

  //   console.log('2. Testing fighter search...');
  //   const searchResults = await scraper.searchFighters('Silva');
  //   console.log(`✅ Found ${searchResults.length} fighters with "Silva"`);
  //   searchResults.slice(0, 3).forEach((fighter, index) => {
  //     console.log(`   ${index + 1}. ${fighter.name} (${fighter.record}) - ${fighter.weightClass}`);
  //   });
  //   console.log();

  //   console.log('3. Testing fighter discovery by name...');
  //   const discovery = new FighterDiscovery(scraper);
  //   const khabib = await discovery.getFighterByName('Khabib Nurmagomedov');
  //   if (khabib) {
  //     console.log(`✅ Found: ${khabib.basicInfo.name}`);
  //     console.log(`   Record: ${khabib.record.wins}-${khabib.record.losses}-${khabib.record.draws}`);
  //     console.log(`   Undefeated: ${khabib.record.losses === 0 ? 'Yes' : 'No'}`);
  //   } else {
  //     console.log('❌ Khabib not found');
  //   }

  //   console.log('\n🎉 All tests passed! Puppeteer integration working correctly.');

  // } catch (error) {
  //   console.error('❌ Test failed:', error.message);
  //   if (error.stack) {
  //     console.error('Stack trace:', error.stack);
  //   }
  } finally {
    // Clean up browser resources
    await scraper.cleanup();
    console.log('🔴 Browser closed');
  }
}

testPuppeteerIntegration().catch(console.error);
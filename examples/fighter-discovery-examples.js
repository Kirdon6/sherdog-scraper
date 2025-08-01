const { SherdogScraper, FighterDiscovery } = require('../dist/index');

async function fighterDiscoveryExamples() {
  const scraper = new SherdogScraper({
    rateLimit: 2000, // 2 seconds between requests
    cache: true,
    retries: 3
  });

  const discovery = new FighterDiscovery(scraper);

  console.log('🔍 Fighter Discovery Examples\n');

  try {
    // Method 1: Search by name (easiest - no need to know IDs!)
    console.log('1. Finding fighters by name (no ID needed):');
    const khabib = await discovery.getFighterByName('Khabib Nurmagomedov');
    if (khabib) {
      console.log(`✅ Found: ${khabib.basicInfo.name} (ID: ${khabib.basicInfo.id})`);
      console.log(`   Record: ${khabib.record.wins}-${khabib.record.losses}-${khabib.record.draws}\n`);
    }

    // Method 2: Search and get IDs
    console.log('2. Searching for fighters and getting their IDs:');
    const silvaResults = await discovery.searchFightersWithIds('Silva', {
      limit: 5
    });
    
    silvaResults.forEach((fighter, index) => {
      console.log(`   ${index + 1}. ${fighter.name} - ID: ${fighter.id}`);
      if (fighter.fullProfile) {
        console.log(`      Record: ${fighter.fullProfile.record.wins}-${fighter.fullProfile.record.losses}-${fighter.fullProfile.record.draws}`);
      }
    });
    console.log();

    // Method 3: Extract ID from URL
    console.log('3. Extracting fighter ID from Sherdog URL:');
    const url = 'https://www.sherdog.com/fighter/Jon-Jones-27944';
    const extractedId = discovery.extractFighterIdFromUrl(url);
    console.log(`   URL: ${url}`);
    console.log(`   Extracted ID: ${extractedId}`);
    
    // Use the extracted ID
    const jonJones = await scraper.getFighter(extractedId);
    console.log(`   Fighter: ${jonJones.basicInfo.name}\n`);

    // Method 4: Get popular fighters
    console.log('4. Getting popular UFC fighters:');
    const popularFighters = await discovery.getPopularFighters();
    popularFighters.slice(0, 5).forEach((fighter, index) => {
      console.log(`   ${index + 1}. ${fighter.name} - ID: ${fighter.id}`);
    });
    console.log();

    // Method 5: Find specific fighter ID
    console.log('5. Finding specific fighter ID:');
    const conorId = await discovery.findFighterId('Conor McGregor');
    console.log(`   Conor McGregor ID: ${conorId}`);
    
    // Build URL from ID
    const conorUrl = discovery.buildFighterUrl(conorId);
    console.log(`   Conor McGregor URL: ${conorUrl}\n`);

    // Method 6: Cache demonstration
    console.log('6. Cache demonstration:');
    console.log(`   Cache stats before: ${discovery.getCacheStats().size} entries`);
    
    // This should use cache
    const cachedId = await discovery.findFighterId('Khabib Nurmagomedov');
    console.log(`   Cached Khabib ID: ${cachedId}`);
    console.log(`   Cache stats after: ${discovery.getCacheStats().size} entries\n`);

    // Method 7: Different ways to get the same fighter
    console.log('7. Different ways to get the same fighter:');
    
    // By name
    const fighter1 = await discovery.getFighterByName('Israel Adesanya');
    
    // By ID (if you know it)
    const fighter2 = await scraper.getFighter('Israel-Adesanya-169425');
    
    // By URL
    const fighter3 = await scraper.getFighterByUrl('https://www.sherdog.com/fighter/Israel-Adesanya-169425');
    
    console.log(`   By name: ${fighter1?.basicInfo.name}`);
    console.log(`   By ID: ${fighter2.basicInfo.name}`);
    console.log(`   By URL: ${fighter3.basicInfo.name}`);
    console.log(`   All same fighter: ${fighter1?.basicInfo.id === fighter2.basicInfo.id && fighter2.basicInfo.id === fighter3.basicInfo.id}\n`);

    // Method 8: Search with filters
    console.log('8. Searching with filters:');
    const lightweightFighters = await discovery.searchFightersWithIds('Charles', {
      weightClass: 'Lightweight',
      limit: 3
    });
    
    lightweightFighters.forEach((fighter, index) => {
      console.log(`   ${index + 1}. ${fighter.name} - ${fighter.weightClass}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the examples
fighterDiscoveryExamples().catch(console.error); 
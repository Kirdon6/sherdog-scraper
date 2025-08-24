const { SherdogScraper } = require('../dist/index');

async function searchAndExpandUntilFound() {
  const scraper = new SherdogScraper({
    rateLimit: 2000,
    verbose: true,
    databasePath: './data/fighters.json'
  });

  try {
    // Initialize scraper (loads starter database)
    await scraper.initialize();
    console.log('🥊 Scraper initialized!\n');

    // Target fighter to find (someone NOT in starter database)
    const targetFighter = 'Attila';
    console.log(`🎯 Target: Searching for "${targetFighter}"\n`);

    // Step 1: Check if already in database
    console.log('🔍 Step 1: Checking starter database...');
    let searchResults = scraper.searchFighters('Attila');
    if (searchResults.length > 0) {
      console.log('✅ Found in starter database!');
      searchResults.forEach((fighter, i) => {
        console.log(`  ${i + 1}. ${fighter.name} (ID: ${fighter.id})`);
      });
      return;
    }
    console.log('❌ Not found in starter database. Starting BFS discovery...\n');

    // Step 2: Progressive BFS discovery until found or timeout
    const maxDepth = 3; // Maximum depth to explore
    const maxFightersPerDepth = 8; // Limit fighters per depth to control size
    const timeout = 5 * 60 * 1000; // 5 minutes timeout
    const startTime = Date.now();

    for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth++) {
      console.log(`📊 Step 2: Exploring depth ${currentDepth}...`);
      
      try {
        // Expand database from all existing fighters at this depth
        const expandResult = await scraper.expandDatabase({ 
          depth: 1, // Only go 1 level deeper each time
          maxFightersPerDepth 
        });

        console.log(`✅ Depth ${currentDepth} complete:`);
        console.log(`   New fighters found: ${expandResult.newFighters.length}`);
        console.log(`   Total in database: ${scraper.getDatabaseStats().totalFighters}`);

        // Check if we found our target
        searchResults = scraper.searchFighters('Attila');
        if (searchResults.length > 0) {
          console.log(`🎉 SUCCESS! Found "${targetFighter}" at depth ${currentDepth}!`);
          searchResults.forEach((fighter, i) => {
            console.log(`  ${i + 1}. ${fighter.name} (ID: ${fighter.id})`);
          });
          
          // Get full fighter data
          console.log('\n📄 Getting full fighter data...');
          const fighter = await scraper.getFighter(searchResults[0].id);
          console.log(`✅ ${fighter.name}:`);
          console.log(`   Record: ${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`);
          console.log(`   Weight Class: ${fighter.weightClass}`);
          console.log(`   Nationality: ${fighter.nationality}`);
          break;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          console.log('⏰ Timeout reached! Stopping discovery.');
          break;
        }

        // Rate limiting between depth levels
        console.log('⏳ Waiting 3 seconds before next depth...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`❌ Error at depth ${currentDepth}:`, error.message);
        break;
      }
    }

    // Final search attempt
    if (searchResults.length === 0) {
      console.log(`\n😔 Could not find "${targetFighter}" within ${maxDepth} depth levels`);
      console.log('💡 Try increasing maxDepth or check if the fighter exists on Sherdog');
    }

    // Show final database stats
    const stats = scraper.getDatabaseStats();
    console.log(`\n📈 Final Database Stats: ${stats.totalFighters} total fighters`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Clean up
    await scraper.cleanup();
    console.log('🔒 Scraper closed');
  }
}

// Run the progressive search
searchAndExpandUntilFound().catch(console.error);

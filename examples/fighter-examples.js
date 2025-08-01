const { SherdogScraper } = require('../dist/index');

async function fighterExamples() {
  const scraper = new SherdogScraper({
    rateLimit: 2000, // 2 seconds between requests
    cache: true,
    retries: 3
  });

  console.log('🥊 Sherdog Fighter Scraper Examples\n');

  try {
    // Example 1: Get fighter by full URL
    console.log('1. Getting Jon Jones by full URL...');
    const jonJones = await scraper.getFighterByUrl('https://www.sherdog.com/fighter/Jon-Jones-27944');
    console.log(`✅ Found: ${jonJones.basicInfo.name} (${jonJones.basicInfo.record})`);
    console.log(`   Record: ${jonJones.record.wins}-${jonJones.record.losses}-${jonJones.record.draws}`);
    console.log(`   Weight Class: ${jonJones.currentWeightClass}`);
    console.log(`   Active: ${jonJones.basicInfo.isActive ? 'Yes' : 'No'}\n`);

    // // Example 2: Get fighter by URL slug
    // console.log('2. Getting Conor McGregor by URL slug...');
    // const conor = await scraper.getFighter('Conor-McGregor-29688');
    // console.log(`✅ Found: ${conor.basicInfo.name} (${conor.basicInfo.nickname})`);
    // console.log(`   Record: ${conor.record.wins}-${conor.record.losses}-${conor.record.draws}`);
    // console.log(`   Win Rate: ${conor.record.winPercentage.toFixed(1)}%`);
    // console.log(`   Current Streak: ${conor.winStreak > 0 ? `${conor.winStreak} wins` : `${conor.lossStreak} losses`}\n`);

    // // Example 3: Find fighter by name
    // console.log('3. Finding Khabib Nurmagomedov by name...');
    // const khabib = await scraper.findFighterByName('Khabib Nurmagomedov');
    
    // if (khabib) {
    //   console.log(`✅ Found: ${khabib.basicInfo.name}`);
    //   console.log(`   Record: ${khabib.record.wins}-${khabib.record.losses}-${khabib.record.draws}`);
    //   console.log(`   Undefeated: ${khabib.record.losses === 0 ? 'Yes' : 'No'}`);
    //   console.log(`   Finish Rate: ${khabib.finishRate.toFixed(1)}%`);
    //   console.log(`   Recent Performance: ${khabib.recentPerformance}\n`);
    // } else {
    //   console.log('❌ Fighter not found\n');
    // }

    // // Example 4: Search for fighters
    // console.log('4. Searching for fighters with "Silva"...');
    // const silvaResults = await scraper.searchFighters('Silva');
    
    // console.log(`✅ Found ${silvaResults.length} fighters:`);
    // silvaResults.slice(0, 5).forEach((fighter, index) => {
    //   console.log(`   ${index + 1}. ${fighter.name} (${fighter.record}) - ${fighter.weightClass}`);
    // });
    // console.log();

    // // Example 5: Get fighter statistics
    // console.log('5. Analyzing fighter statistics...');
    // const israel = await scraper.getFighter('Israel-Adesanya-169425');
    // console.log(`✅ ${israel.basicInfo.name} Analysis:`);
    // console.log(`   Total Fights: ${israel.record.totalFights}`);
    // console.log(`   Average Fights/Year: ${israel.averageFightsPerYear.toFixed(1)}`);
    // console.log(`   Last 5 Results: ${israel.lastFiveResults.map(f => f.result).join(', ')}`);
    // console.log(`   Career Weight Classes: ${israel.careerWeightClasses.join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the examples
fighterExamples().catch(console.error); 
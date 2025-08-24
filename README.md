# Sherdog Scraper

A simple, lightweight npm package for scraping fighter data from Sherdog.com with discovery and search capabilities.

## 🚀 Key Features

- **Fighter Discovery**: Start with known fighter IDs and automatically discover more fighters
- **Local Database**: Build a JSON database of fighter name-to-ID mappings
- **Search by Name**: Find fighters by name without knowing their IDs
- **Starter Database**: Includes 10+ popular fighters out of the box
- **Puppeteer-based**: Reliable scraping that handles modern websites
- **Simple API**: Clean, easy-to-use interface

## 📦 Installation

```bash
npm install sherdog-scraper
```

## 🎯 Quick Start

```javascript
const { SherdogScraper } = require('sherdog-scraper');

async function example() {
  const scraper = new SherdogScraper({
    rateLimit: 2000,  // 2 seconds between requests
    verbose: true
  });

  // Initialize (automatically loads starter database with popular fighters)
  await scraper.initialize();

  // You can immediately search popular fighters!
  let results = scraper.searchFighters('Jon Jones');
  console.log(results); // Works right away!

  // Or build a larger database using BFS (Breadth-First Search)
  await scraper.buildDatabase(['Jon-Jones-27944'], { depth: 2 });

  // Search for more fighters
  results = scraper.searchFighters('Silva');
  console.log(results); // Array of matching fighters

  // Get full fighter data
  const fighter = await scraper.getFighter('Jon-Jones-27944');
  console.log(fighter.name, fighter.record); // Jon Jones, {wins: 27, losses: 1, draws: 0}

  // Clean up
  await scraper.cleanup();
}
```

## 📚 API Reference

### Constructor

```javascript
const scraper = new SherdogScraper(config);
```

**Config options:**
- `rateLimit` (number): Milliseconds between requests (default: 2000)
- `timeout` (number): Request timeout in ms (default: 30000)
- `verbose` (boolean): Enable logging (default: false)
- `databasePath` (string): Path to JSON database file (default: './data/fighters.json')

### Methods

#### `initialize()`
Initialize the scraper and load existing database.

```javascript
await scraper.initialize();
```

#### `buildDatabase(startingIds, options)`
Build fighter database using BFS starting from known fighter IDs.

```javascript
const result = await scraper.buildDatabase(['Jon-Jones-27944'], { 
  depth: 2,                    // 2 degrees of separation
  maxFightersPerDepth: 10      // Optional: limit per depth level
});
console.log(result.newFighters);     // Array of newly discovered fighter IDs
console.log(result.fightersByDepth); // Fighters organized by depth level
console.log(result.depthReached);    // Actual depth reached
```

#### `searchFighters(query)`
Search for fighters by name (uses local database).

```javascript
const results = scraper.searchFighters('Jon Jones');
// Returns: [{ id: 'Jon-Jones-27944', name: 'Jon Jones', nickname: 'Bones', url: '...' }]
```

#### `getFighter(fighterId)`
Get complete fighter data by ID.

```javascript
const fighter = await scraper.getFighter('Jon-Jones-27944');
console.log(fighter);
// Returns: { id, name, nickname, record: {wins, losses, draws}, weightClass, ... }
```

#### `getFighterByUrl(url)`
Get fighter data by full Sherdog URL.

```javascript
const fighter = await scraper.getFighterByUrl('https://www.sherdog.com/fighter/Jon-Jones-27944');
```

#### `expandDatabase(options)`
Expand existing database by discovering more fighters using BFS.

```javascript
const result = await scraper.expandDatabase({ depth: 1 });
```

#### `getDatabaseStats()`
Get database statistics.

```javascript
const stats = scraper.getDatabaseStats();
console.log(stats.totalFighters); // Number of fighters in database
```

#### `cleanup()`
Close browser and clean up resources.

```javascript
await scraper.cleanup();
```

## 🗂️ Database Structure

The scraper creates a JSON file with fighter mappings:

```json
{
  "jon jones": {
    "id": "Jon-Jones-27944",
    "nickname": "Bones",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "anderson silva": {
    "id": "Anderson-Silva-1356",
    "nickname": "The Spider",
    "lastUpdated": "2024-01-15T10:31:00.000Z"
  }
}
```

## 🔄 Discovery Process

1. **Start**: Provide known fighter IDs (like "Jon-Jones-27944")
2. **Scrape**: Extract fighter data and find links to other fighters
3. **Discover**: Follow links to discover new fighters
4. **Store**: Save name-to-ID mappings in JSON database
5. **Search**: Use database for fast name-based searches

## 💡 Use Cases

### Building a Fighter Search API

```javascript
// Build database once using BFS
await scraper.buildDatabase(['Jon-Jones-27944', 'Anderson-Silva-1356'], { depth: 2 });

// Use in your application
app.get('/api/search/:name', (req, res) => {
  const results = scraper.searchFighters(req.params.name);
  res.json(results);
});
```

### Expanding Database Periodically

```javascript
// Expand database with new fighters using BFS
setInterval(async () => {
  await scraper.expandDatabase({ depth: 1 });
  console.log('Database expanded');
}, 24 * 60 * 60 * 1000); // Daily
```

## ⚠️ Important Notes

- **Rate Limiting**: Default 2-second delays between requests to respect Sherdog's servers
- **Database Persistence**: Fighter mappings are saved to JSON file for reuse
- **Browser Resources**: Always call `cleanup()` to close Puppeteer browser
- **Error Handling**: Wrap scraper calls in try-catch blocks

## 📄 License

MIT

## 🤝 Contributing

Issues and pull requests welcome!
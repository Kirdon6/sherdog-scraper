# Sherdog Scraper

A comprehensive JavaScript package for scraping fighter data, events, and other information from Sherdog.com. This package is designed to be used as a dependency in other applications.

## 🎯 Project Goals

- Scrape fighter profiles, statistics, and fight history
- Extract event information, fight cards, and results
- Provide clean, structured data output
- Handle rate limiting and respect website terms
- Support both Node.js and browser environments
- Comprehensive error handling and logging

## 📋 Development Roadmap

### Phase 1: Project Setup & Foundation
- [x] Initialize npm package with proper structure
- [x] Set up TypeScript configuration
- [x] Configure ESLint and Prettier
- [x] Set up Jest for testing
- [x] Create package.json with proper metadata
- [ ] Set up GitHub Actions for CI/CD
- [x] Configure proper .gitignore

### Phase 2: Core Infrastructure
- [x] Set up HTTP client (Axios/Fetch) with retry logic
- [x] Implement rate limiting and request queuing
- [x] Create base scraper class with common utilities
- [x] Set up HTML parsing with Cheerio/JSDOM
- [x] Implement caching mechanism
- [x] Create logging system
- [x] Set up configuration management

### Phase 3: Data Models & Types
- [x] Define TypeScript interfaces for all data structures
- [x] Create fighter profile data model
- [x] Define event and fight card structures
- [x] Set up fight result and statistics models
- [x] Create organization/weight class enums
- [x] Define API response types

### Phase 4: Core Scraping Features
- [x] **Fighter Profile Scraping**
  - [x] Basic fighter information (name, age, height, weight, etc.)
  - [x] Fight record and statistics
  - [x] Fight history with detailed results
  - [x] Current ranking and status

- [ ] **Event Scraping**
  - [ ] Event listings and schedules
  - [ ] Fight card details
  - [ ] Event results and statistics
  - [ ] Venue and location information
  - [ ] Broadcast information

- [ ] **Organization Scraping**
  - [ ] UFC, Bellator, ONE FC, etc.
  - [ ] Organization rankings
  - [ ] Weight class divisions
  - [ ] Championship information

### Phase 5: Advanced Features
- [ ] **Search Functionality**
  - [ ] Fighter search by name
  - [ ] Event search by date/organization
  - [ ] Advanced filtering options

- [ ] **Data Processing**
  - [ ] Data validation and sanitization
  - [ ] Statistics calculations
  - [ ] Data transformation utilities

- [ ] **Caching & Performance**
  - [ ] Redis/file-based caching
  - [ ] Request deduplication
  - [ ] Batch processing capabilities

### Phase 6: API & Export Features
- [ ] **Export Formats**
  - [ ] JSON export
  - [ ] CSV export
  - [ ] XML export
  - [ ] Database integration helpers

- [ ] **Streaming & Pagination**
  - [ ] Large dataset handling
  - [ ] Pagination support
  - [ ] Streaming responses

### Phase 7: Testing & Documentation
- [ ] **Unit Tests**
  - [ ] Test all scraper functions
  - [ ] Mock HTTP responses
  - [ ] Test error handling
  - [ ] Performance testing

- [ ] **Integration Tests**
  - [ ] End-to-end scraping tests
  - [ ] Rate limiting tests
  - [ ] Error recovery tests

- [ ] **Documentation**
  - [ ] API documentation
  - [ ] Usage examples
  - [ ] Best practices guide
  - [ ] Troubleshooting guide

### Phase 8: Package Publishing
- [ ] **NPM Package**
  - [ ] Optimize bundle size
  - [ ] Create UMD/ESM builds
  - [ ] Set up proper entry points
  - [ ] Configure package exports

- [ ] **Documentation Site**
  - [ ] GitHub Pages setup
  - [ ] Interactive examples
  - [ ] API reference

## 🏗️ Project Structure

```
sherdog-scraper/
├── src/
│   ├── core/
│   │   ├── scraper.ts
│   │   ├── http-client.ts
│   │   ├── rate-limiter.ts
│   │   └── cache.ts
│   ├── scrapers/
│   │   ├── fighter-scraper.ts
│   │   ├── event-scraper.ts
│   │   └── organization-scraper.ts
│   ├── models/
│   │   ├── fighter.ts
│   │   ├── event.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── parser.ts
│   │   ├── validator.ts
│   │   └── helpers.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
├── examples/
├── dist/
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## 🛠️ Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js (with browser support)
- **HTTP Client**: Axios
- **HTML Parsing**: Cheerio
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Build Tool**: Rollup/Webpack
- **Documentation**: JSDoc + GitHub Pages

## 📦 Package Features

### Core Features
- ✅ Fighter profile scraping
- ✅ Event and fight card data
- ✅ Organization information
- ✅ Fight history and statistics
- ✅ Search functionality
- ✅ Rate limiting and caching
- ✅ Error handling and retries

### Advanced Features
- 🔄 Real-time data updates
- 📊 Statistics and analytics
- 🔍 Advanced search filters
- 📱 Mobile-friendly parsing
- 🌐 Internationalization support
- 🔒 Privacy and security features

## 🚀 Usage Examples

### Fighter Scraping & Discovery

```javascript
import { SherdogScraper, FighterDiscovery } from 'sherdog-scraper';

const scraper = new SherdogScraper({
  rateLimit: 2000, // 2 seconds between requests
  cache: true,
  retries: 3
});

const discovery = new FighterDiscovery(scraper);

// Method 1: Find fighter by name (easiest - no ID needed!)
const khabib = await discovery.getFighterByName('Khabib Nurmagomedov');
console.log(`${khabib.basicInfo.name} - ID: ${khabib.basicInfo.id}`);

// Method 2: Get fighter by full URL
const jonJones = await scraper.getFighterByUrl('https://www.sherdog.com/fighter/Jon-Jones-27944');

// Method 3: Get fighter by URL slug
const conor = await scraper.getFighter('Conor-McGregor-29688');

// Method 4: Search and get IDs
const results = await discovery.searchFightersWithIds('Silva', {
  organization: 'UFC',
  limit: 5
});

// Method 5: Extract ID from URL
const url = 'https://www.sherdog.com/fighter/Jon-Jones-27944';
const fighterId = discovery.extractFighterIdFromUrl(url); // "Jon-Jones-27944"

// Method 6: Get popular fighters
const popularFighters = await discovery.getPopularFighters();

// Access fighter data
console.log(`${jonJones.basicInfo.name} - ${jonJones.record.wins}-${jonJones.record.losses}-${jonJones.record.draws}`);
console.log(`Current streak: ${jonJones.winStreak > 0 ? jonJones.winStreak + ' wins' : jonJones.lossStreak + ' losses'}`);
console.log(`Finish rate: ${jonJones.finishRate.toFixed(1)}%`);
```

### Event Scraping (Coming Soon)

```javascript
// Scrape event
const event = await scraper.getEvent('ufc-264');
```

## 📋 Next Steps

1. **Start with Phase 1**: Set up the basic project structure
2. **Implement core infrastructure**: HTTP client, rate limiting, parsing
3. **Build basic scrapers**: Start with fighter profiles
4. **Add comprehensive testing**: Ensure reliability
5. **Document everything**: Make it easy for others to use
6. **Publish to npm**: Make it available as a package

## 🤝 Contributing

This package will be open source and contributions are welcome. Please read the contributing guidelines before submitting pull requests.

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Legal Notice

This scraper respects Sherdog's robots.txt and implements proper rate limiting. Users are responsible for complying with Sherdog's terms of service and applicable laws when using this package.

---

**Ready to start?** Let's begin with Phase 1 and set up the project foundation! 
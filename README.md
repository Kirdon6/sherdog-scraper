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
- [ ] Initialize npm package with proper structure
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint and Prettier
- [ ] Set up Jest for testing
- [ ] Create package.json with proper metadata
- [ ] Set up GitHub Actions for CI/CD
- [ ] Configure proper .gitignore

### Phase 2: Core Infrastructure
- [ ] Set up HTTP client (Axios/Fetch) with retry logic
- [ ] Implement rate limiting and request queuing
- [ ] Create base scraper class with common utilities
- [ ] Set up HTML parsing with Cheerio/JSDOM
- [ ] Implement caching mechanism
- [ ] Create logging system
- [ ] Set up configuration management

### Phase 3: Data Models & Types
- [ ] Define TypeScript interfaces for all data structures
- [ ] Create fighter profile data model
- [ ] Define event and fight card structures
- [ ] Set up fight result and statistics models
- [ ] Create organization/weight class enums
- [ ] Define API response types

### Phase 4: Core Scraping Features
- [ ] **Fighter Profile Scraping**
  - [ ] Basic fighter information (name, age, height, weight, etc.)
  - [ ] Fight record and statistics
  - [ ] Fight history with detailed results
  - [ ] Fighter photos and media
  - [ ] Current ranking and status

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

```javascript
import { SherdogScraper } from 'sherdog-scraper';

const scraper = new SherdogScraper({
  rateLimit: 1000, // 1 request per second
  cache: true,
  retries: 3
});

// Scrape fighter profile
const fighter = await scraper.getFighter('conor-mcgregor');

// Scrape event
const event = await scraper.getEvent('ufc-264');

// Search fighters
const results = await scraper.searchFighters('McGregor');
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
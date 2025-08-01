# Sherdog Fighter Page Data Analysis

## Overview
This document analyzes the HTML structure of Sherdog fighter pages to identify all extractable data for our MMA scraper. The analysis is based on Jon Jones's fighter page (`/fighter/Jon-Jones-27944`) which provides a comprehensive example of the data structure.

## 🎯 Key Findings

### ✅ **Excellent Data Structure**
- **Well-organized HTML** with semantic markup
- **Consistent CSS classes** for data extraction
- **Rich structured data** with schema.org markup
- **Comprehensive fight history** with detailed information
- **Multiple data relationships** (fighters, events, referees, organizations)

### 📊 **Data Extraction Potential**
- **Primary Data**: Fighter profiles, records, statistics
- **Secondary Data**: Fight history, opponents, events, referees
- **Tertiary Data**: Organizations, weight classes, locations
- **Discovery Data**: Links to other fighters and events for crawling

---

## 📋 **Extractable Data Categories**

### 1. **Fighter Profile Information**

#### **Basic Information**
- **Name**: `Jon Jones` (from `<h1>` and schema.org markup)
- **Nickname**: `"Bones"` (from `.nickname` class)
- **Age**: `38` (calculated from birth date)
- **Birth Date**: `Jul 19, 1987` (from `itemprop="birthDate"`)
- **Height**: `6'4"` / `193.04 cm` (from `itemprop="height"`)
- **Weight**: `238 lbs` / `107.95 kg` (from `itemprop="weight"`)
- **Nationality**: `United States` (from `itemprop="nationality"`)
- **Birthplace**: `Rochester, New York` (from `itemprop="addressLocality"`)
- **Association**: `Jackson-Wink MMA` (from `.association` class)
- **Weight Class**: `Heavyweight` (from weight class link)

#### **Profile Images**
- **Main Image**: `/image_crop/200/300/_images/fighter/20220331052526_Jon_Jones_ff.JPG`
- **Mobile Image**: Same as main image
- **Flag**: `/img/flags/big/us.png` (country flag)

### 2. **Fight Record & Statistics**

#### **Overall Record**
- **Wins**: `28`
- **Losses**: `1`
- **No Contests**: `1`
- **Total Fights**: `30`

#### **Win Breakdown** (with percentages)
- **KO/TKO**: `11` (39%)
- **Submissions**: `7` (25%)
- **Decisions**: `10` (36%)
- **Others**: `0` (0%)

#### **Loss Breakdown**
- **KO/TKO**: `0` (0%)
- **Submissions**: `0` (0%)
- **Decisions**: `0` (0%)
- **Others**: `1` (100%) - Disqualification

### 3. **Fight History** (Complete Professional Record)

#### **Fight Data Structure**
Each fight contains:
- **Result**: `win`, `loss`, `no_contest` (from `.final_result` class)
- **Opponent**: Name and link to fighter page
- **Event**: Event name and link to event page
- **Date**: Fight date
- **Method**: How the fight ended (KO, Submission, Decision, etc.)
- **Referee**: Referee name and link to referee page
- **Round**: Which round the fight ended
- **Time**: Time in the round
- **Play-by-Play**: Link to detailed fight analysis

#### **Example Fight Entry**
```html
<tr>
    <td><span class="final_result win">win</span></td>
    <td><a href="/fighter/Stipe-Miocic-39537">Stipe Miocic</a></td>
    <td><a href="/events/UFC-309-Jones-vs-Miocic-103896">UFC 309 - Jones vs. Miocic</a><br><span class="sub_line">Nov / 16 / 2024</span></td>
    <td class="winby"><b>TKO (Spinning Back Kick and Punches)</b><br><span class="sub_line"><a href="/referee/Herb-Dean-5">Herb Dean</a></span></td>
    <td>3</td>
    <td>4:29</td>
</tr>
```

### 4. **Related Data Discovery**

#### **Fighter Links** (from fight history)
- **30+ fighter URLs** in fight history
- **Format**: `/fighter/Name-LastName-ID`
- **Examples**: 
  - `/fighter/Stipe-Miocic-39537`
  - `/fighter/Ciryl-Gane-293973`
  - `/fighter/Dominick-Reyes-145941`

#### **Event Links** (from fight history)
- **30+ event URLs** in fight history
- **Format**: `/events/Event-Name-ID`
- **Examples**:
  - `/events/UFC-309-Jones-vs-Miocic-103896`
  - `/events/UFC-285-Jones-vs-Gane-95232`
  - `/events/UFC-247-Jones-vs-Reyes-82427`

#### **Referee Links** (from fight history)
- **Multiple referee URLs** in fight history
- **Format**: `/referee/Name-LastName-ID`
- **Examples**:
  - `/referee/Herb-Dean-5`
  - `/referee/Marc-Goddard-45`
  - `/referee/Dan-Miragliotta-21`

#### **Organization Links**
- **Association**: `/stats/fightfinder?association=Jackson-Wink+MMA`
- **Weight Class**: `/stats/fightfinder?weightclass=Heavyweight`

### 5. **Additional Page Content**

#### **Related Fighters Section**
- **Trending fighters** with images and links
- **Format**: `/fighter/Name-LastName-ID`
- **Examples**: Marcus Almeida, Thad Jean, Reinier de Ridder

#### **Upcoming Events**
- **Future UFC events** with links
- **PFL events** with links
- **Event format**: `/events/Event-Name-ID`

---

## 🔧 **CSS Selectors for Data Extraction**

### **Primary Data Selectors**
```css
/* Fighter Name */
h1 .fn

/* Nickname */
.nickname

/* Basic Info Table */
.bio-holder table td

/* Record Stats */
.winsloses-holder .winloses

/* Fight History */
.new_table.fighter tr

/* Profile Image */
.profile-image.photo
```

### **Schema.org Markup**
```html
<!-- Structured data for easy extraction -->
<meta itemprop="name" content="Jon &quot;Bones&quot; Jones">
<meta itemprop="birthDate" content="Jul 19, 1987">
<meta itemprop="height" content="6'4&quot;">
<meta itemprop="weight" content="238 lbs">
<meta itemprop="nationality" content="United States">
```

---

## 📈 **Data Extraction Strategy**

### **Phase 1: Core Fighter Data**
1. **Basic Profile**: Name, nickname, age, height, weight, nationality
2. **Record**: Wins, losses, no contests, win/loss breakdowns
3. **Association**: Team, weight class
4. **Images**: Profile photo, country flag

### **Phase 2: Fight History**
1. **Complete fight record** with all details
2. **Opponent information** (names and IDs)
3. **Event information** (names and IDs)
4. **Referee information** (names and IDs)
5. **Fight details**: Method, round, time, date

### **Phase 3: Discovery & Relationships**
1. **Extract all fighter URLs** for further scraping
2. **Extract all event URLs** for event data
3. **Extract all referee URLs** for referee data
4. **Build relationship database** between entities

---

## 🎯 **Implementation Recommendations**

### **1. Use Puppeteer (Confirmed Working)**
- **Status**: ✅ Successfully bypasses Cloudflare
- **Method**: Browser automation with stealth plugin
- **Alternative**: Axios fails with 403 errors

### **2. Data Storage Strategy**
- **Primary**: CSV files for Firebase import
- **Secondary**: JSON for structured data
- **Relationships**: Separate tables for fighters, events, referees

### **3. Rate Limiting**
- **Current**: 3-second delays between requests
- **Recommendation**: 2-5 second delays to avoid detection
- **Session Management**: Maintain cookies between requests

### **4. Error Handling**
- **Cloudflare Detection**: Check for "Just a moment" text
- **Missing Data**: Handle cases where selectors don't exist
- **Network Issues**: Retry logic with exponential backoff

---

## 🚀 **Next Steps**

### **Immediate Actions**
1. **Update scraper** to use Puppeteer instead of Axios
2. **Implement data extraction** using identified selectors
3. **Create CSV export** functionality
4. **Test with multiple fighters** to validate consistency

### **Future Enhancements**
1. **Event scraping** using discovered event URLs
2. **Referee database** using discovered referee URLs
3. **Organization data** from association links
4. **Image downloads** for fighter photos

### **Data Quality**
1. **Validation**: Ensure all required fields are present
2. **Cleaning**: Normalize text data (remove extra spaces, etc.)
3. **Deduplication**: Handle duplicate fighter entries
4. **Relationships**: Maintain referential integrity

---

## 📊 **Data Volume Estimates**

### **Per Fighter Page**
- **Basic Data**: ~15 fields
- **Fight History**: 20-50 fights per fighter
- **Related Links**: 50-100 URLs (fighters, events, referees)
- **Images**: 2-3 images per fighter

### **Scalability**
- **Discovery Potential**: Each fighter page reveals 50+ new fighter URLs
- **Event Coverage**: Each fighter reveals 20+ event URLs
- **Referee Database**: Each fighter reveals 10+ referee URLs
- **Exponential Growth**: Each scraped page multiplies discovery potential

---

## ✅ **Conclusion**

Sherdog provides **excellent data structure** for MMA scraping with:
- **Rich, structured data** with consistent markup
- **Comprehensive fight histories** with detailed information
- **Multiple data relationships** enabling discovery
- **Well-organized HTML** making extraction straightforward

The **Puppeteer approach** successfully bypasses Cloudflare protection, making this a viable data source for building a comprehensive MMA database. 
# Design Document: Article Enhancement Automation

## Overview

The Article Enhancement Automation is a Node.js-based system that creates an intelligent content enhancement pipeline. It fetches articles from an existing Laravel API, researches similar content through Google search, scrapes reference materials, and uses AI to create enhanced versions with proper citations.

The core workflow involves:
1. Fetching the latest article from Laravel API
2. Searching Google for similar articles using web scraping
3. Extracting content from reference articles with fallback mechanisms
4. Enhancing content using Groq's LLM API
5. Publishing the enhanced article back to Laravel API

## Architecture

The system follows a modular pipeline architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Article Fetch  │───▶│  Google Search  │───▶│ Content Scraper │
│   (Laravel API) │    │   (Web Scraping)│    │ (Cheerio/Puppeteer)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Article Publish │◀───│  AI Enhancement │◀───│ Content Analysis│
│   (Laravel API) │    │   (Groq LLM)    │    │  & Preparation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Design Principles:

- **Modular Architecture**: Each component handles a specific responsibility
- **Error Resilience**: Comprehensive error handling with graceful degradation
- **Fallback Mechanisms**: Multiple strategies for content extraction
- **Configuration-Driven**: Environment-based configuration for flexibility
- **Logging & Monitoring**: Detailed logging for debugging and monitoring

## Components and Interfaces

### ArticleFetcher

**Responsibilities:**
- Retrieve the latest article from Laravel API
- Validate article data structure
- Handle API authentication and errors

**Key Methods:**
- `fetchLatestArticle()`: GET request to Laravel API for most recent article
- `validateArticleData(article)`: Ensure required fields are present
- `handleApiError(error)`: Process and log API errors

**Dependencies:**
- Axios for HTTP requests
- Environment configuration for API endpoints

### GoogleSearcher

**Responsibilities:**
- Perform Google searches without paid APIs
- Extract organic search results
- Filter out non-article content (YouTube, PDFs, social media)
- Select top 2 valid articles from different domains

**Key Methods:**
- `searchGoogle(query)`: Perform Google search with query
- `parseSearchResults(html)`: Extract URLs from search results HTML
- `filterValidArticles(urls)`: Remove non-article URLs
- `selectTopArticles(articles, count=2)`: Choose best articles from different domains

**Implementation Strategy:**
- Use `google-it` npm package as primary method
- Fallback to direct HTTP scraping with Cheerio if needed
- Implement user-agent rotation and request delays to avoid blocking

### ContentScraper

**Responsibilities:**
- Extract readable content from article URLs
- Handle both static and JavaScript-rendered sites
- Clean and normalize extracted text
- Extract metadata (title, domain) for citations

**Key Methods:**
- `scrapeArticle(url)`: Main scraping method with fallback logic
- `scrapeWithCheerio(url)`: Fast scraping for static sites
- `scrapeWithPuppeteer(url)`: Fallback for JS-rendered sites
- `cleanContent(html)`: Remove ads, navigation, and footer elements
- `extractMetadata(html, url)`: Get title and domain for citations

**Fallback Strategy:**
1. Try Cheerio first (fast, lightweight)
2. If blocked or JS-rendered, automatically switch to Puppeteer
3. Implement retry logic with different user agents
4. Handle various content management systems and site structures

### AIEnhancer

**Responsibilities:**
- Integrate with Groq API for content enhancement
- Craft effective prompts for content improvement
- Ensure originality while maintaining quality
- Format enhanced content with proper structure

**Key Methods:**
- `enhanceArticle(original, references)`: Main enhancement method
- `buildPrompt(original, references)`: Create effective LLM prompt
- `callGroqAPI(prompt)`: Make API call to Groq
- `formatEnhancedContent(response)`: Structure the AI response
- `addCitations(content, references)`: Append references section

**Groq Integration:**
- Model: `llama-3.1-70b-versatile`
- API Format: OpenAI-compatible chat completions
- Prompt Engineering: Structured prompts for consistent output
- Error Handling: Retry logic and fallback strategies

### ArticlePublisher

**Responsibilities:**
- Publish enhanced articles to Laravel API
- Add metadata indicating AI enhancement
- Validate content before publishing
- Handle API errors and provide feedback

**Key Methods:**
- `publishArticle(enhancedContent, metadata)`: POST to Laravel API
- `validateContent(content)`: Ensure quality standards
- `addEnhancementMetadata(article)`: Mark as AI-enhanced
- `handlePublishError(error)`: Process publishing errors

## Data Models

### Article Data Structure

```javascript
// Original Article (from Laravel API)
const originalArticle = {
  id: number,
  title: string,
  content: string,
  author: string,
  created_at: string,
  updated_at: string
};

// Reference Article (scraped)
const referenceArticle = {
  url: string,
  title: string,
  content: string,
  domain: string,
  scrapedAt: Date
};

// Enhanced Article (for publishing)
const enhancedArticle = {
  title: string,
  content: string, // Enhanced content with citations
  author: string,
  metadata: {
    original_article_id: number,
    ai_enhanced: true,
    enhancement_date: Date,
    references: Array<{title: string, domain: string}>,
    model_used: 'llama-3.1-70b-versatile'
  }
};
```

### Configuration Schema

```javascript
// Environment Configuration
const config = {
  // Laravel API
  LARAVEL_API_BASE_URL: string,
  LARAVEL_API_KEY: string, // if required
  
  // Groq API
  GROQ_API_KEY: string,
  GROQ_MODEL: 'llama-3.1-70b-versatile',
  
  // Scraping Configuration
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  USER_AGENTS: Array<string>,
  
  // Content Processing
  MAX_CONTENT_LENGTH: 50000,
  MIN_CONTENT_LENGTH: 500,
  
  // Logging
  LOG_LEVEL: 'info' | 'debug' | 'warn' | 'error'
};
```

## Error Handling

The system implements comprehensive error handling at multiple layers:

### Network Layer
- **Request Timeouts**: Configurable timeouts for all HTTP requests
- **Retry Logic**: Exponential backoff for failed requests
- **Rate Limiting**: Respect rate limits with appropriate delays
- **Connection Errors**: Handle network connectivity issues

### Content Processing Layer
- **Scraping Failures**: Graceful handling when sites block or fail
- **Content Validation**: Ensure scraped content meets quality standards
- **Parsing Errors**: Handle malformed HTML and unexpected structures
- **Fallback Mechanisms**: Multiple strategies for content extraction

### AI Integration Layer
- **API Failures**: Handle Groq API errors and rate limits
- **Content Quality**: Validate AI-generated content before publishing
- **Token Limits**: Manage content length to stay within API limits
- **Response Parsing**: Handle unexpected AI response formats

### Application Layer
- **Configuration Errors**: Validate environment variables at startup
- **Workflow Failures**: Handle partial failures in the pipeline
- **Data Validation**: Ensure data integrity throughout the process
- **Logging**: Comprehensive logging for debugging and monitoring

## Testing Strategy

The system employs a dual testing approach combining unit tests and property-based tests for comprehensive coverage:

### Unit Testing
Unit tests focus on specific examples, edge cases, and integration points:
- **Component Tests**: Test each module with known inputs and expected outputs
- **API Integration Tests**: Test Laravel API and Groq API interactions
- **Scraping Tests**: Test content extraction with sample HTML
- **Error Handling Tests**: Test error scenarios and recovery mechanisms
- **End-to-End Tests**: Test complete workflow with mock services

### Property-Based Testing
Property-based tests validate universal properties across all inputs using **fast-check** (JavaScript property-based testing library):
- **Minimum 100 iterations** per property test to ensure comprehensive input coverage
- Each property test references its corresponding design document property
- **Tag format**: `Feature: article-enhancement-automation, Property {number}: {property_text}`
- Tests generate random inputs within valid domains to discover edge cases
- Focus on invariants that must hold regardless of specific input values

### Test Configuration
- **Framework**: Jest for unit tests, fast-check for property-based tests
- **Mocking**: Mock external APIs for reliable testing
- **Coverage**: Minimum 85% code coverage requirement
- **CI/CD**: Automated test execution on all commits
- **Performance**: Tests configured with appropriate timeouts

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the requirements analysis, the following correctness properties must be validated through property-based testing:

### Property 1: Article Fetching Correctness
*For any* Laravel API response containing articles, the system should correctly identify and retrieve the most recently created article based on timestamp comparison.
**Validates: Requirements 1.1, 1.2**

### Property 2: Data Validation Completeness
*For any* API response or external data, the system should validate all required fields are present and properly formatted before processing.
**Validates: Requirements 1.4, 6.4, 7.3**

### Property 3: Error Handling Consistency
*For any* error condition across all components, the system should handle errors gracefully without crashing, log detailed error information with timestamps, and provide clear error messages.
**Validates: Requirements 1.3, 4.8, 5.5, 6.1, 6.3**

### Property 4: Google Search Result Processing
*For any* article title used as a search query, the system should extract organic search results, filter out non-article links (YouTube, PDFs, social media), and select valid articles from different domains.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Content Scraping Robustness
*For any* valid article URL, the system should extract readable content (paragraphs, headings), clean unwanted elements (ads, navigation), and extract metadata (title, domain) for citations.
**Validates: Requirements 3.1, 3.3, 3.4**

### Property 6: Scraping Fallback Mechanism
*For any* URL where Cheerio scraping fails or is blocked, the system should automatically fallback to Puppeteer and continue processing.
**Validates: Requirements 3.2, 3.5**

### Property 7: AI Enhancement Integration
*For any* original article and reference content combination, the system should successfully call the Groq API and receive enhanced content with proper structure.
**Validates: Requirements 4.1, 4.5**

### Property 8: Content Originality Verification
*For any* enhanced article, the system should ensure the content does not contain direct copying from reference sources and maintains originality.
**Validates: Requirements 4.4, 10.4**

### Property 9: Citation Formatting Consistency
*For any* set of reference articles, the enhanced content should include a properly formatted References section with consistent citation format containing title and domain information.
**Validates: Requirements 4.6, 10.2, 10.6**

### Property 10: Article Publishing Integrity
*For any* enhanced article, the publishing process should create a new article entry, preserve the original article unchanged, and include proper AI-enhancement metadata.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 11: Retry Logic Behavior
*For any* network request failure, the system should implement exponential backoff retry logic and respect rate limits with appropriate delays.
**Validates: Requirements 6.2, 6.5**

### Property 12: Configuration Management
*For any* system startup, all required environment variables should be validated, and missing or invalid configuration should produce helpful error messages.
**Validates: Requirements 7.1, 7.6**

### Property 13: Workflow Execution Completeness
*For any* system execution, the complete workflow (fetch → search → scrape → enhance → publish) should run automatically with clear progress updates and success/failure reporting.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 14: Logging and Monitoring
*For any* system operation, appropriate log entries should be created with correct log levels (info, warn, error, debug) and detailed information for debugging.
**Validates: Requirements 6.6, 8.4**

### Property 15: Content Quality Validation
*For any* enhanced content before publishing, the system should validate that it meets quality standards and contains required structural elements.
**Validates: Requirements 5.6**

### Testing Balance
- **Unit tests** handle specific examples and integration scenarios
- **Property tests** verify universal correctness across input space
- Both approaches are complementary and necessary for robust validation
- Property tests catch edge cases that unit tests might miss
- Unit tests provide concrete examples of expected behavior
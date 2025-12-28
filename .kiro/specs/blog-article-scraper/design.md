# Design Document: Blog Article Scraper

## Overview

The Blog Article Scraper is a Laravel-based system that extracts article data from HTML content, stores it in a PostgreSQL database, and provides RESTful CRUD API endpoints. The system follows the MVC+Service architecture pattern to ensure clean separation of concerns and maintainability.

The core workflow involves:
1. HTML content processing through a dedicated scraper service
2. Data validation and sanitization
3. Database persistence using Eloquent ORM
4. RESTful API exposure for CRUD operations

## Architecture

The system follows Laravel's MVC+Service architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │────│    Services     │────│     Models      │
│  (HTTP Layer)   │    │ (Business Logic)│    │ (Data Layer)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │    │  HTML Scraper   │    │   PostgreSQL    │
│   Validation    │    │  Data Processing│    │     Database    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components:

- **ArticleController**: Handles HTTP requests and responses for CRUD operations
- **ArticleService**: Contains business logic for article processing and database operations
- **ArticleScraperService**: Extracts structured data from HTML content
- **Article Model**: Eloquent model for database interactions
- **Database Migrations**: Version-controlled schema definitions

## Components and Interfaces

### ArticleController

**Responsibilities:**
- Handle HTTP requests for article CRUD operations
- Validate request data using Laravel Form Requests
- Return appropriate HTTP responses with proper status codes
- Handle error responses and exception formatting

**Key Methods:**
- `index()`: GET /api/articles - List all articles with pagination
- `store(CreateArticleRequest $request)`: POST /api/articles - Create new article
- `show($id)`: GET /api/articles/{id} - Get specific article
- `update(UpdateArticleRequest $request, $id)`: PUT /api/articles/{id} - Update article
- `destroy($id)`: DELETE /api/articles/{id} - Delete article

### ArticleService

**Responsibilities:**
- Coordinate between scraper service and database operations
- Handle business logic for article processing
- Manage duplicate detection and prevention
- Orchestrate data validation and sanitization

**Key Methods:**
- `createFromHtml(string $html)`: Process HTML and create article
- `createArticle(array $data)`: Create article from validated data
- `updateArticle($id, array $data)`: Update existing article
- `deleteArticle($id)`: Delete article by ID
- `findArticle($id)`: Retrieve article by ID
- `getAllArticles($perPage)`: Get paginated articles list

### ArticleScraperService

**Responsibilities:**
- Parse HTML content using DOMDocument or similar
- Extract article title, author, date, content, and category
- Handle malformed HTML gracefully
- Sanitize extracted content

**Key Methods:**
- `scrapeArticle(string $html)`: Extract all article data from HTML
- `extractTitle(DOMDocument $dom)`: Extract article title
- `extractAuthor(DOMDocument $dom)`: Extract author name
- `extractDate(DOMDocument $dom)`: Extract publication date
- `extractContent(DOMDocument $dom)`: Extract article body
- `extractCategory(DOMDocument $dom)`: Extract article category

### Article Model

**Responsibilities:**
- Define database table structure and relationships
- Implement Eloquent model features (timestamps, fillable fields)
- Define validation rules and mutators/accessors
- Handle database queries and relationships

**Attributes:**
- `id`: Primary key (auto-increment)
- `title`: Article title (string, required)
- `author`: Author name (string, required)
- `publication_date`: Publication date (datetime, nullable)
- `content`: Article body (text, required)
- `category`: Article category (string, nullable)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Data Models

### Articles Table Schema

```sql
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publication_date TIMESTAMP NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_articles_title (title),
    INDEX idx_articles_author (author),
    INDEX idx_articles_publication_date (publication_date),
    INDEX idx_articles_category (category),
    
    -- Unique constraint to prevent duplicates
    UNIQUE KEY unique_article (title, publication_date)
);
```

### API Response Format

**Success Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Article Title",
        "author": "Author Name",
        "publication_date": "2024-01-15T10:30:00Z",
        "content": "Article content...",
        "category": "Technology",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "title": ["The title field is required."],
        "author": ["The author field is required."]
    }
}
```

**Paginated Response:**
```json
{
    "success": true,
    "data": [...],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 100,
        "last_page": 7
    }
}
```
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the requirements analysis, the following correctness properties must be validated through property-based testing:

### Property 1: HTML Extraction Completeness
*For any* valid HTML content containing article data, the scraper should extract all available fields (title, author, publication_date, content, category) and return a structured article object with non-empty values for required fields.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: HTML Error Handling
*For any* malformed or incomplete HTML content, the scraper should handle errors gracefully without crashing and return appropriate error information.
**Validates: Requirements 1.6**

### Property 3: Database Storage Completeness
*For any* valid article data, when stored in the database, the resulting record should contain all required fields (id, title, author, content, created_at, updated_at) with proper data types and constraints.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Duplicate Prevention
*For any* two articles with identical title and publication_date, only the first article should be stored, and subsequent attempts should be rejected.
**Validates: Requirements 2.5**

### Property 5: API Response Format Consistency
*For any* successful API operation, the response should follow the standard JSON format with success flag, data payload, and appropriate HTTP status codes.
**Validates: Requirements 3.2, 4.4, 5.2**

### Property 6: Input Validation
*For any* API request with invalid or missing required fields, the system should return HTTP 422 status with detailed validation error messages in consistent format.
**Validates: Requirements 3.3, 3.4, 3.5, 5.4, 7.2**

### Property 7: CRUD Operation Correctness
*For any* valid article ID, CRUD operations should behave correctly: GET returns the article, PUT updates it, DELETE removes it, and subsequent operations reflect these changes.
**Validates: Requirements 4.2, 5.1, 6.1, 6.4**

### Property 8: HTTP Status Code Accuracy
*For any* API request to non-existent resources, the system should return HTTP 404 status with appropriate error messages.
**Validates: Requirements 4.3, 5.3, 6.3**

### Property 9: Timestamp Management
*For any* article creation or update operation, the system should automatically manage created_at and updated_at timestamps correctly.
**Validates: Requirements 2.3, 5.5**

### Property 10: Pagination Consistency
*For any* dataset size and page configuration, the pagination should return correct page counts, item counts, and navigation metadata.
**Validates: Requirements 4.1, 4.5**

### Property 11: Data Sanitization
*For any* input containing potentially malicious content (XSS vectors), the system should sanitize the data before storage and return safe content in responses.
**Validates: Requirements 7.1**

### Property 12: Rate Limiting
*For any* sequence of API requests exceeding configured limits, the system should enforce rate limiting and return appropriate HTTP 429 responses.
**Validates: Requirements 7.3**

### Property 13: Logging Completeness
*For any* API request, the system should create corresponding log entries with request details, response status, and timing information.
**Validates: Requirements 7.4**

### Property 14: Error Response Consistency
*For any* error condition across all endpoints, the system should return error responses in the same JSON format with consistent field names and structure.
**Validates: Requirements 7.5**

## Error Handling

The system implements comprehensive error handling at multiple layers:

### HTTP Layer (Controllers)
- **Validation Errors**: Return HTTP 422 with detailed field-level error messages
- **Not Found Errors**: Return HTTP 404 for non-existent resources
- **Server Errors**: Return HTTP 500 with generic error messages (detailed errors logged)
- **Rate Limiting**: Return HTTP 429 when request limits exceeded

### Service Layer
- **Business Logic Errors**: Throw custom exceptions with descriptive messages
- **Duplicate Detection**: Prevent duplicate articles and return appropriate responses
- **Data Processing Errors**: Handle scraping failures gracefully

### Data Layer (Models)
- **Database Constraints**: Handle unique constraint violations
- **Connection Errors**: Retry logic for temporary database issues
- **Query Errors**: Proper exception handling for malformed queries

### Scraper Service
- **HTML Parsing Errors**: Handle malformed HTML without crashing
- **Missing Data**: Graceful handling when required fields are not found
- **Encoding Issues**: Proper character encoding handling

## Testing Strategy

The system employs a dual testing approach combining unit tests and property-based tests for comprehensive coverage:

### Unit Testing
Unit tests focus on specific examples, edge cases, and integration points:
- **Controller Tests**: Test specific HTTP request/response scenarios
- **Service Tests**: Test business logic with known inputs and expected outputs
- **Model Tests**: Test database operations and relationships
- **Scraper Tests**: Test HTML parsing with specific HTML samples
- **Integration Tests**: Test complete workflows from HTTP request to database storage

### Property-Based Testing
Property-based tests validate universal properties across all inputs using **PHPUnit with Eris** (PHP property-based testing library):
- **Minimum 100 iterations** per property test to ensure comprehensive input coverage
- Each property test references its corresponding design document property
- **Tag format**: `Feature: blog-article-scraper, Property {number}: {property_text}`
- Tests generate random inputs within valid domains to discover edge cases
- Focus on invariants that must hold regardless of specific input values

### Test Configuration
- **Framework**: PHPUnit for unit tests, Eris for property-based tests
- **Database**: SQLite in-memory database for fast test execution
- **Coverage**: Minimum 90% code coverage requirement
- **CI/CD**: Automated test execution on all pull requests
- **Performance**: Property tests configured with timeout limits to prevent infinite loops

### Testing Balance
- **Unit tests** handle specific examples and integration scenarios
- **Property tests** verify universal correctness across input space
- Both approaches are complementary and necessary for robust validation
- Property tests catch edge cases that unit tests might miss
- Unit tests provide concrete examples of expected behavior
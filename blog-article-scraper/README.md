# Blog Article Scraper

A Laravel-based system that scrapes blog articles from HTML content, stores them in a PostgreSQL database, and provides CRUD API endpoints for managing the scraped articles.

## Features

- HTML article scraping with data extraction
- PostgreSQL database storage
- RESTful CRUD API endpoints
- MVC+Service architecture pattern
- Property-based testing with Eris
- Input validation and sanitization
- Rate limiting and security features

## Requirements

- PHP 8.2+
- PostgreSQL 12+
- Composer

## Installation

1. Clone the repository
2. Install dependencies: `composer install`
3. Configure database connection in `.env` file
4. Run migrations: `php artisan migrate`
5. Start the server: `php artisan serve`

## Database Configuration

Update your `.env` file with your PostgreSQL connection details:

```
DB_CONNECTION=pgsql
DB_HOST=your_host
DB_PORT=5432
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

For Neon PostgreSQL, use the connection string provided by Neon.

## API Endpoints

- `GET /api/articles` - List all articles (paginated)
- `GET /api/articles/{id}` - Get specific article
- `POST /api/articles` - Create new article
- `PUT /api/articles/{id}` - Update article
- `DELETE /api/articles/{id}` - Delete article

## Testing

Run tests with:
```bash
php artisan test
```

Property-based tests are included using the Eris library for comprehensive input coverage.
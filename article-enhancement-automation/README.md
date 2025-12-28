# Article Enhancement Automation

A Node.js automation system that fetches articles from a Laravel API, enhances them using AI and web research, and publishes improved versions back to the API.

## 🚀 Features

- **Article Fetching**: Retrieves the latest article from Laravel API
- **Google Search**: Finds similar articles using web scraping (no paid APIs)
- **Content Scraping**: Extracts content with Cheerio/Puppeteer fallback
- **AI Enhancement**: Improves content using Groq's LLM API
- **Smart Publishing**: Publishes enhanced articles back to Laravel API
- **Comprehensive Logging**: Detailed logging with multiple levels
- **Error Resilience**: Robust error handling and retry mechanisms

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Access to a Laravel API with article endpoints
- Groq API key for AI enhancement

## 🛠️ Installation

1. **Clone or create the project directory**
   ```bash
   mkdir article-enhancement-automation
   cd article-enhancement-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Laravel API Configuration
   LARAVEL_API_BASE_URL=http://localhost:8000/api
   LARAVEL_API_KEY=your_api_key_here
   
   # Groq API Configuration
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.1-70b-versatile
   
   # Optional: Adjust other settings as needed
   LOG_LEVEL=info
   EXECUTION_MODE=interactive
   ```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LARAVEL_API_BASE_URL` | Base URL for Laravel API | `http://localhost:8000/api` |
| `GROQ_API_KEY` | Groq API key for AI enhancement | `gsk_...` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LARAVEL_API_KEY` | - | API key for Laravel authentication |
| `GROQ_MODEL` | `llama-3.1-70b-versatile` | Groq model to use |
| `REQUEST_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `MAX_RETRIES` | `3` | Maximum retry attempts |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `EXECUTION_MODE` | `interactive` | Execution mode (interactive, non-interactive) |

## 🚀 Usage

### Basic Usage

```bash
# Run the automation
npm start

# Run in development mode with auto-restart
npm run dev
```

### Development Commands

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📊 Workflow

The automation follows this workflow:

1. **Fetch** → Retrieve latest article from Laravel API
2. **Search** → Find similar articles on Google
3. **Scrape** → Extract content from reference articles
4. **Enhance** → Improve content using Groq AI
5. **Publish** → Save enhanced article back to Laravel API

## 🏗️ Architecture

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

## 📁 Project Structure

```
article-enhancement-automation/
├── src/
│   ├── components/          # Main application components
│   │   ├── ArticleFetcher.js
│   │   ├── GoogleSearcher.js
│   │   ├── ContentScraper.js
│   │   ├── AIEnhancer.js
│   │   └── ArticlePublisher.js
│   ├── config/              # Configuration management
│   │   └── config.js
│   ├── utils/               # Utility modules
│   │   ├── logger.js
│   │   └── retry.js
│   └── index.js             # Main entry point
├── tests/                   # Test files
├── .env.example             # Environment variables template
├── package.json             # Project configuration
└── README.md               # This file
```

## 🧪 Testing

The project uses Jest for unit testing and fast-check for property-based testing:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ArticleFetcher.test.js

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The system provides comprehensive logging with multiple levels:

- **Debug**: Detailed information for debugging
- **Info**: General information about application flow
- **Warn**: Potentially harmful situations
- **Error**: Error events

Configure logging via environment variables:
```env
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json, simple
PROGRESS_UPDATES=true   # Show progress updates
```

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `LARAVEL_API_BASE_URL` is correct
   - Verify Laravel API is running and accessible
   - Check network connectivity

2. **Authentication Failed**
   - Verify `LARAVEL_API_KEY` is correct
   - Check API key permissions in Laravel

3. **Groq API Errors**
   - Verify `GROQ_API_KEY` is valid
   - Check Groq API rate limits
   - Ensure model name is correct

4. **Scraping Issues**
   - Some websites may block automated requests
   - The system automatically falls back to Puppeteer
   - Check network connectivity and firewall settings

### Debug Mode

Enable debug logging for detailed information:
```env
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- [Laravel API](../blog-article-scraper/) - The Laravel backend API
- [Groq API Documentation](https://console.groq.com/docs)

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs with debug level enabled
3. Check environment variable configuration
4. Verify API connectivity and permissions
# BeyondChats Article Management System

A comprehensive full-stack application for scraping, enhancing, and managing blog articles using AI automation. The system consists of three main components: a Laravel API backend, a Node.js automation service, and a React frontend.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BeyondChats Article System                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Auto   │    │  Laravel API    │
│   (Netlify)     │    │  Enhancement    │    │   (Render)      │
│                 │    │   Service       │    │                 │
│  - Article List │    │                 │    │ - CRUD API      │
│  - Article View │◄───┤ - Fetch Articles│◄───┤ - Data Storage  │
│  - Responsive   │    │ - AI Enhancement│────►│ - Validation    │
│  - Modern UI    │    │ - Web Scraping  │    │ - Security      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │  External APIs  │    │  PostgreSQL DB  │
│                 │    │                 │    │    (Neon)       │
│ - View Articles │    │ - Groq AI API   │    │                 │
│ - Compare Orig  │    │ - Google Search │    │ - Articles      │
│   vs Enhanced   │    │ - Web Scraping  │    │ - Metadata      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Data Flow Process                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Article Scraping & Storage
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ HTML Input  │───►│ Laravel API │───►│ PostgreSQL  │
   │ (BeyondChat)│    │ Processing  │    │  Database   │
   └─────────────┘    └─────────────┘    └─────────────┘

2. AI Enhancement Process
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Node.js     │───►│ Google      │───►│ Content     │───►│ Groq AI     │
   │ Fetcher     │    │ Search      │    │ Scraper     │    │ Enhancement │
   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
          │                                                         │
          ▼                                                         ▼
   ┌─────────────┐                                          ┌─────────────┐
   │ Laravel API │◄─────────────────────────────────────────│ Enhanced    │
   │ Update      │                                          │ Content     │
   └─────────────┘                                          └─────────────┘

3. Frontend Display
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ React App   │───►│ Laravel API │───►│ PostgreSQL  │
   │ (User View) │    │ Endpoints   │    │ Database    │
   └─────────────┘    └─────────────┘    └─────────────┘
```

## 📁 Project Structure

```
beyondchats-article-system/
├── blog-article-scraper/          # Laravel API Backend
│   ├── app/                       # Laravel application code
│   ├── database/                  # Migrations and seeders
│   ├── routes/                    # API routes
│   ├── config/                    # Configuration files
│   ├── Dockerfile                 # Docker configuration
│   └── README.md                  # Backend documentation
│
├── article-enhancement-automation/ # Node.js Enhancement Service
│   ├── src/                       # Source code
│   │   ├── components/            # Main service components
│   │   ├── utils/                 # Utility functions
│   │   └── config/                # Configuration management
│   ├── package.json               # Dependencies and scripts
│   └── README.md                  # Service documentation
│
├── react-article-frontend/        # React Frontend Application
│   ├── src/                       # React source code
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── hooks/                 # Custom hooks
│   │   ├── services/              # API services
│   │   └── styles/                # CSS modules
│   ├── public/                    # Static assets
│   ├── package.json               # Dependencies and scripts
│   └── README.md                  # Frontend documentation
│
├── docker-compose.yml             # Multi-service Docker setup
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🚀 Quick Start Guide

### Prerequisites

- **Docker & Docker Compose** (for containerized deployment)
- **Node.js 18+** (for local development)
- **PHP 8.2+** (for local Laravel development)
- **PostgreSQL** (Neon database recommended)

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd beyondchats-article-system
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Database credentials (Neon PostgreSQL)
# - Groq API key
# - Other service URLs
```

### 3. Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Local Development Setup

#### Backend (Laravel API)
```bash
cd blog-article-scraper
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

#### Enhancement Service (Node.js)
```bash
cd article-enhancement-automation
npm install
cp .env.example .env
npm start
```

#### Frontend (React)
```bash
cd react-article-frontend
npm install
cp .env.example .env
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (Neon PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=your-neon-host
DB_PORT=5432
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Laravel API Configuration
APP_NAME="BeyondChats Article System"
APP_ENV=production
APP_KEY=base64:your-app-key
APP_DEBUG=false
APP_URL=https://your-render-app.onrender.com

# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-70b-versatile

# Frontend Configuration
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
VITE_APP_NAME="BeyondChats Article System"

# Node.js Service Configuration
LARAVEL_API_BASE_URL=https://your-render-app.onrender.com/api
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
LOG_LEVEL=info
```

## 🐳 Docker Deployment

### Backend (Laravel) - Render Deployment

The Laravel API is containerized and ready for Render deployment:

```dockerfile
# Dockerfile is included in blog-article-scraper/
# Supports PHP 8.2, Composer, and production optimizations
```

### Frontend (React) - Netlify Deployment

The React frontend is optimized for Netlify deployment:

```bash
# Build command for Netlify
cd react-article-frontend && npm run build

# Publish directory
react-article-frontend/dist
```

## 📊 API Endpoints

### Laravel API (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles (paginated) |
| GET | `/api/articles/{id}` | Get specific article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |

### Request/Response Examples

```json
// GET /api/articles
{
  "data": [
    {
      "id": 1,
      "title": "Sample Article",
      "content": "Original content...",
      "enhanced_content": "AI enhanced content...",
      "url": "https://example.com/article",
      "type": "enhanced",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50
  }
}
```

## 🧪 Testing

### Backend Tests
```bash
cd blog-article-scraper
php artisan test
```

### Enhancement Service Tests
```bash
cd article-enhancement-automation
npm test
```

### Frontend Tests
```bash
cd react-article-frontend
npm run test:run
```

## 🚀 Deployment Instructions

### 1. Backend Deployment (Render)

1. **Prepare Docker Configuration**
   - Dockerfile is ready in `blog-article-scraper/`
   - Environment variables configured

2. **Deploy to Render**
   ```bash
   # Connect your GitHub repository to Render
   # Set build command: docker build -t app ./blog-article-scraper
   # Set start command: docker run -p $PORT:8000 app
   ```

3. **Environment Variables on Render**
   - Add all database and API configurations
   - Set `APP_ENV=production`

### 2. Frontend Deployment (Netlify)

1. **Build Configuration**
   ```bash
   # Build command
   cd react-article-frontend && npm run build
   
   # Publish directory
   react-article-frontend/dist
   ```

2. **Environment Variables on Netlify**
   ```env
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   ```

### 3. Enhancement Service Deployment

The Node.js service can run on:
- **Render** (as a background service)
- **Railway** 
- **Heroku**
- **VPS with Docker**

## 🔗 Live Links

> **Note**: Update these URLs after deployment

- **Frontend Application**: `https://your-netlify-app.netlify.app`
  - View articles, compare original vs enhanced content
  - Responsive design for all devices
  
- **Backend API**: `https://your-render-service.onrender.com/api`
  - RESTful API endpoints for article management
  - Swagger documentation available at `/api/documentation`
  
- **Enhancement Service**: Running as background worker on Render
  - Automatically processes and enhances articles
  - Monitors API for new content

### 🎯 Demo Features

1. **Article Browsing**: View paginated list of scraped articles
2. **Content Comparison**: Compare original vs AI-enhanced versions
3. **Responsive Design**: Works seamlessly on desktop and mobile
4. **Real-time Updates**: New articles automatically enhanced and displayed
5. **Performance Optimized**: Fast loading with caching and optimization

## 🛠️ Development Workflow

1. **Feature Development**
   - Create feature branch
   - Develop in respective service directory
   - Write tests for new functionality
   - Test integration between services

2. **Testing**
   - Unit tests for each service
   - Integration tests for API endpoints
   - End-to-end testing for user workflows

3. **Deployment**
   - Push to main branch
   - Automatic deployment via CI/CD
   - Monitor service health and logs

## 📈 Performance & Monitoring

- **Caching**: TanStack Query for frontend caching
- **Database**: Optimized PostgreSQL queries with indexing
- **API**: Rate limiting and request validation
- **Monitoring**: Application logs and error tracking

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Secure configuration management
- **SQL Injection Protection**: Laravel ORM and prepared statements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Neon PostgreSQL credentials
   - Check network connectivity
   - Ensure database exists and is accessible

2. **API Integration Issues**
   - Verify API URLs in environment variables
   - Check CORS configuration
   - Validate API key permissions

3. **Docker Issues**
   - Ensure Docker and Docker Compose are installed
   - Check port conflicts
   - Verify environment variable mounting

### Getting Help

- Check individual service README files for detailed documentation
- Review application logs for error details
- Ensure all environment variables are properly configured
- Verify service dependencies are running

## 📞 Contact

For questions and support, please refer to the individual service documentation or create an issue in the repository.

---

**Built with ❤️ for BeyondChats Article Management**
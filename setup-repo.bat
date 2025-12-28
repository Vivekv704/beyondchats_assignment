@echo off
REM BeyondChats Article System - Repository Setup Script (Windows)
REM This script helps set up the monolithic repository for deployment

echo 🚀 Setting up BeyondChats Article System Repository...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Initialize git repository if not already initialized
if not exist ".git" (
    echo ℹ Initializing Git repository...
    git init
    echo ✓ Git repository initialized
) else (
    echo ✓ Git repository already exists
)

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo ℹ Creating .gitignore file...
    (
        echo # Environment files
        echo .env
        echo .env.local
        echo .env.production
        echo.
        echo # Dependencies
        echo node_modules/
        echo vendor/
        echo.
        echo # Build outputs
        echo dist/
        echo build/
        echo public/build/
        echo.
        echo # Laravel specific
        echo blog-article-scraper/storage/logs/*
        echo blog-article-scraper/storage/framework/cache/*
        echo blog-article-scraper/storage/framework/sessions/*
        echo blog-article-scraper/storage/framework/views/*
        echo blog-article-scraper/bootstrap/cache/*
        echo !blog-article-scraper/storage/logs/.gitkeep
        echo !blog-article-scraper/storage/framework/cache/.gitkeep
        echo !blog-article-scraper/storage/framework/sessions/.gitkeep
        echo !blog-article-scraper/storage/framework/views/.gitkeep
        echo.
        echo # React specific
        echo react-article-frontend/dist/
        echo react-article-frontend/.vite/
        echo.
        echo # Node.js specific
        echo article-enhancement-automation/logs/*
        echo !article-enhancement-automation/logs/.gitkeep
        echo.
        echo # IDE files
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS files
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Docker
        echo docker-compose.override.yml
        echo.
        echo # Logs
        echo *.log
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
    ) > .gitignore
    echo ✓ .gitignore file created
) else (
    echo ✓ .gitignore file already exists
)

echo ℹ Setting up environment files...

REM Laravel environment
if not exist "blog-article-scraper\.env" (
    if exist "blog-article-scraper\.env.example" (
        copy "blog-article-scraper\.env.example" "blog-article-scraper\.env" >nul
        echo ✓ Laravel .env file created from example
    ) else (
        echo ⚠ Laravel .env.example not found
    )
) else (
    echo ✓ Laravel .env file already exists
)

REM Node.js environment
if not exist "article-enhancement-automation\.env" (
    if exist "article-enhancement-automation\.env.example" (
        copy "article-enhancement-automation\.env.example" "article-enhancement-automation\.env" >nul
        echo ✓ Node.js .env file created from example
    ) else (
        echo ⚠ Node.js .env.example not found
    )
) else (
    echo ✓ Node.js .env file already exists
)

REM React environment
if not exist "react-article-frontend\.env" (
    if exist "react-article-frontend\.env.example" (
        copy "react-article-frontend\.env.example" "react-article-frontend\.env" >nul
        echo ✓ React .env file created from example
    ) else (
        echo ⚠ React .env.example not found
    )
) else (
    echo ✓ React .env file already exists
)

REM Add all files to git
echo ℹ Adding files to Git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if errorlevel 1 (
    echo ℹ Creating initial commit...
    git commit -m "Initial commit: BeyondChats Article System

- Laravel API backend with Docker configuration
- Node.js article enhancement automation service  
- React frontend application
- Comprehensive documentation and deployment guides
- Docker Compose setup for local development
- Environment configuration templates"
    echo ✓ Initial commit created
) else (
    echo ⚠ No changes to commit
)

echo.
echo 📋 Next Steps:
echo.
echo 1. 🔧 Configure Environment Variables:
echo    - Edit .env files in each service directory
echo    - Set up Neon PostgreSQL database
echo    - Obtain Groq API key
echo.
echo 2. 🧪 Test Locally:
echo    - Run: docker-compose up -d
echo    - Test all services are working
echo.
echo 3. 📤 Push to Remote Repository:
echo    - Create repository on GitHub/GitLab
echo    - Add remote: git remote add origin ^<repository-url^>
echo    - Push code: git push -u origin main
echo.
echo 4. 🚀 Deploy Services:
echo    - Follow instructions in deploy.md
echo    - Deploy Laravel API to Render
echo    - Deploy React frontend to Netlify
echo    - Deploy Node.js service to Render
echo.
echo 5. 🔗 Update Live URLs:
echo    - Update README.md with live links
echo    - Configure CORS settings
echo    - Test end-to-end functionality
echo.
echo ✓ Repository setup complete!
echo 🎉 Your BeyondChats Article System is ready for deployment!

pause
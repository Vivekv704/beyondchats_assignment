#!/bin/bash

# BeyondChats Article System - Repository Setup Script
# This script helps set up the monolithic repository for deployment

echo "🚀 Setting up BeyondChats Article System Repository..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    print_info "Initializing Git repository..."
    git init
    print_status "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production

# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
public/build/

# Laravel specific
blog-article-scraper/storage/logs/*
blog-article-scraper/storage/framework/cache/*
blog-article-scraper/storage/framework/sessions/*
blog-article-scraper/storage/framework/views/*
blog-article-scraper/bootstrap/cache/*
!blog-article-scraper/storage/logs/.gitkeep
!blog-article-scraper/storage/framework/cache/.gitkeep
!blog-article-scraper/storage/framework/sessions/.gitkeep
!blog-article-scraper/storage/framework/views/.gitkeep

# React specific
react-article-frontend/dist/
react-article-frontend/.vite/

# Node.js specific
article-enhancement-automation/logs/*
!article-enhancement-automation/logs/.gitkeep

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/
EOF
    print_status ".gitignore file created"
else
    print_status ".gitignore file already exists"
fi

# Copy environment files
print_info "Setting up environment files..."

# Laravel environment
if [ ! -f "blog-article-scraper/.env" ]; then
    if [ -f "blog-article-scraper/.env.example" ]; then
        cp blog-article-scraper/.env.example blog-article-scraper/.env
        print_status "Laravel .env file created from example"
    else
        print_warning "Laravel .env.example not found"
    fi
else
    print_status "Laravel .env file already exists"
fi

# Node.js environment
if [ ! -f "article-enhancement-automation/.env" ]; then
    if [ -f "article-enhancement-automation/.env.example" ]; then
        cp article-enhancement-automation/.env.example article-enhancement-automation/.env
        print_status "Node.js .env file created from example"
    else
        print_warning "Node.js .env.example not found"
    fi
else
    print_status "Node.js .env file already exists"
fi

# React environment
if [ ! -f "react-article-frontend/.env" ]; then
    if [ -f "react-article-frontend/.env.example" ]; then
        cp react-article-frontend/.env.example react-article-frontend/.env
        print_status "React .env file created from example"
    else
        print_warning "React .env.example not found"
    fi
else
    print_status "React .env file already exists"
fi

# Add all files to git
print_info "Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit initial files
    print_info "Creating initial commit..."
    git commit -m "Initial commit: BeyondChats Article System

- Laravel API backend with Docker configuration
- Node.js article enhancement automation service
- React frontend application
- Comprehensive documentation and deployment guides
- Docker Compose setup for local development
- Environment configuration templates"
    print_status "Initial commit created"
fi

# Display next steps
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. 🔧 Configure Environment Variables:"
echo "   - Edit .env files in each service directory"
echo "   - Set up Neon PostgreSQL database"
echo "   - Obtain Groq API key"
echo ""
echo "2. 🧪 Test Locally:"
echo "   - Run: docker-compose up -d"
echo "   - Test all services are working"
echo ""
echo "3. 📤 Push to Remote Repository:"
echo "   - Create repository on GitHub/GitLab"
echo "   - Add remote: git remote add origin <repository-url>"
echo "   - Push code: git push -u origin main"
echo ""
echo "4. 🚀 Deploy Services:"
echo "   - Follow instructions in deploy.md"
echo "   - Deploy Laravel API to Render"
echo "   - Deploy React frontend to Netlify"
echo "   - Deploy Node.js service to Render"
echo ""
echo "5. 🔗 Update Live URLs:"
echo "   - Update README.md with live links"
echo "   - Configure CORS settings"
echo "   - Test end-to-end functionality"
echo ""

print_status "Repository setup complete!"
echo -e "${GREEN}🎉 Your BeyondChats Article System is ready for deployment!${NC}"
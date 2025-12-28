# React Article Frontend

A modern, responsive React application for displaying articles from the Laravel API backend. This application showcases both original articles scraped from BeyondChats and their AI-enhanced versions.

## Features

- 📱 **Responsive Design**: Mobile-first approach with adaptive layouts
- ⚡ **Modern React**: Built with React 18+ and functional components
- 🔄 **Smart Data Fetching**: TanStack Query for caching and background updates
- 🎨 **Professional UI**: Clean, accessible design with consistent styling
- 🧪 **Comprehensive Testing**: Unit tests and property-based testing
- 🚀 **Performance Optimized**: Lazy loading, code splitting, and caching

## Technology Stack

- **Frontend**: React 18+ with Vite
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: CSS Modules with CSS Grid/Flexbox
- **Testing**: Vitest + React Testing Library + @fast-check/jest
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Laravel API backend running on `http://localhost:8000`

### Installation

1. Clone the repository and navigate to the project:
   ```bash
   cd react-article-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API configuration if needed

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # UI mode
```

### Code Quality

Format code:
```bash
npm run format
```

Lint code:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared components (Layout, Header, etc.)
│   ├── articles/       # Article-specific components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── styles/             # Global styles and CSS modules
├── utils/              # Utility functions and constants
└── test/               # Test configuration
```

## API Integration

The application connects to the Laravel API backend with the following endpoints:

- `GET /api/articles` - Fetch articles list with pagination
- `GET /api/articles/{id}` - Fetch individual article details

## Environment Variables

- `VITE_API_BASE_URL` - Laravel API base URL (default: http://localhost:8000/api)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use meaningful commit messages

## License

This project is part of the BeyondChats article management system.
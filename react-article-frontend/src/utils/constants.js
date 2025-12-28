// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// Article Types
export const ARTICLE_TYPES = {
  ORIGINAL: 'original',
  ENHANCED: 'enhanced',
  ALL: 'all',
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
};

// Query Keys
export const QUERY_KEYS = {
  ARTICLES: 'articles',
  ARTICLE_DETAIL: 'article-detail',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// Cache Times (in milliseconds)
export const CACHE_TIME = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
};
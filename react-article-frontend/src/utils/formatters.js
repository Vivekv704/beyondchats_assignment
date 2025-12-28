/**
 * Utility functions for formatting data
 */

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return date.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 150, suffix = '...') => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Extract plain text from HTML content
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length for truncation
 * @returns {string} Plain text
 */
export const extractTextFromHtml = (html, maxLength = 200) => {
  if (!html) return '';

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content and clean up whitespace
  const text = tempDiv.textContent || tempDiv.innerText || '';
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  return maxLength ? truncateText(cleanText, maxLength) : cleanText;
};

/**
 * Format article type for display
 * @param {string} type - Article type ('original' or 'enhanced')
 * @returns {string} Formatted type
 */
export const formatArticleType = (type) => {
  switch (type?.toLowerCase()) {
    case 'original':
      return 'Original';
    case 'enhanced':
      return 'AI Enhanced';
    default:
      return 'Unknown';
  }
};

/**
 * Generate article excerpt from content
 * @param {string} content - Article content
 * @param {number} maxLength - Maximum excerpt length
 * @returns {string} Article excerpt
 */
export const generateExcerpt = (content, maxLength = 200) => {
  if (!content) return '';

  // Extract text from HTML if needed
  const plainText = extractTextFromHtml(content);
  
  // Truncate to sentence boundaries when possible
  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  return truncateText(plainText, maxLength);
};

/**
 * Format reading time estimate
 * @param {string} content - Article content
 * @param {number} wordsPerMinute - Average reading speed (default: 200)
 * @returns {string} Reading time estimate
 */
export const formatReadingTime = (content, wordsPerMinute = 200) => {
  if (!content) return '0 min read';

  const plainText = extractTextFromHtml(content);
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  return `${minutes} min read`;
};

/**
 * Format URL for display (remove protocol and www)
 * @param {string} url - URL to format
 * @returns {string} Formatted URL
 */
export const formatUrl = (url) => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
  } catch {
    return url;
  }
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
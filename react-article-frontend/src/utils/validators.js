/**
 * Utility functions for data validation
 */

/**
 * Basic HTML sanitization for safe rendering
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  // Allow basic formatting tags but remove potentially dangerous ones
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre', 'span', 'div'
  ];

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: links
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Remove data: URLs (except for images)
  sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, '');
  
  // Clean up any remaining dangerous attributes
  sanitized = sanitized.replace(/\s*(onerror|onload|onclick|onmouseover)\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
};

/**
 * Validate if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate if a string is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate if a value is not empty
 * @param {any} value - Value to validate
 * @returns {boolean} Whether the value is not empty
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Validate if a string has minimum length
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length required
 * @returns {boolean} Whether the text meets minimum length
 */
export const hasMinLength = (text, minLength = 1) => {
  if (!text || typeof text !== 'string') return false;
  return text.trim().length >= minLength;
};

/**
 * Validate if a string has maximum length
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum length allowed
 * @returns {boolean} Whether the text is within maximum length
 */
export const hasMaxLength = (text, maxLength = 1000) => {
  if (!text || typeof text !== 'string') return true;
  return text.length <= maxLength;
};

/**
 * Validate if a value is a valid article type
 * @param {string} type - Article type to validate
 * @returns {boolean} Whether the type is valid
 */
export const isValidArticleType = (type) => {
  const validTypes = ['original', 'enhanced', 'all'];
  return validTypes.includes(type?.toLowerCase());
};

/**
 * Validate if a value is a positive integer
 * @param {any} value - Value to validate
 * @returns {boolean} Whether the value is a positive integer
 */
export const isPositiveInteger = (value) => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && num === parseFloat(value);
};

/**
 * Validate if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether the date is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate article data structure
 * @param {Object} article - Article object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateArticle = (article) => {
  const errors = [];

  if (!article || typeof article !== 'object') {
    return { isValid: false, errors: ['Article must be an object'] };
  }

  // Required fields
  if (!isNotEmpty(article.id)) {
    errors.push('Article ID is required');
  }

  if (!hasMinLength(article.title, 1)) {
    errors.push('Article title is required');
  }

  if (!hasMinLength(article.content, 1)) {
    errors.push('Article content is required');
  }

  if (!isValidArticleType(article.type)) {
    errors.push('Article type must be "original" or "enhanced"');
  }

  // Optional fields validation
  if (article.source_url && !isValidUrl(article.source_url)) {
    errors.push('Source URL must be a valid URL');
  }

  if (article.published_at && !isValidDate(article.published_at)) {
    errors.push('Published date must be a valid date');
  }

  if (article.created_at && !isValidDate(article.created_at)) {
    errors.push('Created date must be a valid date');
  }

  if (article.updated_at && !isValidDate(article.updated_at)) {
    errors.push('Updated date must be a valid date');
  }

  // Enhanced article specific validation
  if (article.type === 'enhanced') {
    if (article.enhancement_date && !isValidDate(article.enhancement_date)) {
      errors.push('Enhancement date must be a valid date');
    }

    if (article.references && Array.isArray(article.references)) {
      article.references.forEach((ref, index) => {
        if (!hasMinLength(ref.title, 1)) {
          errors.push(`Reference ${index + 1} title is required`);
        }
        if (!isValidUrl(ref.url)) {
          errors.push(`Reference ${index + 1} URL must be valid`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate search query
 * @param {string} query - Search query to validate
 * @returns {Object} Validation result
 */
export const validateSearchQuery = (query) => {
  const errors = [];

  if (query && typeof query !== 'string') {
    errors.push('Search query must be a string');
  }

  if (query && query.length > 100) {
    errors.push('Search query must be less than 100 characters');
  }

  // Check for potentially harmful characters
  if (query && /[<>\"'&]/.test(query)) {
    errors.push('Search query contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: query ? query.trim().replace(/[<>\"'&]/g, '') : '',
  };
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validation result
 */
export const validatePaginationParams = (params = {}) => {
  const errors = [];
  const { page, pageSize } = params;

  if (page !== undefined && !isPositiveInteger(page)) {
    errors.push('Page must be a positive integer');
  }

  if (pageSize !== undefined && !isPositiveInteger(pageSize)) {
    errors.push('Page size must be a positive integer');
  }

  if (pageSize !== undefined && parseInt(pageSize, 10) > 100) {
    errors.push('Page size cannot exceed 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
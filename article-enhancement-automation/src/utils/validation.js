/**
 * Validation Utility Module
 * 
 * Provides validation functions for configuration, API responses, and data integrity
 * Used throughout the application to ensure data quality and prevent errors
 */

import { logger } from './logger.js';

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate API key format (basic check)
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if appears to be valid format
 */
export function isValidApiKey(apiKey) {
  return typeof apiKey === 'string' && 
         apiKey.length >= 10 && 
         /^[a-zA-Z0-9_-]+$/.test(apiKey);
}

/**
 * Validate article data structure
 * @param {Object} article - Article object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateArticleData(article) {
  const errors = [];
  
  if (!article || typeof article !== 'object') {
    return { isValid: false, errors: ['Article must be an object'] };
  }
  
  // Required fields
  const requiredFields = [
    { field: 'id', type: 'number' },
    { field: 'title', type: 'string', minLength: 1 },
    { field: 'content', type: 'string', minLength: 10 },
  ];
  
  for (const { field, type, minLength } of requiredFields) {
    if (!(field in article)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    
    const value = article[field];
    
    if (type === 'string' && typeof value !== 'string') {
      errors.push(`Field ${field} must be a string`);
      continue;
    }
    
    if (type === 'number' && typeof value !== 'number') {
      errors.push(`Field ${field} must be a number`);
      continue;
    }
    
    if (type === 'string' && minLength && value.trim().length < minLength) {
      errors.push(`Field ${field} must be at least ${minLength} characters long`);
    }
  }
  
  // Optional fields validation
  if (article.author && typeof article.author !== 'string') {
    errors.push('Field author must be a string');
  }
  
  if (article.created_at && !isValidDateString(article.created_at)) {
    errors.push('Field created_at must be a valid date string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date string format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date
 */
export function isValidDateString(dateString) {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate search results array
 * @param {Array} results - Search results to validate
 * @returns {Object} Validation result
 */
export function validateSearchResults(results) {
  const errors = [];
  
  if (!Array.isArray(results)) {
    return { isValid: false, errors: ['Search results must be an array'] };
  }
  
  const validResults = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    if (!result || typeof result !== 'object') {
      errors.push(`Result ${i} must be an object`);
      continue;
    }
    
    if (!result.url || !isValidUrl(result.url)) {
      errors.push(`Result ${i} must have a valid URL`);
      continue;
    }
    
    if (!result.title || typeof result.title !== 'string' || result.title.trim().length === 0) {
      errors.push(`Result ${i} must have a non-empty title`);
      continue;
    }
    
    validResults.push(result);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validResults,
  };
}

/**
 * Validate scraped content
 * @param {Object} content - Scraped content to validate
 * @returns {Object} Validation result
 */
export function validateScrapedContent(content) {
  const errors = [];
  
  if (!content || typeof content !== 'object') {
    return { isValid: false, errors: ['Content must be an object'] };
  }
  
  // Required fields for scraped content
  if (!content.title || typeof content.title !== 'string' || content.title.trim().length === 0) {
    errors.push('Content must have a non-empty title');
  }
  
  if (!content.content || typeof content.content !== 'string' || content.content.trim().length < 100) {
    errors.push('Content must have substantial text content (at least 100 characters)');
  }
  
  if (!content.url || !isValidUrl(content.url)) {
    errors.push('Content must have a valid source URL');
  }
  
  if (!content.domain || typeof content.domain !== 'string' || content.domain.trim().length === 0) {
    errors.push('Content must have a domain name');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate enhanced article before publishing
 * @param {Object} article - Enhanced article to validate
 * @returns {Object} Validation result
 */
export function validateEnhancedArticle(article) {
  const errors = [];
  
  if (!article || typeof article !== 'object') {
    return { isValid: false, errors: ['Article must be an object'] };
  }
  
  // Required fields
  if (!article.title || typeof article.title !== 'string' || article.title.trim().length === 0) {
    errors.push('Article must have a non-empty title');
  }
  
  if (!article.content || typeof article.content !== 'string' || article.content.trim().length < 500) {
    errors.push('Enhanced article must have substantial content (at least 500 characters)');
  }
  
  // Check for references section
  if (!article.content.includes('References') && !article.content.includes('## References')) {
    errors.push('Enhanced article must include a References section');
  }
  
  // Validate metadata if present
  if (article.metadata) {
    if (typeof article.metadata !== 'object') {
      errors.push('Metadata must be an object');
    } else {
      if (!article.metadata.ai_enhanced) {
        errors.push('Metadata must indicate AI enhancement');
      }
      
      if (!article.metadata.original_article_id || typeof article.metadata.original_article_id !== 'number') {
        errors.push('Metadata must include original article ID');
      }
      
      if (!Array.isArray(article.metadata.references)) {
        errors.push('Metadata must include references array');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input to prevent XSS and other issues
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize configuration object
 * @param {Object} config - Configuration object
 * @returns {Object} Validation result with sanitized config
 */
export function validateAndSanitizeConfig(config) {
  const errors = [];
  const sanitizedConfig = { ...config };
  
  // Validate URLs
  if (config.laravelApiBaseUrl && !isValidUrl(config.laravelApiBaseUrl)) {
    errors.push('Laravel API base URL is not valid');
  }
  
  if (config.groqApiBaseUrl && !isValidUrl(config.groqApiBaseUrl)) {
    errors.push('Groq API base URL is not valid');
  }
  
  // Validate API keys
  if (config.groqApiKey && !isValidApiKey(config.groqApiKey)) {
    errors.push('Groq API key format appears invalid');
  }
  
  // Validate numeric values
  const numericFields = ['requestTimeout', 'maxRetries', 'retryDelay', 'maxContentLength', 'minContentLength'];
  for (const field of numericFields) {
    if (config[field] !== undefined) {
      const value = Number(config[field]);
      if (isNaN(value) || value < 0) {
        errors.push(`${field} must be a positive number`);
      } else {
        sanitizedConfig[field] = value;
      }
    }
  }
  
  // Sanitize string fields
  const stringFields = ['userAgent', 'groqModel'];
  for (const field of stringFields) {
    if (config[field]) {
      sanitizedConfig[field] = sanitizeString(config[field]);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedConfig,
  };
}

/**
 * Log validation errors in a user-friendly format
 * @param {string} context - Context where validation failed
 * @param {Array} errors - Array of error messages
 */
export function logValidationErrors(context, errors) {
  if (errors.length === 0) return;
  
  logger.error(`❌ Validation failed for ${context}:`);
  errors.forEach((error, index) => {
    logger.error(`  ${index + 1}. ${error}`);
  });
}
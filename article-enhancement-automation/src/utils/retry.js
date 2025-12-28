/**
 * Retry Utility Module
 * 
 * Provides retry logic with exponential backoff for handling network failures
 * and other transient errors throughout the application
 */

import { logger } from './logger.js';
import { config } from '../config/config.js';

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, baseDelay = config.retryDelay, maxDelay = 30000) {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
  return Math.min(jitteredDelay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.baseDelay - Base delay between retries
 * @param {number} options.maxDelay - Maximum delay between retries
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @param {string} options.operationName - Name of operation for logging
 * @returns {Promise<any>} Result of the function
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = config.maxRetries,
    baseDelay = config.retryDelay,
    maxDelay = 30000,
    shouldRetry = () => true,
    operationName = 'operation',
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.debug(`🔄 Retry attempt ${attempt}/${maxRetries} for ${operationName}`);
      }
      
      const result = await fn();
      
      if (attempt > 0) {
        logger.info(`✅ ${operationName} succeeded after ${attempt} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        logger.debug(`❌ ${operationName} failed with non-retryable error:`, error.message);
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logger.error(`❌ ${operationName} failed after ${maxRetries} retries:`, error.message);
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
      logger.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error.message);
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Predefined retry conditions for common scenarios
 */
export const retryConditions = {
  /**
   * Retry on network errors and 5xx HTTP status codes
   */
  networkAndServerErrors: (error) => {
    // Network errors (no response)
    if (error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // HTTP 5xx server errors
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    // Rate limiting (429)
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    return false;
  },
  
  /**
   * Retry on all errors except 4xx client errors (except 429)
   */
  allExceptClientErrors: (error) => {
    // Don't retry on 4xx client errors (except 429 rate limiting)
    if (error.response && 
        error.response.status >= 400 && 
        error.response.status < 500 && 
        error.response.status !== 429) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Retry on specific error messages or codes
   */
  specificErrors: (errorCodes) => (error) => {
    return errorCodes.includes(error.code) || 
           errorCodes.some(code => error.message.includes(code));
  },
};

/**
 * Retry wrapper specifically for HTTP requests
 * @param {Function} requestFn - Function that makes HTTP request
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<any>} Response from HTTP request
 */
export async function retryHttpRequest(requestFn, operationName = 'HTTP request') {
  return withRetry(requestFn, {
    shouldRetry: retryConditions.networkAndServerErrors,
    operationName,
  });
}

/**
 * Retry wrapper for web scraping operations
 * @param {Function} scrapeFn - Function that performs scraping
 * @param {string} url - URL being scraped (for logging)
 * @returns {Promise<any>} Scraped content
 */
export async function retryScraping(scrapeFn, url) {
  return withRetry(scrapeFn, {
    shouldRetry: retryConditions.allExceptClientErrors,
    operationName: `scraping ${url}`,
    maxRetries: 2, // Fewer retries for scraping to avoid being blocked
  });
}
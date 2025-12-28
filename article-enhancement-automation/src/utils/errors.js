/**
 * Error Handling Utilities Module
 * 
 * Provides custom error classes, error classification, and error handling strategies
 * Used throughout the application for consistent error management
 */

import { logger } from './logger.js';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Configuration error - issues with environment variables or settings
 */
export class ConfigurationError extends AppError {
  constructor(message, field = null) {
    super(message, 'CONFIGURATION_ERROR', 500, true);
    this.field = field;
  }
}

/**
 * API error - issues with external API calls
 */
export class ApiError extends AppError {
  constructor(message, service, statusCode = 500, response = null) {
    super(message, 'API_ERROR', statusCode, true);
    this.service = service;
    this.response = response;
  }
}

/**
 * Network error - connectivity issues
 */
export class NetworkError extends AppError {
  constructor(message, url = null, code = null) {
    super(message, 'NETWORK_ERROR', 503, true);
    this.url = url;
    this.networkCode = code;
  }
}

/**
 * Validation error - data validation failures
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.field = field;
    this.value = value;
  }
}

/**
 * Scraping error - web scraping failures
 */
export class ScrapingError extends AppError {
  constructor(message, url, reason = null) {
    super(message, 'SCRAPING_ERROR', 422, true);
    this.url = url;
    this.reason = reason;
  }
}

/**
 * AI processing error - LLM API failures
 */
export class AIProcessingError extends AppError {
  constructor(message, model = null, prompt = null) {
    super(message, 'AI_PROCESSING_ERROR', 502, true);
    this.model = model;
    this.prompt = prompt;
  }
}

/**
 * Rate limit error - API rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message, service, retryAfter = null) {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
    this.service = service;
    this.retryAfter = retryAfter;
  }
}

/**
 * Timeout error - operation timeouts
 */
export class TimeoutError extends AppError {
  constructor(message, operation, timeout) {
    super(message, 'TIMEOUT_ERROR', 408, true);
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * Error classification utilities
 */
export const ErrorClassifier = {
  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    if (error instanceof NetworkError) return true;
    if (error instanceof TimeoutError) return true;
    if (error instanceof RateLimitError) return true;
    
    if (error instanceof ApiError) {
      // Retry on 5xx server errors and 429 rate limiting
      return error.statusCode >= 500 || error.statusCode === 429;
    }
    
    // Check for specific network error codes
    if (error.code) {
      const retryableCodes = [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ECONNABORTED',
      ];
      return retryableCodes.includes(error.code);
    }
    
    return false;
  },
  
  /**
   * Check if error is operational (expected) vs programming error
   */
  isOperational(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    
    // Common operational errors
    const operationalErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ];
    
    return operationalErrors.includes(error.code);
  },
  
  /**
   * Get error severity level
   */
  getSeverity(error) {
    if (error instanceof ConfigurationError) return 'critical';
    if (error instanceof ValidationError) return 'low';
    if (error instanceof NetworkError) return 'medium';
    if (error instanceof ApiError) {
      return error.statusCode >= 500 ? 'high' : 'medium';
    }
    if (error instanceof RateLimitError) return 'medium';
    if (error instanceof TimeoutError) return 'medium';
    if (error instanceof ScrapingError) return 'low';
    if (error instanceof AIProcessingError) return 'high';
    
    return 'unknown';
  },
  
  /**
   * Get user-friendly error message
   */
  getUserMessage(error) {
    if (error instanceof ConfigurationError) {
      return 'Configuration issue detected. Please check your environment variables.';
    }
    if (error instanceof NetworkError) {
      return 'Network connectivity issue. Please check your internet connection.';
    }
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        return 'Authentication failed. Please check your API credentials.';
      }
      if (error.statusCode === 429) {
        return 'Rate limit exceeded. Please try again later.';
      }
      return `Service temporarily unavailable (${error.service}). Please try again later.`;
    }
    if (error instanceof RateLimitError) {
      return `Rate limit exceeded for ${error.service}. Please try again later.`;
    }
    if (error instanceof ValidationError) {
      return `Invalid data: ${error.message}`;
    }
    if (error instanceof ScrapingError) {
      return 'Unable to extract content from the webpage. The site may be blocking automated access.';
    }
    if (error instanceof AIProcessingError) {
      return 'AI processing failed. Please try again or check your API configuration.';
    }
    if (error instanceof TimeoutError) {
      return `Operation timed out: ${error.operation}. Please try again.`;
    }
    
    return 'An unexpected error occurred. Please try again.';
  },
};

/**
 * Error handler for different contexts
 */
export class ErrorHandler {
  /**
   * Handle errors in async functions with logging
   */
  static async handleAsync(fn, context = 'operation') {
    try {
      return await fn();
    } catch (error) {
      ErrorHandler.logError(error, context);
      throw error;
    }
  }
  
  /**
   * Handle errors with retry logic
   */
  static async handleWithRetry(fn, options = {}) {
    const { maxRetries = 3, context = 'operation' } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = ErrorClassifier.isRetryable(error);
        
        if (isLastAttempt || !shouldRetry) {
          ErrorHandler.logError(error, context, { attempt, maxRetries });
          throw error;
        }
        
        logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${context}, retrying...`, {
          error: error.message,
          retryable: shouldRetry,
        });
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Log error with appropriate level and context
   */
  static logError(error, context = 'unknown', metadata = {}) {
    const severity = ErrorClassifier.getSeverity(error);
    const isOperational = ErrorClassifier.isOperational(error);
    
    const logData = {
      context,
      severity,
      isOperational,
      errorCode: error.code,
      errorName: error.name,
      ...metadata,
    };
    
    if (severity === 'critical' || !isOperational) {
      logger.error(`💥 Critical error in ${context}:`, error.message, logData);
      if (error.stack) {
        logger.error('Stack trace:', error.stack);
      }
    } else if (severity === 'high') {
      logger.error(`🚨 High severity error in ${context}:`, error.message, logData);
    } else if (severity === 'medium') {
      logger.warn(`⚠️ Medium severity error in ${context}:`, error.message, logData);
    } else {
      logger.info(`ℹ️ Low severity error in ${context}:`, error.message, logData);
    }
  }
  
  /**
   * Create error from HTTP response
   */
  static fromHttpResponse(response, service = 'API') {
    const { status, statusText, data } = response;
    let message = `${service} error: ${status} ${statusText}`;
    
    if (data && data.message) {
      message = data.message;
    } else if (data && typeof data === 'string') {
      message = data;
    }
    
    if (status === 429) {
      const retryAfter = response.headers?.['retry-after'];
      return new RateLimitError(message, service, retryAfter);
    }
    
    return new ApiError(message, service, status, data);
  }
  
  /**
   * Create error from network failure
   */
  static fromNetworkError(error, url = null) {
    const message = error.message || 'Network error occurred';
    return new NetworkError(message, url, error.code);
  }
  
  /**
   * Graceful shutdown on critical errors
   */
  static handleCriticalError(error, context = 'application') {
    logger.error(`💀 Critical error in ${context}, initiating graceful shutdown:`, error);
    
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Global error handlers for unhandled errors
 */
export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (error) => {
    logger.error('💀 Uncaught Exception:', error);
    ErrorHandler.handleCriticalError(error, 'uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💀 Unhandled Promise Rejection:', reason, { promise });
    ErrorHandler.handleCriticalError(reason, 'unhandledRejection');
  });
  
  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Wrap async function with error handling
   */
  wrapAsync: (fn, context) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        ErrorHandler.logError(error, context);
        throw error;
      }
    };
  },
  
  /**
   * Create timeout wrapper for promises
   */
  withTimeout: (promise, timeoutMs, operation = 'operation') => {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`${operation} timed out after ${timeoutMs}ms`, operation, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  },
  
  /**
   * Safe JSON parse with error handling
   */
  safeJsonParse: (jsonString, defaultValue = null) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      logger.warn('Failed to parse JSON:', error.message);
      return defaultValue;
    }
  },
  
  /**
   * Safe async operation with fallback
   */
  safeAsync: async (fn, fallback = null, context = 'operation') => {
    try {
      return await fn();
    } catch (error) {
      logger.warn(`Safe async operation failed in ${context}:`, error.message);
      return fallback;
    }
  },
};
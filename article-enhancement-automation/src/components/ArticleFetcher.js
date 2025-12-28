/**
 * Article Fetcher Component
 * 
 * Responsible for retrieving articles from the Laravel API
 * Handles API authentication, validation, and error handling
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { validateArticleData, logValidationErrors } from '../utils/validation.js';
import { ApiError, NetworkError, ValidationError, ErrorHandler, ErrorUtils } from '../utils/errors.js';
import { withRetry, retryConditions } from '../utils/retry.js';

export class ArticleFetcher {
  constructor() {
    this.logger = logger.child('ArticleFetcher');
    
    this.apiClient = axios.create({
      baseURL: config.laravelApiBaseUrl,
      timeout: config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': config.userAgent,
      },
    });

    // Add API key to headers if provided
    if (config.laravelApiKey) {
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${config.laravelApiKey}`;
    }

    // Add request/response interceptors for logging
    this.setupInterceptors();
  }

  /**
   * Set up axios interceptors for request/response logging
   */
  setupInterceptors() {
    this.apiClient.interceptors.request.use(
      (config) => {
        const correlationId = logger.setCorrelationId();
        config.metadata = { correlationId, startTime: Date.now() };
        
        this.logger.debug('📤 Laravel API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: this.sanitizeHeaders(config.headers),
          correlationId,
        });
        return config;
      },
      (error) => {
        this.logger.error('📤 Laravel API Request Error:', error.message);
        return Promise.reject(ErrorHandler.fromNetworkError(error));
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        const correlationId = response.config.metadata.correlationId;
        
        logger.httpRequest(
          response.config.method,
          response.config.url,
          response.status,
          duration
        );
        
        this.logger.debug('📥 Laravel API Response:', {
          status: response.status,
          statusText: response.statusText,
          dataSize: JSON.stringify(response.data).length,
          duration,
          correlationId,
        });
        
        logger.clearCorrelationId();
        return response;
      },
      (error) => {
        const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0;
        const correlationId = error.config?.metadata?.correlationId;
        
        if (error.response) {
          logger.httpRequest(
            error.config.method,
            error.config.url,
            error.response.status,
            duration
          );
        }
        
        this.logger.error('📥 Laravel API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          duration,
          correlationId,
        });
        
        logger.clearCorrelationId();
        return Promise.reject(ErrorHandler.fromHttpResponse(error.response || error, 'Laravel API'));
      }
    );
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }
    return sanitized;
  }

  /**
   * Fetch the latest article from Laravel API
   * @returns {Promise<Object|null>} The latest article object or null if none found
   */
  async fetchLatestArticle() {
    const operation = 'fetchLatestArticle';
    const timer = logger.startTimer(operation);
    
    try {
      logger.step('FETCH', 'Retrieving latest article from Laravel API');

      // Use retry logic for network resilience
      const response = await withRetry(
        () => this.apiClient.get('/articles', {
          params: {
            per_page: 1,
            sort: 'created_at',
            order: 'desc',
          },
        }),
        {
          shouldRetry: retryConditions.networkAndServerErrors,
          operationName: 'Laravel API fetch',
        }
      );

      // Handle different response formats
      let articles;
      if (response.data.data) {
        // Paginated response format
        articles = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        articles = response.data;
      } else {
        throw new ApiError('Unexpected API response format', 'Laravel API', 200, response.data);
      }

      // Check if any articles exist
      if (!articles || articles.length === 0) {
        this.logger.warn('📭 No articles found in Laravel API');
        return null;
      }

      const latestArticle = articles[0];
      this.logger.info(`Found latest article: "${latestArticle.title}" (ID: ${latestArticle.id})`);

      // Validate article data
      const validationResult = this.validateArticleData(latestArticle);
      if (!validationResult.isValid) {
        throw new ValidationError(
          `Article validation failed: ${validationResult.errors.join(', ')}`,
          'article',
          latestArticle
        );
      }

      logger.endTimer(timer);
      return latestArticle;
      
    } catch (error) {
      logger.endTimer(timer);
      
      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error;
      }
      
      // Handle unexpected errors
      const wrappedError = error.response 
        ? ErrorHandler.fromHttpResponse(error.response, 'Laravel API')
        : ErrorHandler.fromNetworkError(error, config.laravelApiBaseUrl);
        
      ErrorHandler.logError(wrappedError, operation);
      throw wrappedError;
    }
  }

  /**
   * Validate that article contains required fields
   * @param {Object} article - Article object to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateArticleData(article) {
    const validationResult = validateArticleData(article);
    
    if (!validationResult.isValid) {
      logValidationErrors('article data', validationResult.errors);
      return validationResult;
    }

    // Additional validation specific to fetched articles
    if (article.content.length < config.minContentLength) {
      this.logger.warn(`Article content is quite short (${article.content.length} characters)`);
    }

    if (article.content.length > config.maxContentLength) {
      this.logger.warn(`Article content is very long (${article.content.length} characters)`);
    }

    this.logger.debug('✅ Article validation passed');
    return validationResult;
  }

  /**
   * Fetch article by ID
   * @param {number} articleId - ID of the article to fetch
   * @returns {Promise<Object>} The article object
   */
  async fetchArticleById(articleId) {
    const operation = `fetchArticleById(${articleId})`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`Fetching article with ID: ${articleId}`);

      const response = await withRetry(
        () => this.apiClient.get(`/articles/${articleId}`),
        {
          shouldRetry: retryConditions.networkAndServerErrors,
          operationName: `Laravel API fetch article ${articleId}`,
        }
      );

      let article;
      if (response.data.data) {
        article = response.data.data;
      } else if (response.data.id) {
        article = response.data;
      } else {
        throw new ApiError('Unexpected API response format', 'Laravel API', 200, response.data);
      }

      // Validate article data
      const validationResult = this.validateArticleData(article);
      if (!validationResult.isValid) {
        throw new ValidationError(
          `Article validation failed: ${validationResult.errors.join(', ')}`,
          'article',
          article
        );
      }

      this.logger.info(`Successfully fetched article: "${article.title}"`);
      logger.endTimer(timer);
      return article;
      
    } catch (error) {
      logger.endTimer(timer);
      
      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error;
      }
      
      const wrappedError = error.response 
        ? ErrorHandler.fromHttpResponse(error.response, 'Laravel API')
        : ErrorHandler.fromNetworkError(error, `${config.laravelApiBaseUrl}/articles/${articleId}`);
        
      ErrorHandler.logError(wrappedError, operation);
      throw wrappedError;
    }
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnectivity() {
    try {
      this.logger.debug('Testing Laravel API connectivity...');
      
      const response = await ErrorUtils.withTimeout(
        this.apiClient.get('/articles', { params: { per_page: 1 } }),
        5000,
        'API connectivity test'
      );
      
      this.logger.debug('✅ Laravel API connectivity test passed');
      return true;
      
    } catch (error) {
      this.logger.warn('⚠️ Laravel API connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Alias for testConnectivity for consistency with other components
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    return this.testConnectivity();
  }
}
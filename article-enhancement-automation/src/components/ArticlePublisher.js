/**
 * Article Publisher Component
 * 
 * Responsible for publishing enhanced articles back to the Laravel API
 * Handles article creation, metadata management, and publishing validation
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { validateEnhancedArticle, logValidationErrors } from '../utils/validation.js';
import { ApiError, ValidationError, ErrorHandler, ErrorUtils } from '../utils/errors.js';
import { withRetry, retryHttpRequest } from '../utils/retry.js';

export class ArticlePublisher {
  constructor() {
    this.logger = logger.child('ArticlePublisher');
    
    // Laravel API client configuration
    this.apiClient = axios.create({
      baseURL: config.laravelApiBaseUrl,
      timeout: config.requestTimeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(config.laravelApiKey && { 'Authorization': `Bearer ${config.laravelApiKey}` }),
      },
    });
    
    // Publishing statistics
    this.stats = {
      published: 0,
      failed: 0,
      totalProcessed: 0,
    };
  }

  /**
   * Publish enhanced article to Laravel API
   * @param {Object} enhancedArticle - Enhanced article to publish
   * @param {Object} options - Publishing options
   * @returns {Promise<Object>} Published article response
   */
  async publishArticle(enhancedArticle, options = {}) {
    const operation = `publishArticle("${enhancedArticle.title}")`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`📤 Publishing enhanced article: "${enhancedArticle.title}"`);
      
      // Validate article before publishing
      if (options.validateBeforePublish !== false) {
        await this.validateArticleForPublishing(enhancedArticle);
      }
      
      // Prepare article data for API
      const articleData = this.prepareArticleData(enhancedArticle, options);
      
      // Publish to Laravel API with retry logic
      const response = await retryHttpRequest(
        () => this.callPublishAPI(articleData),
        `publishing "${enhancedArticle.title}"`
      );
      
      // Update statistics
      this.stats.published++;
      this.stats.totalProcessed++;
      
      this.logger.info(`✅ Successfully published article: "${enhancedArticle.title}" (ID: ${response.data.id})`);
      logger.endTimer(timer);
      
      return {
        success: true,
        article: response.data,
        publishedAt: new Date(),
        originalTitle: enhancedArticle.title,
      };
      
    } catch (error) {
      logger.endTimer(timer);
      this.stats.failed++;
      this.stats.totalProcessed++;
      
      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error;
      }
      
      ErrorHandler.logError(error, operation);
      throw new ApiError(`Publishing failed for "${enhancedArticle.title}": ${error.message}`, 'Laravel API');
    }
  }

  /**
   * Call Laravel API to publish article
   * @param {Object} articleData - Article data to publish
   * @returns {Promise<Object>} API response
   */
  async callPublishAPI(articleData) {
    try {
      this.logger.debug('🔄 Calling Laravel API to publish article...');
      
      const response = await this.apiClient.post('/articles', articleData);
      
      if (!response.data || !response.data.id) {
        throw new ApiError('Invalid response from Laravel API - missing article ID', 'Laravel API');
      }
      
      this.logger.debug(`✅ Laravel API response received (ID: ${response.data.id})`);
      return response;
      
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          throw new ApiError('Laravel API authentication failed - check API key', 'Laravel API', status);
        }
        
        if (status === 422) {
          const validationErrors = data.errors || data.message || 'Validation failed';
          throw new ValidationError(`Laravel API validation failed: ${JSON.stringify(validationErrors)}`);
        }
        
        if (status === 429) {
          throw new ApiError('Laravel API rate limit exceeded', 'Laravel API', status);
        }
        
        if (status >= 500) {
          throw new ApiError(`Laravel API server error (${status}): ${data?.message || 'Unknown error'}`, 'Laravel API', status);
        }
        
        throw new ApiError(`Laravel API error (${status}): ${data?.message || 'Unknown error'}`, 'Laravel API', status);
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new ApiError('Cannot connect to Laravel API - check if server is running', 'Laravel API');
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new ApiError('Laravel API request timeout', 'Laravel API');
      }
      
      throw error;
    }
  }

  /**
   * Prepare article data for Laravel API
   * @param {Object} enhancedArticle - Enhanced article
   * @param {Object} options - Publishing options
   * @returns {Object} Formatted article data
   */
  prepareArticleData(enhancedArticle, options = {}) {
    const {
      status = 'published',
      author = 'AI Enhancement System',
      category = 'Enhanced Articles',
      tags = ['ai-enhanced', 'automated'],
    } = options;
    
    // Base article data
    const articleData = {
      title: enhancedArticle.title,
      content: enhancedArticle.content,
      status,
      author,
      category,
      tags: Array.isArray(tags) ? tags : [tags],
    };
    
    // Add metadata if present
    if (enhancedArticle.metadata) {
      articleData.metadata = {
        ai_enhanced: true,
        enhancement_type: enhancedArticle.metadata.enhancement_type,
        original_article_id: enhancedArticle.metadata.original_article_id,
        enhanced_at: enhancedArticle.metadata.enhanced_at,
        model_used: enhancedArticle.metadata.model_used,
        references: enhancedArticle.metadata.references || [],
        enhancement_stats: enhancedArticle.metadata.enhancement_stats || {},
      };
    }
    
    // Add publishing timestamp
    articleData.published_at = new Date().toISOString();
    
    return articleData;
  }

  /**
   * Validate article before publishing
   * @param {Object} article - Article to validate
   * @returns {Promise<void>}
   */
  async validateArticleForPublishing(article) {
    this.logger.debug(`🔍 Validating article for publishing: "${article.title}"`);
    
    // Basic structure validation
    const validationResult = validateEnhancedArticle(article);
    if (!validationResult.isValid) {
      logValidationErrors(`article "${article.title}" for publishing`, validationResult.errors);
      throw new ValidationError(`Article validation failed for "${article.title}"`);
    }
    
    // Additional publishing-specific validations
    const errors = [];
    
    // Check content length
    if (article.content.length < config.minContentLength) {
      errors.push(`Article content too short (${article.content.length} chars, minimum ${config.minContentLength})`);
    }
    
    if (article.content.length > config.maxContentLength) {
      errors.push(`Article content too long (${article.content.length} chars, maximum ${config.maxContentLength})`);
    }
    
    // Check for required structural elements
    const hasHeadings = /^#{1,3}\s+.+$/m.test(article.content);
    if (!hasHeadings) {
      errors.push('Article should contain proper headings (H1, H2, or H3)');
    }
    
    // Check for references if metadata indicates references exist
    if (article.metadata?.references?.length > 0) {
      const hasReferencesSection = article.content.includes('References') || article.content.includes('## References');
      if (!hasReferencesSection) {
        errors.push('Article metadata indicates references but no References section found in content');
      }
    }
    
    // Report validation errors
    if (errors.length > 0) {
      logValidationErrors(`article "${article.title}" publishing validation`, errors);
      throw new ValidationError(`Publishing validation failed for "${article.title}"`);
    }
    
    this.logger.debug(`✅ Article validation passed for: "${article.title}"`);
  }

  /**
   * Publish multiple articles in batch
   * @param {Array} articles - Array of enhanced articles to publish
   * @param {Object} options - Publishing options
   * @returns {Promise<Array>} Array of publishing results
   */
  async publishMultiple(articles, options = {}) {
    const {
      concurrency = 2, // Lower concurrency to avoid overwhelming API
      continueOnError = true,
      validateBeforePublish = true,
    } = options;
    
    const operation = `publishMultiple(${articles.length} articles)`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`📤 Publishing ${articles.length} articles with concurrency ${concurrency}`);
      
      const results = [];
      const errors = [];
      
      // Process articles in batches
      for (let i = 0; i < articles.length; i += concurrency) {
        const batch = articles.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (article) => {
          try {
            const result = await this.publishArticle(article, { 
              ...options, 
              validateBeforePublish 
            });
            return { success: true, result };
          } catch (error) {
            this.logger.warn(`Failed to publish article "${article.title}":`, error.message);
            return { success: false, article, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push(result);
            if (!continueOnError) {
              throw new ApiError(`Publishing failed for "${result.article.title}": ${result.error}`);
            }
          }
        }
        
        // Delay between batches to be respectful to API
        if (i + concurrency < articles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      this.logger.info(`Publishing completed: ${results.length} successful, ${errors.length} failed`);
      
      if (errors.length > 0) {
        this.logger.warn('Failed articles:', errors.map(e => e.article.title));
      }
      
      logger.endTimer(timer);
      return results;
      
    } catch (error) {
      logger.endTimer(timer);
      ErrorHandler.logError(error, operation);
      throw error;
    }
  }

  /**
   * Update existing article with enhanced content
   * @param {number} articleId - ID of article to update
   * @param {Object} enhancedArticle - Enhanced article data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated article response
   */
  async updateArticle(articleId, enhancedArticle, options = {}) {
    const operation = `updateArticle(${articleId})`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`📝 Updating article ${articleId} with enhanced content`);
      
      // Validate article before updating
      if (options.validateBeforePublish !== false) {
        await this.validateArticleForPublishing(enhancedArticle);
      }
      
      // Prepare update data
      const updateData = this.prepareArticleData(enhancedArticle, options);
      updateData.updated_at = new Date().toISOString();
      
      // Update via Laravel API
      const response = await retryHttpRequest(
        () => this.apiClient.put(`/articles/${articleId}`, updateData),
        `updating article ${articleId}`
      );
      
      this.logger.info(`✅ Successfully updated article ${articleId}`);
      logger.endTimer(timer);
      
      return {
        success: true,
        article: response.data,
        updatedAt: new Date(),
        originalTitle: enhancedArticle.title,
      };
      
    } catch (error) {
      logger.endTimer(timer);
      ErrorHandler.logError(error, operation);
      throw new ApiError(`Update failed for article ${articleId}: ${error.message}`, 'Laravel API');
    }
  }

  /**
   * Test publishing functionality
   * @returns {Promise<boolean>} True if publishing works
   */
  async testPublishing() {
    try {
      this.logger.debug('Testing article publishing functionality...');
      
      const testArticle = {
        title: 'Test Enhanced Article',
        content: `# Test Enhanced Article

This is a test article created by the AI Enhancement System to verify publishing functionality. This article contains sufficient content to meet the minimum length requirements for validation.

## Introduction

This article demonstrates the enhanced content structure with proper headings and formatting. The content has been designed to showcase the capabilities of the AI enhancement system while maintaining readability and structure.

## Content Enhancement Features

The content has been enhanced with:
- Better structure and organization
- Improved readability and flow
- Proper formatting with headings and subheadings
- Enhanced SEO optimization
- Professional writing style

## Technical Implementation

The AI Enhancement System uses advanced natural language processing to:
1. Analyze the original content structure
2. Identify areas for improvement
3. Apply enhancement algorithms
4. Generate improved content with proper citations
5. Validate the enhanced content before publishing

## Quality Assurance

All enhanced content undergoes rigorous quality checks including:
- Content length validation
- Structure verification
- Citation accuracy
- Readability assessment
- SEO optimization review

## References

- Test Reference - example.com`,
        metadata: {
          ai_enhanced: true,
          enhancement_type: 'test',
          original_article_id: 1,
          enhanced_at: new Date(),
          model_used: 'test-model',
          references: [
            { title: 'Test Reference', domain: 'example.com', url: 'https://example.com' }
          ],
        },
      };
      
      // Test validation only (don't actually publish)
      await this.validateArticleForPublishing(testArticle);
      
      this.logger.debug('✅ Article publishing test passed (validation only)');
      return true;
      
    } catch (error) {
      this.logger.warn('⚠️ Article publishing test failed:', error.message);
      return false;
    }
  }

  /**
   * Get publishing statistics
   * @returns {Object} Publishing statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalProcessed > 0 
        ? Math.round((this.stats.published / this.stats.totalProcessed) * 100) 
        : 0,
    };
  }

  /**
   * Reset publishing statistics
   */
  resetStats() {
    this.stats = {
      published: 0,
      failed: 0,
      totalProcessed: 0,
    };
  }

  /**
   * Check Laravel API connectivity
   * @returns {Promise<boolean>} True if API is accessible
   */
  async checkApiConnectivity() {
    try {
      this.logger.debug('🔍 Checking Laravel API connectivity...');
      
      const response = await ErrorUtils.withTimeout(
        this.apiClient.get('/articles?limit=1'),
        10000,
        'Laravel API connectivity check'
      );
      
      if (response.status === 200) {
        this.logger.debug('✅ Laravel API is accessible');
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.logger.warn('⚠️ Laravel API connectivity check failed:', error.message);
      return false;
    }
  }
}
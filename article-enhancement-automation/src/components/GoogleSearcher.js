/**
 * Google Searcher Component
 * 
 * Responsible for searching Google for similar articles without using paid APIs
 * Handles search result parsing, filtering, and domain diversity selection
 */

import googleIt from 'google-it';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { validateSearchResults, logValidationErrors } from '../utils/validation.js';
import { NetworkError, ValidationError, ErrorHandler, ErrorUtils } from '../utils/errors.js';
import { withRetry, retryConditions } from '../utils/retry.js';

export class GoogleSearcher {
  constructor() {
    this.logger = logger.child('GoogleSearcher');
    
    // Domains to exclude from search results
    this.excludedDomains = [
      'youtube.com',
      'youtu.be',
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'linkedin.com',
      'pinterest.com',
      'reddit.com',
      'tiktok.com',
      'snapchat.com',
      'wikipedia.org', // Often not suitable for content enhancement
    ];
    
    // File extensions to exclude
    this.excludedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.xls',
      '.xlsx',
      '.zip',
      '.rar',
      '.mp4',
      '.mp3',
      '.avi',
      '.mov',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
    ];
  }

  /**
   * Search Google for articles similar to the given title
   * @param {string} query - Search query (usually article title)
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} Array of search results
   */
  async searchGoogle(query, maxResults = config.maxSearchResults) {
    const operation = `searchGoogle("${query}")`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`🔍 Searching Google for: "${query}"`);
      
      // Use retry logic for network resilience
      const results = await withRetry(
        () => this.performGoogleSearch(query, maxResults),
        {
          shouldRetry: retryConditions.networkAndServerErrors,
          operationName: 'Google search',
          maxRetries: 2, // Fewer retries to avoid being blocked
        }
      );
      
      this.logger.info(`Found ${results.length} search results`);
      logger.endTimer(timer);
      
      return results;
      
    } catch (error) {
      logger.endTimer(timer);
      ErrorHandler.logError(error, operation);
      throw error;
    }
  }

  /**
   * Perform the actual Google search using google-it library
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results to fetch
   * @returns {Promise<Array>} Raw search results
   */
  async performGoogleSearch(query, maxResults) {
    try {
      // Use google-it library for search
      const searchOptions = {
        query: query,
        limit: Math.min(maxResults, 20), // Limit to avoid being blocked
        'user-agent': config.userAgent,
        'no-display': true, // Don't display results in console
      };
      
      this.logger.debug('Performing Google search with options:', searchOptions);
      
      const results = await googleIt(searchOptions);
      
      if (!Array.isArray(results)) {
        throw new ValidationError('Google search returned invalid results format');
      }
      
      this.logger.debug(`Google search returned ${results.length} raw results`);
      return results;
      
    } catch (error) {
      if (error.message.includes('blocked') || error.message.includes('captcha')) {
        throw new NetworkError('Google search blocked - may need to wait or use different approach', null, 'BLOCKED');
      }
      
      if (error.message.includes('timeout')) {
        throw new NetworkError('Google search timed out', null, 'TIMEOUT');
      }
      
      throw new NetworkError(`Google search failed: ${error.message}`, null, error.code);
    }
  }

  /**
   * Parse and filter search results to get valid article URLs
   * @param {Array} rawResults - Raw search results from Google
   * @returns {Array} Filtered and parsed results
   */
  parseSearchResults(rawResults) {
    this.logger.debug(`Parsing ${rawResults.length} search results`);
    
    const parsedResults = [];
    
    for (const result of rawResults) {
      try {
        // Extract URL and title
        const url = result.link || result.url;
        const title = result.title || result.snippet || 'Untitled';
        const snippet = result.snippet || '';
        
        if (!url || !title) {
          this.logger.debug('Skipping result with missing URL or title');
          continue;
        }
        
        // Create parsed result object
        const parsedResult = {
          url: url.trim(),
          title: title.trim(),
          snippet: snippet.trim(),
          domain: this.extractDomain(url),
        };
        
        parsedResults.push(parsedResult);
        
      } catch (error) {
        this.logger.warn('Failed to parse search result:', error.message);
        continue;
      }
    }
    
    this.logger.debug(`Parsed ${parsedResults.length} valid results`);
    return parsedResults;
  }

  /**
   * Filter out non-article links and unwanted domains
   * @param {Array} results - Parsed search results
   * @returns {Array} Filtered results
   */
  filterValidArticles(results) {
    this.logger.debug(`Filtering ${results.length} results for valid articles`);
    
    const validResults = results.filter(result => {
      // Check for excluded domains
      if (this.isExcludedDomain(result.domain)) {
        this.logger.debug(`Excluding ${result.domain} (excluded domain)`);
        return false;
      }
      
      // Check for excluded file extensions
      if (this.hasExcludedExtension(result.url)) {
        this.logger.debug(`Excluding ${result.url} (excluded file type)`);
        return false;
      }
      
      // Check for minimum title length
      if (result.title.length < 10) {
        this.logger.debug(`Excluding result with short title: "${result.title}"`);
        return false;
      }
      
      // Check for valid URL format
      try {
        new URL(result.url);
      } catch {
        this.logger.debug(`Excluding invalid URL: ${result.url}`);
        return false;
      }
      
      return true;
    });
    
    this.logger.info(`Filtered to ${validResults.length} valid article results`);
    return validResults;
  }

  /**
   * Select top articles ensuring domain diversity
   * @param {Array} articles - Filtered article results
   * @param {number} count - Number of articles to select
   * @returns {Array} Selected articles from different domains
   */
  selectTopArticles(articles, count = 2) {
    this.logger.debug(`Selecting top ${count} articles from ${articles.length} candidates`);
    
    if (articles.length === 0) {
      this.logger.warn('No articles available for selection');
      return [];
    }
    
    const selectedArticles = [];
    const usedDomains = new Set();
    
    // First pass: select articles from unique domains
    for (const article of articles) {
      if (selectedArticles.length >= count) break;
      
      if (!usedDomains.has(article.domain)) {
        selectedArticles.push(article);
        usedDomains.add(article.domain);
        this.logger.debug(`Selected article from ${article.domain}: "${article.title}"`);
      }
    }
    
    // Second pass: fill remaining slots if needed (allowing domain duplicates)
    if (selectedArticles.length < count) {
      for (const article of articles) {
        if (selectedArticles.length >= count) break;
        
        if (!selectedArticles.includes(article)) {
          selectedArticles.push(article);
          this.logger.debug(`Selected additional article: "${article.title}"`);
        }
      }
    }
    
    this.logger.info(`Selected ${selectedArticles.length} articles for content enhancement`);
    return selectedArticles;
  }

  /**
   * Complete search workflow: search, parse, filter, and select
   * @param {string} query - Search query
   * @param {number} targetCount - Number of articles to return
   * @returns {Promise<Array>} Selected articles ready for scraping
   */
  async findSimilarArticles(query, targetCount = 2) {
    const operation = `findSimilarArticles("${query}")`;
    const timer = logger.startTimer(operation);
    
    try {
      logger.workflow('Google Search', 'start', { query, targetCount });
      
      // Step 1: Search Google
      const rawResults = await this.searchGoogle(query, config.maxSearchResults);
      
      if (rawResults.length === 0) {
        this.logger.warn('No search results found');
        logger.workflow('Google Search', 'complete', { found: 0 });
        return [];
      }
      
      // Step 2: Parse results
      const parsedResults = this.parseSearchResults(rawResults);
      
      // Step 3: Filter valid articles
      const validArticles = this.filterValidArticles(parsedResults);
      
      if (validArticles.length === 0) {
        this.logger.warn('No valid articles found after filtering');
        logger.workflow('Google Search', 'complete', { found: 0 });
        return [];
      }
      
      // Step 4: Select top articles with domain diversity
      const selectedArticles = this.selectTopArticles(validArticles, targetCount);
      
      // Validate final results
      const validationResult = validateSearchResults(selectedArticles);
      if (!validationResult.isValid) {
        logValidationErrors('selected articles', validationResult.errors);
        throw new ValidationError('Selected articles failed validation');
      }
      
      logger.workflow('Google Search', 'complete', { 
        found: selectedArticles.length,
        domains: selectedArticles.map(a => a.domain),
      });
      
      logger.endTimer(timer);
      return selectedArticles;
      
    } catch (error) {
      logger.endTimer(timer);
      logger.workflow('Google Search', 'error', { error: error.message });
      
      // Handle graceful degradation
      if (error instanceof NetworkError && error.networkCode === 'BLOCKED') {
        this.logger.warn('Google search blocked - this may happen occasionally');
        return []; // Return empty array to allow workflow to continue
      }
      
      throw error;
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Domain name
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if domain is in excluded list
   * @param {string} domain - Domain to check
   * @returns {boolean} True if domain should be excluded
   */
  isExcludedDomain(domain) {
    return this.excludedDomains.some(excluded => 
      domain.includes(excluded) || excluded.includes(domain)
    );
  }

  /**
   * Check if URL has excluded file extension
   * @param {string} url - URL to check
   * @returns {boolean} True if URL has excluded extension
   */
  hasExcludedExtension(url) {
    const urlLower = url.toLowerCase();
    return this.excludedExtensions.some(ext => urlLower.includes(ext));
  }

  /**
   * Test search functionality with a simple query
   * @returns {Promise<boolean>} True if search is working
   */
  async testSearch() {
    try {
      this.logger.debug('Testing Google search functionality...');
      
      const results = await ErrorUtils.withTimeout(
        this.findSimilarArticles('test search', 1),
        10000,
        'Google search test'
      );
      
      this.logger.debug(`✅ Google search test passed (found ${results.length} results)`);
      return true;
      
    } catch (error) {
      this.logger.warn('⚠️ Google search test failed:', error.message);
      return false;
    }
  }
}
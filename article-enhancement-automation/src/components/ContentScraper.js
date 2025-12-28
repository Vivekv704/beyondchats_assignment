/**
 * Content Scraper Component
 * 
 * Responsible for extracting readable content from article URLs
 * Uses Cheerio for static sites with Puppeteer fallback for JS-rendered content
 * Handles content cleaning, normalization, and metadata extraction
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { validateScrapedContent, logValidationErrors } from '../utils/validation.js';
import { ScrapingError, NetworkError, ValidationError, ErrorHandler, ErrorUtils } from '../utils/errors.js';
import { retryScraping } from '../utils/retry.js';

export class ContentScraper {
  constructor() {
    this.logger = logger.child('ContentScraper');
    
    // Browser instance for Puppeteer (lazy-loaded)
    this.browser = null;
    
    // User agents for rotation
    this.userAgents = [
      config.userAgent,
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    
    // Selectors for content extraction (ordered by priority)
    this.contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      '.post-body',
      '.article-body',
      'main',
      '#content',
      '.main-content',
    ];
    
    // Selectors for title extraction
    this.titleSelectors = [
      'h1',
      '.post-title',
      '.entry-title',
      '.article-title',
      'title',
      '.title',
      'header h1',
      '.page-title',
    ];
    
    // Selectors to remove (ads, navigation, etc.)
    this.removeSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.ad',
      '.sidebar',
      '.social-share',
      '.comments',
      '.comment',
      '.related-posts',
      '.newsletter',
      '.popup',
      '.modal',
      '.cookie-notice',
      '.breadcrumb',
      '.navigation',
      '.menu',
      '.widget',
      '.promo',
      '.banner',
      '.subscribe',
    ];
  }

  /**
   * Scrape article content from URL with automatic fallback
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content object
   */
  async scrapeArticle(url) {
    const operation = `scrapeArticle("${url}")`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`🌐 Scraping content from: ${url}`);
      
      // Try Cheerio first (fast, lightweight)
      try {
        const content = await retryScraping(
          () => this.scrapeWithCheerio(url),
          url
        );
        
        logger.endTimer(timer);
        return content;
        
      } catch (cheerioError) {
        this.logger.warn(`Cheerio scraping failed for ${url}, trying Puppeteer fallback:`, cheerioError.message);
        
        // Fallback to Puppeteer for JS-rendered sites
        try {
          const content = await retryScraping(
            () => this.scrapeWithPuppeteer(url),
            url
          );
          
          logger.endTimer(timer);
          return content;
          
        } catch (puppeteerError) {
          this.logger.error(`Both Cheerio and Puppeteer failed for ${url}`);
          throw new ScrapingError(
            `Failed to scrape content from ${url}`,
            url,
            `Cheerio: ${cheerioError.message}, Puppeteer: ${puppeteerError.message}`
          );
        }
      }
      
    } catch (error) {
      logger.endTimer(timer);
      
      if (error instanceof ScrapingError) {
        throw error;
      }
      
      ErrorHandler.logError(error, operation);
      throw new ScrapingError(`Scraping failed for ${url}: ${error.message}`, url, error.message);
    }
  }

  /**
   * Scrape content using Cheerio (for static sites)
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content
   */
  async scrapeWithCheerio(url) {
    const operation = `scrapeWithCheerio("${url}")`;
    
    try {
      this.logger.debug(`📄 Scraping with Cheerio: ${url}`);
      
      // Make HTTP request
      const response = await axios.get(url, {
        timeout: config.requestTimeout,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 5,
      });
      
      if (response.status !== 200) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, url);
      }
      
      // Load HTML into Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract content
      const content = this.extractContent($, url);
      
      // Validate extracted content
      const validationResult = validateScrapedContent(content);
      if (!validationResult.isValid) {
        logValidationErrors(`scraped content from ${url}`, validationResult.errors);
        throw new ValidationError(`Content validation failed for ${url}`);
      }
      
      this.logger.info(`✅ Successfully scraped content from ${url} (${content.content.length} chars)`);
      return content;
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new NetworkError(`Domain not found: ${url}`, url, 'ENOTFOUND');
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new NetworkError(`Connection refused: ${url}`, url, 'ECONNREFUSED');
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new NetworkError(`Request timeout: ${url}`, url, 'ETIMEDOUT');
      }
      
      if (error.response?.status === 403) {
        throw new ScrapingError(`Access forbidden (403) - site may be blocking scrapers: ${url}`, url, 'BLOCKED');
      }
      
      if (error.response?.status === 404) {
        throw new ScrapingError(`Page not found (404): ${url}`, url, 'NOT_FOUND');
      }
      
      throw error;
    }
  }

  /**
   * Scrape content using Puppeteer (for JS-rendered sites)
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content
   */
  async scrapeWithPuppeteer(url) {
    const operation = `scrapeWithPuppeteer("${url}")`;
    
    try {
      this.logger.debug(`🤖 Scraping with Puppeteer: ${url}`);
      
      // Launch browser if not already running
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        });
      }
      
      const page = await this.browser.newPage();
      
      try {
        // Set user agent and viewport
        await page.setUserAgent(this.getRandomUserAgent());
        await page.setViewport({ width: 1366, height: 768 });
        
        // Navigate to page with timeout
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: config.requestTimeout,
        });
        
        // Wait for content to load (using setTimeout instead of deprecated waitForTimeout)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract content using page evaluation
        const content = await page.evaluate((selectors) => {
          const { contentSelectors, titleSelectors, removeSelectors } = selectors;
          
          // Remove unwanted elements
          removeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
          
          // Extract title
          let title = '';
          for (const selector of titleSelectors) {
            const titleEl = document.querySelector(selector);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }
          
          // Extract content
          let content = '';
          for (const selector of contentSelectors) {
            const contentEl = document.querySelector(selector);
            if (contentEl) {
              content = contentEl.textContent.trim();
              if (content.length > 200) { // Ensure substantial content
                break;
              }
            }
          }
          
          return { title, content };
        }, {
          contentSelectors: this.contentSelectors,
          titleSelectors: this.titleSelectors,
          removeSelectors: this.removeSelectors,
        });
        
        // Create content object
        const scrapedContent = {
          url,
          title: content.title || 'Untitled',
          content: this.cleanContent(content.content),
          domain: this.extractDomain(url),
          scrapedAt: new Date(),
          method: 'puppeteer',
        };
        
        // Validate extracted content
        const validationResult = validateScrapedContent(scrapedContent);
        if (!validationResult.isValid) {
          logValidationErrors(`scraped content from ${url}`, validationResult.errors);
          throw new ValidationError(`Content validation failed for ${url}`);
        }
        
        this.logger.info(`✅ Successfully scraped content with Puppeteer from ${url} (${scrapedContent.content.length} chars)`);
        return scrapedContent;
        
      } finally {
        await page.close();
      }
      
    } catch (error) {
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new NetworkError(`Domain not found: ${url}`, url, 'ENOTFOUND');
      }
      
      if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        throw new NetworkError(`Connection refused: ${url}`, url, 'ECONNREFUSED');
      }
      
      if (error.message.includes('Navigation timeout')) {
        throw new NetworkError(`Navigation timeout: ${url}`, url, 'ETIMEDOUT');
      }
      
      throw error;
    }
  }

  /**
   * Extract content from Cheerio-loaded HTML
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Source URL
   * @returns {Object} Extracted content
   */
  extractContent($, url) {
    // Remove unwanted elements
    this.removeSelectors.forEach(selector => {
      $(selector).remove();
    });
    
    // Extract title
    let title = '';
    for (const selector of this.titleSelectors) {
      const titleEl = $(selector).first();
      if (titleEl.length && titleEl.text().trim()) {
        title = titleEl.text().trim();
        break;
      }
    }
    
    // Extract content
    let content = '';
    for (const selector of this.contentSelectors) {
      const contentEl = $(selector).first();
      if (contentEl.length) {
        content = contentEl.text().trim();
        if (content.length > 200) { // Ensure substantial content
          break;
        }
      }
    }
    
    // Fallback: get all paragraph text if no content found
    if (!content || content.length < 200) {
      const paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
      content = paragraphs.join('\n\n');
    }
    
    return {
      url,
      title: title || 'Untitled',
      content: this.cleanContent(content),
      domain: this.extractDomain(url),
      scrapedAt: new Date(),
      method: 'cheerio',
    };
  }

  /**
   * Clean and normalize extracted content
   * @param {string} content - Raw content text
   * @returns {string} Cleaned content
   */
  cleanContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    return content
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple newlines
      .replace(/\n\s*\n/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Limit content length
      .substring(0, config.maxContentLength);
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
   * Get random user agent for request rotation
   * @returns {string} Random user agent string
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Scrape multiple articles concurrently
   * @param {Array} urls - Array of URLs to scrape
   * @param {number} concurrency - Maximum concurrent requests
   * @returns {Promise<Array>} Array of scraped content objects
   */
  async scrapeMultiple(urls, concurrency = 3) {
    const operation = `scrapeMultiple(${urls.length} URLs)`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`🌐 Scraping ${urls.length} articles with concurrency ${concurrency}`);
      
      const results = [];
      const errors = [];
      
      // Process URLs in batches to control concurrency
      for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (url) => {
          try {
            const content = await this.scrapeArticle(url);
            return { success: true, url, content };
          } catch (error) {
            this.logger.warn(`Failed to scrape ${url}:`, error.message);
            return { success: false, url, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.success) {
            results.push(result.content);
          } else {
            errors.push(result);
          }
        }
        
        // Small delay between batches to be respectful
        if (i + concurrency < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      this.logger.info(`Scraping completed: ${results.length} successful, ${errors.length} failed`);
      
      if (errors.length > 0) {
        this.logger.warn('Failed URLs:', errors.map(e => e.url));
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
   * Test scraping functionality with a known URL
   * @returns {Promise<boolean>} True if scraping works
   */
  async testScraping() {
    try {
      this.logger.debug('Testing content scraping functionality...');
      
      // Test with a reliable site
      const testUrl = 'https://example.com';
      
      const content = await ErrorUtils.withTimeout(
        this.scrapeArticle(testUrl),
        15000,
        'Content scraping test'
      );
      
      this.logger.debug(`✅ Content scraping test passed (${content.content.length} chars)`);
      return true;
      
    } catch (error) {
      this.logger.warn('⚠️ Content scraping test failed:', error.message);
      return false;
    }
  }

  /**
   * Clean up resources (close browser)
   */
  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.logger.debug('Browser instance closed');
      } catch (error) {
        this.logger.warn('Error closing browser:', error.message);
      }
    }
  }
}
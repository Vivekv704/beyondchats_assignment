/**
 * Article Enhancement Automation - Main Entry Point
 * 
 * This is the main entry point for the Node.js automation system that:
 * 1. Fetches the latest article from Laravel API
 * 2. Searches Google for similar articles
 * 3. Scrapes reference content
 * 4. Enhances content using Groq AI
 * 5. Publishes enhanced article back to Laravel API
 */

import 'dotenv/config';
import { logger } from './utils/logger.js';
import { config, validateSystemRequirements, testApiConnectivity } from './config/config.js';
import { setupGlobalErrorHandlers } from './utils/errors.js';
import { ArticleFetcher } from './components/ArticleFetcher.js';
import { GoogleSearcher } from './components/GoogleSearcher.js';
import { ContentScraper } from './components/ContentScraper.js';
import { AIEnhancer } from './components/AIEnhancer.js';
import { ArticlePublisher } from './components/ArticlePublisher.js';

// Set up global error handlers
setupGlobalErrorHandlers();

/**
 * Article Enhancement Workflow Orchestrator
 */
class ArticleEnhancementWorkflow {
  constructor() {
    this.logger = logger.child('Workflow');
    
    // Initialize components
    this.articleFetcher = new ArticleFetcher();
    this.googleSearcher = new GoogleSearcher();
    this.contentScraper = new ContentScraper();
    this.aiEnhancer = new AIEnhancer();
    this.articlePublisher = new ArticlePublisher();
    
    // Workflow statistics
    this.stats = {
      startTime: null,
      endTime: null,
      originalArticle: null,
      searchResults: [],
      scrapedArticles: [],
      enhancedArticle: null,
      publishedArticle: null,
      errors: [],
    };
  }

  /**
   * Execute the complete article enhancement workflow
   * @param {Object} options - Workflow options
   * @returns {Promise<Object>} Workflow results
   */
  async execute(options = {}) {
    const {
      enhancementType = 'comprehensive',
      publishMode = 'create', // 'create' or 'update'
      skipPublishing = false,
      maxReferences = 2,
    } = options;
    
    this.stats.startTime = new Date();
    const timer = logger.startTimer('complete-workflow');
    
    try {
      this.logger.info('🎯 Starting complete article enhancement workflow');
      
      // Step 1: Fetch latest article from Laravel API
      this.logger.info('📥 Step 1: Fetching latest article...');
      const originalArticle = await this.articleFetcher.fetchLatestArticle();
      this.stats.originalArticle = originalArticle;
      
      this.logger.info(`✅ Fetched article: "${originalArticle.title}" (ID: ${originalArticle.id})`);
      
      // Step 2: Search Google for similar articles
      this.logger.info('🔍 Step 2: Searching for similar articles...');
      const searchResults = await this.googleSearcher.searchSimilarArticles(originalArticle.title);
      this.stats.searchResults = searchResults;
      
      this.logger.info(`✅ Found ${searchResults.length} search results`);
      
      // Step 3: Scrape reference articles
      this.logger.info('🌐 Step 3: Scraping reference articles...');
      const referenceUrls = searchResults.slice(0, maxReferences).map(result => result.url);
      const scrapedArticles = await this.contentScraper.scrapeMultiple(referenceUrls, 2);
      this.stats.scrapedArticles = scrapedArticles;
      
      this.logger.info(`✅ Scraped ${scrapedArticles.length} reference articles`);
      
      // Step 4: Enhance article with AI
      this.logger.info('🤖 Step 4: Enhancing article with AI...');
      const enhancedArticle = await this.aiEnhancer.enhanceArticle(
        originalArticle, 
        scrapedArticles, 
        enhancementType
      );
      this.stats.enhancedArticle = enhancedArticle;
      
      // Log enhancement statistics
      const enhancementStats = this.aiEnhancer.getEnhancementStats(originalArticle, enhancedArticle);
      this.logger.info(`✅ Article enhanced: ${enhancementStats.lengthIncreasePercent}% length increase, ${enhancementStats.hasReferences ? 'with' : 'without'} references`);
      
      // Step 5: Publish enhanced article (if not skipped)
      if (!skipPublishing) {
        this.logger.info('📤 Step 5: Publishing enhanced article...');
        
        let publishResult;
        if (publishMode === 'update' && originalArticle.id) {
          publishResult = await this.articlePublisher.updateArticle(originalArticle.id, enhancedArticle);
        } else {
          publishResult = await this.articlePublisher.publishArticle(enhancedArticle);
        }
        
        this.stats.publishedArticle = publishResult;
        this.logger.info(`✅ Article ${publishMode === 'update' ? 'updated' : 'published'} successfully (ID: ${publishResult.article.id})`);
      } else {
        this.logger.info('⏭️ Step 5: Skipping publishing (as requested)');
      }
      
      // Workflow completed successfully
      this.stats.endTime = new Date();
      logger.endTimer(timer);
      
      const duration = this.stats.endTime - this.stats.startTime;
      this.logger.info(`🎉 Workflow completed successfully in ${Math.round(duration / 1000)}s`);
      
      return this.getWorkflowSummary();
      
    } catch (error) {
      this.stats.endTime = new Date();
      this.stats.errors.push({
        error: error.message,
        timestamp: new Date(),
        step: this.getCurrentStep(),
      });
      
      logger.endTimer(timer);
      this.logger.error('💥 Workflow failed:', error.message);
      
      // Provide step-specific error guidance
      this.provideErrorGuidance(error);
      
      throw error;
    } finally {
      // Cleanup resources
      await this.cleanup();
    }
  }

  /**
   * Execute workflow for multiple articles
   * @param {number} count - Number of articles to process
   * @param {Object} options - Workflow options
   * @returns {Promise<Array>} Array of workflow results
   */
  async executeMultiple(count = 1, options = {}) {
    const { continueOnError = true } = options;
    
    this.logger.info(`🎯 Starting batch workflow for ${count} articles`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < count; i++) {
      try {
        this.logger.info(`📋 Processing article ${i + 1}/${count}`);
        
        const result = await this.execute(options);
        results.push(result);
        
        // Delay between articles to be respectful
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        errors.push({
          articleIndex: i + 1,
          error: error.message,
          timestamp: new Date(),
        });
        
        if (!continueOnError) {
          throw error;
        }
        
        this.logger.warn(`⚠️ Article ${i + 1} failed, continuing with next...`);
      }
    }
    
    this.logger.info(`📊 Batch processing completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      successful: results,
      failed: errors,
      totalProcessed: count,
      successRate: Math.round((results.length / count) * 100),
    };
  }

  /**
   * Test all workflow components
   * @returns {Promise<Object>} Test results
   */
  async testWorkflow() {
    this.logger.info('🧪 Testing workflow components...');
    
    const tests = {
      articleFetcher: false,
      googleSearcher: false,
      contentScraper: false,
      aiEnhancer: false,
      articlePublisher: false,
    };
    
    // Test each component
    try {
      tests.articleFetcher = await this.articleFetcher.testConnection();
    } catch (error) {
      this.logger.warn('Article fetcher test failed:', error.message);
    }
    
    try {
      tests.googleSearcher = await this.googleSearcher.testSearch();
    } catch (error) {
      this.logger.warn('Google searcher test failed:', error.message);
    }
    
    try {
      tests.contentScraper = await this.contentScraper.testScraping();
    } catch (error) {
      this.logger.warn('Content scraper test failed:', error.message);
    }
    
    try {
      tests.aiEnhancer = await this.aiEnhancer.testEnhancement();
    } catch (error) {
      this.logger.warn('AI enhancer test failed:', error.message);
    }
    
    try {
      tests.articlePublisher = await this.articlePublisher.testPublishing();
    } catch (error) {
      this.logger.warn('Article publisher test failed:', error.message);
    }
    
    const passedTests = Object.values(tests).filter(Boolean).length;
    const totalTests = Object.keys(tests).length;
    
    this.logger.info(`🧪 Component tests completed: ${passedTests}/${totalTests} passed`);
    
    return {
      tests,
      passedTests,
      totalTests,
      allPassed: passedTests === totalTests,
    };
  }

  /**
   * Get current workflow step for error reporting
   * @returns {string} Current step name
   */
  getCurrentStep() {
    if (!this.stats.originalArticle) return 'fetching-article';
    if (this.stats.searchResults.length === 0) return 'searching-articles';
    if (this.stats.scrapedArticles.length === 0) return 'scraping-content';
    if (!this.stats.enhancedArticle) return 'enhancing-content';
    if (!this.stats.publishedArticle) return 'publishing-article';
    return 'completed';
  }

  /**
   * Provide error guidance based on current step
   * @param {Error} error - The error that occurred
   */
  provideErrorGuidance(error) {
    const step = this.getCurrentStep();
    
    switch (step) {
      case 'fetching-article':
        this.logger.error('💡 Article fetching failed - check Laravel API connectivity and configuration');
        break;
      case 'searching-articles':
        this.logger.error('💡 Google search failed - check network connectivity and search terms');
        break;
      case 'scraping-content':
        this.logger.error('💡 Content scraping failed - target sites may be blocking requests');
        break;
      case 'enhancing-content':
        this.logger.error('💡 AI enhancement failed - check Groq API key and connectivity');
        break;
      case 'publishing-article':
        this.logger.error('💡 Publishing failed - check Laravel API permissions and article validation');
        break;
      default:
        this.logger.error('💡 Check the error details above and system configuration');
    }
  }

  /**
   * Get workflow summary and statistics
   * @returns {Object} Workflow summary
   */
  getWorkflowSummary() {
    const duration = this.stats.endTime - this.stats.startTime;
    
    return {
      success: true,
      duration: Math.round(duration / 1000),
      originalArticle: {
        id: this.stats.originalArticle?.id,
        title: this.stats.originalArticle?.title,
        contentLength: this.stats.originalArticle?.content?.length,
      },
      searchResults: this.stats.searchResults.length,
      scrapedArticles: this.stats.scrapedArticles.length,
      enhancedArticle: {
        title: this.stats.enhancedArticle?.title,
        contentLength: this.stats.enhancedArticle?.content?.length,
        hasReferences: this.stats.enhancedArticle?.content?.includes('References'),
      },
      publishedArticle: this.stats.publishedArticle ? {
        id: this.stats.publishedArticle.article?.id,
        publishedAt: this.stats.publishedArticle.publishedAt,
      } : null,
      errors: this.stats.errors,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.contentScraper.cleanup();
    } catch (error) {
      this.logger.warn('Error during cleanup:', error.message);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    enhancementType: 'comprehensive',
    publishMode: 'create',
    skipPublishing: false,
    testMode: false,
    batchCount: 1,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--enhancement-type':
        options.enhancementType = args[++i] || 'comprehensive';
        break;
      case '--publish-mode':
        options.publishMode = args[++i] || 'create';
        break;
      case '--skip-publishing':
        options.skipPublishing = true;
        break;
      case '--test':
        options.testMode = true;
        break;
      case '--batch':
        options.batchCount = parseInt(args[++i]) || 1;
        break;
      case '--help':
        printUsage();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Article Enhancement Automation

Usage: node src/index.js [options]

Options:
  --enhancement-type <type>    Enhancement type: structure, seo, comprehensive (default: comprehensive)
  --publish-mode <mode>        Publishing mode: create, update (default: create)
  --skip-publishing           Skip the publishing step
  --test                      Run component tests only
  --batch <count>             Process multiple articles (default: 1)
  --help                      Show this help message

Examples:
  node src/index.js                                    # Process one article with default settings
  node src/index.js --enhancement-type seo            # Use SEO enhancement
  node src/index.js --skip-publishing                 # Don't publish, just enhance
  node src/index.js --test                            # Test all components
  node src/index.js --batch 5                         # Process 5 articles
`);
}

/**
 * Main application entry point
 */
async function main() {
  try {
    logger.info('🚀 Starting Article Enhancement Automation');
    
    // Parse command line arguments
    const options = parseArguments();
    
    logger.info(`📋 Configuration loaded for ${config.executionMode} mode`);
    
    // Validate system requirements
    await validateSystemRequirements();
    
    // Test API connectivity (non-fatal)
    await testApiConnectivity();
    
    logger.info('🎯 System validation completed - ready to process articles');
    
    // Initialize workflow
    const workflow = new ArticleEnhancementWorkflow();
    
    // Run in test mode if requested
    if (options.testMode) {
      const testResults = await workflow.testWorkflow();
      
      if (testResults.allPassed) {
        logger.info('🧪 All component tests passed - system is ready');
        process.exit(0);
      } else {
        logger.error(`🧪 ${testResults.totalTests - testResults.passedTests} component tests failed`);
        process.exit(1);
      }
    }
    
    // Execute workflow
    let results;
    if (options.batchCount > 1) {
      results = await workflow.executeMultiple(options.batchCount, options);
      logger.info(`📊 Batch processing summary: ${results.successRate}% success rate`);
    } else {
      results = await workflow.execute(options);
      logger.info(`📊 Processing summary: Enhanced "${results.originalArticle.title}" in ${results.duration}s`);
    }
    
    logger.info('🎉 Article Enhancement Automation completed successfully');
    
  } catch (error) {
    logger.failure('💥 Article Enhancement Automation failed:', error.message);
    
    // Provide helpful error context
    if (error.message.includes('System requirements')) {
      logger.error('💡 Please install missing dependencies and check system requirements');
    } else if (error.message.includes('Configuration')) {
      logger.error('💡 Please check your .env file and environment variables');
    } else {
      logger.error('💡 Check the logs above for specific error details');
    }
    
    process.exit(1);
  }
}

// Start the application
main();
/**
 * AI Enhancement Component
 * 
 * Responsible for enhancing article content using Groq LLM API
 * Improves structure, formatting, SEO, and readability while maintaining originality
 * Adds proper citations and references section
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { validateEnhancedArticle, logValidationErrors } from '../utils/validation.js';
import { AIProcessingError, ApiError, ValidationError, ErrorHandler, ErrorUtils } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';

export class AIEnhancer {
  constructor() {
    this.logger = logger.child('AIEnhancer');
    
    // Groq API configuration
    this.apiClient = axios.create({
      baseURL: config.groqApiBaseUrl,
      timeout: config.requestTimeout,
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Model configuration
    this.model = config.groqModel;
    this.maxTokens = 4000;
    this.temperature = 0.7;
    
    // Enhancement templates
    this.enhancementPrompts = {
      structure: `You are an expert content editor. Your task is to enhance the given article by improving its structure, readability, and SEO while maintaining the original meaning and avoiding plagiarism.

REQUIREMENTS:
1. Improve the article structure with proper headings (H2, H3)
2. Add bullet points and numbered lists where appropriate
3. Enhance readability and flow
4. Maintain the original tone and style
5. Keep all factual information accurate
6. Do NOT plagiarize - rewrite in your own words
7. Add a "References" section at the end citing the provided sources

REFERENCE ARTICLES (for style and additional context):
{references}

ORIGINAL ARTICLE:
Title: {title}
Content: {content}

Please provide the enhanced article with improved structure and formatting:`,

      seo: `You are an SEO content specialist. Enhance this article for better search engine optimization while maintaining readability and authenticity.

REQUIREMENTS:
1. Optimize the title for SEO (keep it engaging)
2. Add relevant subheadings with keywords
3. Improve content flow and readability
4. Add transitional phrases and better paragraph structure
5. Maintain the original meaning and facts
6. Do NOT stuff keywords unnaturally
7. Keep the content authentic and valuable

ARTICLE TO ENHANCE:
Title: {title}
Content: {content}

REFERENCE CONTEXT:
{references}

Provide the SEO-enhanced article:`,

      comprehensive: `You are a professional content editor and writer. Your task is to create a comprehensive, well-structured, and engaging article based on the original content and reference materials.

INSTRUCTIONS:
1. **Structure**: Create a well-organized article with:
   - Compelling introduction
   - Clear headings and subheadings (H2, H3)
   - Logical flow between sections
   - Strong conclusion

2. **Content Enhancement**:
   - Expand on key points with additional insights
   - Add relevant examples or explanations
   - Improve clarity and readability
   - Use bullet points and lists for better organization

3. **Style Requirements**:
   - Match the tone and style of the reference articles
   - Maintain professional yet engaging writing
   - Use active voice where possible
   - Ensure smooth transitions between paragraphs

4. **Originality**:
   - Rewrite content in your own words
   - Do NOT copy text directly from references
   - Add unique insights and perspectives
   - Maintain factual accuracy

5. **Citations**:
   - Add a "References" section at the end
   - Include title and domain for each reference
   - Format: "- [Article Title] - domain.com"

ORIGINAL ARTICLE:
Title: {title}
Content: {content}

REFERENCE ARTICLES FOR CONTEXT AND STYLE:
{references}

Create an enhanced, comprehensive article:`,
    };
  }

  /**
   * Enhance article content using AI
   * @param {Object} originalArticle - Original article data
   * @param {Array} referenceArticles - Reference articles for context
   * @param {string} enhancementType - Type of enhancement ('structure', 'seo', 'comprehensive')
   * @returns {Promise<Object>} Enhanced article
   */
  async enhanceArticle(originalArticle, referenceArticles = [], enhancementType = 'comprehensive') {
    const operation = `enhanceArticle(${originalArticle.title})`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`🤖 Enhancing article: "${originalArticle.title}" (${enhancementType})`);
      
      // Prepare reference context
      const referenceContext = this.formatReferences(referenceArticles);
      
      // Generate enhancement prompt
      const prompt = this.generatePrompt(originalArticle, referenceContext, enhancementType);
      
      // Call Groq API with retry logic
      const enhancedContent = await withRetry(
        () => this.callGroqAPI(prompt),
        {
          maxRetries: config.maxRetries,
          context: `AI enhancement for "${originalArticle.title}"`,
        }
      );
      
      // Create enhanced article object
      const enhancedArticle = {
        title: this.extractTitle(enhancedContent) || originalArticle.title,
        content: this.cleanEnhancedContent(enhancedContent),
        metadata: {
          ai_enhanced: true,
          enhancement_type: enhancementType,
          original_article_id: originalArticle.id,
          enhanced_at: new Date(),
          model_used: this.model,
          references: referenceArticles.length > 0 ? referenceArticles.map(ref => ({
            title: ref.title,
            domain: ref.domain,
            url: ref.url,
          })) : [],
        },
      };
      
      // Add references section if not present
      if (!enhancedArticle.content.includes('References') && referenceArticles.length > 0) {
        enhancedArticle.content += '\n\n' + this.generateReferencesSection(referenceArticles);
      }
      
      // Validate enhanced article
      const validationResult = validateEnhancedArticle(enhancedArticle);
      if (!validationResult.isValid) {
        logValidationErrors(`enhanced article "${originalArticle.title}"`, validationResult.errors);
        throw new ValidationError(`Enhanced article validation failed for "${originalArticle.title}"`);
      }
      
      this.logger.info(`✅ Successfully enhanced article: "${enhancedArticle.title}" (${enhancedArticle.content.length} chars)`);
      logger.endTimer(timer);
      
      return enhancedArticle;
      
    } catch (error) {
      logger.endTimer(timer);
      
      if (error instanceof AIProcessingError || error instanceof ValidationError) {
        throw error;
      }
      
      ErrorHandler.logError(error, operation);
      throw new AIProcessingError(`AI enhancement failed for "${originalArticle.title}": ${error.message}`, this.model, 'enhancement');
    }
  }

  /**
   * Call Groq API for content enhancement
   * @param {string} prompt - Enhancement prompt
   * @returns {Promise<string>} Enhanced content
   */
  async callGroqAPI(prompt) {
    try {
      this.logger.debug('🔄 Calling Groq API for content enhancement...');
      
      const response = await this.apiClient.post('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false,
      });
      
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new AIProcessingError('Invalid response from Groq API', this.model);
      }
      
      const enhancedContent = response.data.choices[0].message.content;
      
      if (!enhancedContent || enhancedContent.trim().length === 0) {
        throw new AIProcessingError('Empty response from Groq API', this.model);
      }
      
      this.logger.debug(`✅ Groq API response received (${enhancedContent.length} chars)`);
      return enhancedContent;
      
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          throw new AIProcessingError('Groq API authentication failed - check API key', this.model);
        }
        
        if (status === 429) {
          const retryAfter = error.response.headers?.['retry-after'];
          throw new AIProcessingError(`Groq API rate limit exceeded${retryAfter ? ` - retry after ${retryAfter}s` : ''}`, this.model);
        }
        
        if (status === 400) {
          throw new AIProcessingError(`Groq API request error: ${data?.error?.message || 'Invalid request'}`, this.model);
        }
        
        throw new AIProcessingError(`Groq API error (${status}): ${data?.error?.message || 'Unknown error'}`, this.model);
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new AIProcessingError('Cannot connect to Groq API - check network connectivity', this.model);
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new AIProcessingError('Groq API request timeout', this.model);
      }
      
      throw error;
    }
  }

  /**
   * Generate enhancement prompt based on type
   * @param {Object} article - Original article
   * @param {string} references - Formatted reference context
   * @param {string} type - Enhancement type
   * @returns {string} Generated prompt
   */
  generatePrompt(article, references, type) {
    const template = this.enhancementPrompts[type] || this.enhancementPrompts.comprehensive;
    
    return template
      .replace('{title}', article.title)
      .replace('{content}', article.content.substring(0, 8000)) // Limit content length for API
      .replace(/{references}/g, references);
  }

  /**
   * Format reference articles for prompt context
   * @param {Array} references - Reference articles
   * @returns {string} Formatted reference text
   */
  formatReferences(references) {
    if (!references || references.length === 0) {
      return 'No reference articles provided.';
    }
    
    return references.map((ref, index) => {
      const content = ref.content.substring(0, 1000); // Limit reference content
      return `Reference ${index + 1}:
Title: ${ref.title}
Domain: ${ref.domain}
Content: ${content}...
`;
    }).join('\n');
  }

  /**
   * Extract title from enhanced content if present
   * @param {string} content - Enhanced content
   * @returns {string|null} Extracted title or null
   */
  extractTitle(content) {
    // Look for title patterns in the enhanced content
    const titlePatterns = [
      /^#\s+(.+)$/m,
      /^Title:\s*(.+)$/m,
      /^\*\*(.+)\*\*$/m,
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Clean and format enhanced content
   * @param {string} content - Raw enhanced content
   * @returns {string} Cleaned content
   */
  cleanEnhancedContent(content) {
    return content
      // Remove title if it's at the beginning
      .replace(/^#\s+.+\n\n?/, '')
      .replace(/^Title:\s*.+\n\n?/, '')
      .replace(/^\*\*.+\*\*\n\n?/, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/gm, '')
      .trim();
  }

  /**
   * Generate references section
   * @param {Array} references - Reference articles
   * @returns {string} Formatted references section
   */
  generateReferencesSection(references) {
    if (!references || references.length === 0) {
      return '';
    }
    
    const referenceList = references.map(ref => 
      `- [${ref.title}](${ref.url}) - ${ref.domain}`
    ).join('\n');
    
    return `## References\n\n${referenceList}`;
  }

  /**
   * Enhance multiple articles in batch
   * @param {Array} articles - Array of articles to enhance
   * @param {Array} referenceArticles - Reference articles for context
   * @param {Object} options - Enhancement options
   * @returns {Promise<Array>} Array of enhanced articles
   */
  async enhanceMultiple(articles, referenceArticles = [], options = {}) {
    const { 
      enhancementType = 'comprehensive',
      concurrency = 2, // Lower concurrency for API rate limits
      continueOnError = true,
    } = options;
    
    const operation = `enhanceMultiple(${articles.length} articles)`;
    const timer = logger.startTimer(operation);
    
    try {
      this.logger.info(`🤖 Enhancing ${articles.length} articles with concurrency ${concurrency}`);
      
      const results = [];
      const errors = [];
      
      // Process articles in batches to respect rate limits
      for (let i = 0; i < articles.length; i += concurrency) {
        const batch = articles.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (article) => {
          try {
            const enhanced = await this.enhanceArticle(article, referenceArticles, enhancementType);
            return { success: true, article: enhanced };
          } catch (error) {
            this.logger.warn(`Failed to enhance article "${article.title}":`, error.message);
            return { success: false, article, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.success) {
            results.push(result.article);
          } else {
            errors.push(result);
            if (!continueOnError) {
              throw new AIProcessingError(`Enhancement failed for "${result.article.title}": ${result.error}`);
            }
          }
        }
        
        // Delay between batches to respect rate limits
        if (i + concurrency < articles.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      this.logger.info(`Enhancement completed: ${results.length} successful, ${errors.length} failed`);
      
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
   * Test AI enhancement functionality
   * @returns {Promise<boolean>} True if enhancement works
   */
  async testEnhancement() {
    try {
      this.logger.debug('Testing AI enhancement functionality...');
      
      const testArticle = {
        id: 1,
        title: 'Test Article',
        content: 'This is a test article content for testing AI enhancement functionality. It should be enhanced with better structure and formatting.',
      };
      
      const enhanced = await ErrorUtils.withTimeout(
        this.enhanceArticle(testArticle, [], 'structure'),
        30000,
        'AI enhancement test'
      );
      
      this.logger.debug(`✅ AI enhancement test passed (${enhanced.content.length} chars)`);
      return true;
      
    } catch (error) {
      this.logger.warn('⚠️ AI enhancement test failed:', error.message);
      return false;
    }
  }

  /**
   * Get enhancement statistics
   * @param {Object} originalArticle - Original article
   * @param {Object} enhancedArticle - Enhanced article
   * @returns {Object} Enhancement statistics
   */
  getEnhancementStats(originalArticle, enhancedArticle) {
    const originalLength = originalArticle.content.length;
    const enhancedLength = enhancedArticle.content.length;
    
    return {
      originalLength,
      enhancedLength,
      lengthIncrease: enhancedLength - originalLength,
      lengthIncreasePercent: Math.round(((enhancedLength - originalLength) / originalLength) * 100),
      hasReferences: enhancedArticle.content.includes('References'),
      enhancementType: enhancedArticle.metadata?.enhancement_type || 'unknown',
      modelUsed: enhancedArticle.metadata?.model_used || 'unknown',
    };
  }
}
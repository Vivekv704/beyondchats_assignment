/**
 * Configuration Management Module
 * 
 * Handles environment variable loading, validation, and configuration schema
 * Provides centralized configuration access for all application components
 */

import { logger } from '../utils/logger.js';
import { validateAndSanitizeConfig, logValidationErrors } from '../utils/validation.js';

/**
 * Configuration schema with validation and defaults
 */
const configSchema = {
  // Laravel API Configuration
  laravelApiBaseUrl: {
    env: 'LARAVEL_API_BASE_URL',
    required: true,
    default: 'http://localhost:8000/api',
  },
  laravelApiKey: {
    env: 'LARAVEL_API_KEY',
    required: false,
    default: '',
  },
  
  // Groq API Configuration
  groqApiKey: {
    env: 'GROQ_API_KEY',
    required: true,
  },
  groqModel: {
    env: 'GROQ_MODEL',
    required: false,
    default: 'llama-3.1-8b-instant',
  },
  groqApiBaseUrl: {
    env: 'GROQ_API_BASE_URL',
    required: false,
    default: 'https://api.groq.com/openai/v1',
  },
  
  // Scraping Configuration
  requestTimeout: {
    env: 'REQUEST_TIMEOUT',
    required: false,
    default: 30000,
    type: 'number',
  },
  maxRetries: {
    env: 'MAX_RETRIES',
    required: false,
    default: 3,
    type: 'number',
  },
  retryDelay: {
    env: 'RETRY_DELAY',
    required: false,
    default: 2000,
    type: 'number',
  },
  userAgent: {
    env: 'USER_AGENT',
    required: false,
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  
  // Content Processing Configuration
  maxContentLength: {
    env: 'MAX_CONTENT_LENGTH',
    required: false,
    default: 50000,
    type: 'number',
  },
  minContentLength: {
    env: 'MIN_CONTENT_LENGTH',
    required: false,
    default: 500,
    type: 'number',
  },
  maxSearchResults: {
    env: 'MAX_SEARCH_RESULTS',
    required: false,
    default: 10,
    type: 'number',
  },
  
  // Logging Configuration
  logLevel: {
    env: 'LOG_LEVEL',
    required: false,
    default: 'info',
    validate: (value) => ['debug', 'info', 'warn', 'error'].includes(value),
  },
  logFormat: {
    env: 'LOG_FORMAT',
    required: false,
    default: 'json',
    validate: (value) => ['json', 'simple'].includes(value),
  },
  
  // Execution Configuration
  executionMode: {
    env: 'EXECUTION_MODE',
    required: false,
    default: 'interactive',
    validate: (value) => ['interactive', 'non-interactive'].includes(value),
  },
  progressUpdates: {
    env: 'PROGRESS_UPDATES',
    required: false,
    default: true,
    type: 'boolean',
  },
};

/**
 * Convert string values to appropriate types
 */
function convertType(value, type) {
  if (type === 'number') {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    return num;
  }
  
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  }
  
  return value;
}

/**
 * Validate configuration value
 */
function validateConfigValue(key, value, schema) {
  if (schema.validate && !schema.validate(value)) {
    throw new Error(`Invalid value for ${key}: ${value}`);
  }
  return true;
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig() {
  const config = {};
  const errors = [];
  
  logger.debug('🔧 Loading configuration from environment variables...');
  
  for (const [key, schema] of Object.entries(configSchema)) {
    let value = process.env[schema.env];
    
    // Check if required value is missing
    if (schema.required && (!value || value.trim() === '')) {
      errors.push(`Missing required environment variable: ${schema.env}`);
      continue;
    }
    
    // Use default value if not provided
    if (!value && schema.default !== undefined) {
      value = schema.default;
      logger.debug(`📋 Using default value for ${schema.env}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    }
    
    // Convert type if specified
    if (value && schema.type) {
      try {
        value = convertType(value, schema.type);
      } catch (error) {
        errors.push(`Invalid ${schema.type} value for ${schema.env}: ${error.message}`);
        continue;
      }
    }
    
    // Validate value if validator is provided
    if (value && schema.validate) {
      try {
        validateConfigValue(key, value, schema);
      } catch (error) {
        errors.push(`Configuration validation failed for ${schema.env}: ${error.message}`);
        continue;
      }
    }
    
    config[key] = value;
  }
  
  // Additional validation using validation utilities
  const validationResult = validateAndSanitizeConfig(config);
  if (!validationResult.isValid) {
    errors.push(...validationResult.errors);
  } else {
    // Use sanitized config
    Object.assign(config, validationResult.sanitizedConfig);
  }
  
  // Report configuration errors
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    logValidationErrors('configuration', errors);
    console.error('\n💡 Please check your .env file or environment variables.');
    console.error('📋 See .env.example for required configuration.');
    
    // Provide specific guidance for common issues
    if (errors.some(e => e.includes('GROQ_API_KEY'))) {
      console.error('\n🔑 Groq API Key Help:');
      console.error('  • Get your API key from: https://console.groq.com/');
      console.error('  • API key should start with "gsk_"');
    }
    
    if (errors.some(e => e.includes('LARAVEL_API_BASE_URL'))) {
      console.error('\n🌐 Laravel API URL Help:');
      console.error('  • Ensure your Laravel API is running');
      console.error('  • URL should include /api path (e.g., http://localhost:8000/api)');
      console.error('  • Check network connectivity');
    }
    
    process.exit(1);
  }
  
  logger.info('✅ Configuration loaded and validated successfully');
  return config;
}

/**
 * Exported configuration object
 */
export const config = loadConfig();

/**
 * Validate system requirements and connectivity at startup
 */
export async function validateSystemRequirements() {
  logger.info('🔍 Validating system requirements...');
  
  const issues = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    issues.push(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
  } else {
    logger.debug(`✅ Node.js version ${nodeVersion} is supported`);
  }
  
  // Check required dependencies
  try {
    await import('axios');
    logger.debug('✅ axios dependency available');
  } catch (error) {
    issues.push('axios dependency is not installed');
  }
  
  try {
    await import('cheerio');
    logger.debug('✅ cheerio dependency available');
  } catch (error) {
    issues.push('cheerio dependency is not installed');
  }
  
  try {
    await import('puppeteer');
    logger.debug('✅ puppeteer dependency available');
  } catch (error) {
    issues.push('puppeteer dependency is not installed');
  }
  
  try {
    await import('google-it');
    logger.debug('✅ google-it dependency available');
  } catch (error) {
    issues.push('google-it dependency is not installed');
  }
  
  // Test network connectivity (basic check)
  try {
    const { default: axios } = await import('axios');
    await axios.get('https://www.google.com', { timeout: 5000 });
    logger.debug('✅ Network connectivity available');
  } catch (error) {
    logger.warn('⚠️ Network connectivity test failed - this may affect web scraping');
  }
  
  // Report issues
  if (issues.length > 0) {
    logger.error('❌ System requirements validation failed:');
    issues.forEach((issue, index) => {
      logger.error(`  ${index + 1}. ${issue}`);
    });
    
    logger.error('\n💡 To fix these issues:');
    logger.error('  • Run: npm install');
    logger.error('  • Ensure Node.js 18+ is installed');
    logger.error('  • Check network connectivity');
    
    throw new Error('System requirements not met');
  }
  
  logger.info('✅ System requirements validation passed');
}

/**
 * Test API connectivity at startup
 */
export async function testApiConnectivity() {
  logger.info('🌐 Testing API connectivity...');
  
  const { default: axios } = await import('axios');
  const issues = [];
  
  // Test Laravel API connectivity
  try {
    const response = await axios.get(`${config.laravelApiBaseUrl}/articles`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        ...(config.laravelApiKey && { 'Authorization': `Bearer ${config.laravelApiKey}` }),
      },
    });
    
    if (response.status === 200) {
      logger.info('✅ Laravel API connectivity test passed');
    } else {
      logger.warn(`Laravel API returned status ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      issues.push(`Laravel API error (${error.response.status}): ${error.response.statusText}`);
    } else if (error.code === 'ECONNREFUSED') {
      issues.push('Laravel API connection refused - is the server running?');
    } else if (error.code === 'ETIMEDOUT') {
      issues.push('Laravel API connection timeout - check URL and network');
    } else {
      issues.push(`Laravel API error: ${error.message}`);
    }
  }
  
  // Test Groq API connectivity
  try {
    const response = await axios.post(
      `${config.groqApiBaseUrl}/chat/completions`,
      {
        model: config.groqModel,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      },
      {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${config.groqApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.status === 200) {
      logger.info('✅ Groq API connectivity test passed');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      issues.push('Groq API authentication failed - check your API key');
    } else if (error.response?.status === 429) {
      logger.warn('Groq API rate limit reached - this is normal during testing');
    } else if (error.response) {
      issues.push(`Groq API error (${error.response.status}): ${error.response.statusText}`);
    } else {
      issues.push(`Groq API error: ${error.message}`);
    }
  }
  
  // Report connectivity issues as warnings (not fatal)
  if (issues.length > 0) {
    logger.warn('⚠️ API connectivity issues detected:');
    issues.forEach((issue, index) => {
      logger.warn(`  ${index + 1}. ${issue}`);
    });
    logger.warn('\n💡 The application may still work, but some features might fail.');
    logger.warn('Please check your configuration and network connectivity.');
  }
}

/**
 * Log configuration summary (without sensitive data)
 */
function logConfigSummary() {
  const safeConfig = { ...config };
  
  // Mask sensitive values
  if (safeConfig.groqApiKey) {
    safeConfig.groqApiKey = `${safeConfig.groqApiKey.substring(0, 8)}...`;
  }
  if (safeConfig.laravelApiKey) {
    safeConfig.laravelApiKey = safeConfig.laravelApiKey ? '***' : '(not set)';
  }
  
  logger.debug('📋 Configuration loaded:', safeConfig);
}

// Log configuration on module load (only in debug mode)
if (config.logLevel === 'debug') {
  logConfigSummary();
}
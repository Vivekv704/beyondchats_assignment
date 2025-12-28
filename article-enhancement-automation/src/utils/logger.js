/**
 * Logging Utility Module
 * 
 * Provides structured logging with multiple levels and configurable output formats
 * Supports both JSON and simple text formats for different environments
 * Includes performance tracking, request correlation, and log rotation support
 */

import fs from 'fs';
import path from 'path';

/**
 * Log levels with numeric priorities
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get current log level from environment or default to 'info'
 */
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const logFormat = process.env.LOG_FORMAT || 'json';

/**
 * Performance tracking for operations
 */
const performanceTrackers = new Map();

/**
 * Request correlation ID for tracking related log entries
 */
let currentCorrelationId = null;

/**
 * Log file configuration
 */
const LOG_DIR = 'logs';
const LOG_FILE = path.join(LOG_DIR, 'application.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

/**
 * Ensure log directory exists
 */
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Format timestamp for logging
 */
function formatTimestamp() {
  return new Date().toISOString();
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Format log message based on configured format
 */
function formatMessage(level, message, ...args) {
  const timestamp = formatTimestamp();
  
  if (logFormat === 'json') {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      pid: process.pid,
    };
    
    // Add correlation ID if present
    if (currentCorrelationId) {
      logEntry.correlationId = currentCorrelationId;
    }
    
    // Add additional arguments as metadata
    if (args.length > 0) {
      logEntry.metadata = args.map(arg => {
        // Handle Error objects specially
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
          };
        }
        return arg;
      });
    }
    
    return JSON.stringify(logEntry);
  } else {
    // Simple text format
    const correlationStr = currentCorrelationId ? ` [${currentCorrelationId}]` : '';
    const argsStr = args.length > 0 ? ` ${args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ')}` : '';
    
    return `[${timestamp}]${correlationStr} ${level.toUpperCase()}: ${message}${argsStr}`;
  }
}

/**
 * Write log to file
 */
function writeToFile(level, formattedMessage) {
  if (process.env.NODE_ENV === 'test') return; // Don't write files during tests
  
  try {
    ensureLogDirectory();
    
    // Write to main log file
    fs.appendFileSync(LOG_FILE, formattedMessage + '\n');
    
    // Write errors to separate error log
    if (level === 'error') {
      fs.appendFileSync(ERROR_LOG_FILE, formattedMessage + '\n');
    }
  } catch (error) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Generic log function
 */
function log(level, message, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const formattedMessage = formatMessage(level, message, ...args);
    
    // Write to file
    writeToFile(level, formattedMessage);
    
    // Use appropriate console method based on level
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }
}

/**
 * Logger object with level-specific methods
 */
export const logger = {
  /**
   * Debug level logging - detailed information for debugging
   */
  debug: (message, ...args) => log('debug', message, ...args),
  
  /**
   * Info level logging - general information about application flow
   */
  info: (message, ...args) => log('info', message, ...args),
  
  /**
   * Warning level logging - potentially harmful situations
   */
  warn: (message, ...args) => log('warn', message, ...args),
  
  /**
   * Error level logging - error events that might still allow the application to continue
   */
  error: (message, ...args) => log('error', message, ...args),
  
  /**
   * Log progress updates (only if progress updates are enabled)
   */
  progress: (message, ...args) => {
    if (process.env.PROGRESS_UPDATES !== 'false') {
      log('info', `🔄 ${message}`, ...args);
    }
  },
  
  /**
   * Log success messages
   */
  success: (message, ...args) => log('info', `✅ ${message}`, ...args),
  
  /**
   * Log failure messages
   */
  failure: (message, ...args) => log('error', `❌ ${message}`, ...args),
  
  /**
   * Log step completion
   */
  step: (stepName, message, ...args) => {
    log('info', `📍 [${stepName}] ${message}`, ...args);
  },
  
  /**
   * Start performance tracking for an operation
   */
  startTimer: (operationName) => {
    const startTime = process.hrtime.bigint();
    performanceTrackers.set(operationName, startTime);
    log('debug', `⏱️ Started timer for: ${operationName}`);
    return operationName;
  },
  
  /**
   * End performance tracking and log duration
   */
  endTimer: (operationName) => {
    const startTime = performanceTrackers.get(operationName);
    if (startTime) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      performanceTrackers.delete(operationName);
      log('info', `⏱️ ${operationName} completed in ${duration.toFixed(2)}ms`);
      return duration;
    } else {
      log('warn', `⏱️ No timer found for operation: ${operationName}`);
      return null;
    }
  },
  
  /**
   * Set correlation ID for request tracking
   */
  setCorrelationId: (id) => {
    currentCorrelationId = id || generateCorrelationId();
    return currentCorrelationId;
  },
  
  /**
   * Clear correlation ID
   */
  clearCorrelationId: () => {
    currentCorrelationId = null;
  },
  
  /**
   * Get current correlation ID
   */
  getCorrelationId: () => currentCorrelationId,
  
  /**
   * Log HTTP request details
   */
  httpRequest: (method, url, status, duration) => {
    const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    log('info', `${statusEmoji} ${method.toUpperCase()} ${url} - ${status} (${duration}ms)`);
  },
  
  /**
   * Log API call details
   */
  apiCall: (service, operation, success, duration, details = {}) => {
    const emoji = success ? '✅' : '❌';
    const message = `${emoji} ${service} ${operation} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;
    log(success ? 'info' : 'error', message, details);
  },
  
  /**
   * Log workflow step
   */
  workflow: (step, status, details = {}) => {
    const emoji = status === 'start' ? '🚀' : status === 'complete' ? '✅' : status === 'error' ? '❌' : '🔄';
    log(status === 'error' ? 'error' : 'info', `${emoji} Workflow: ${step} - ${status.toUpperCase()}`, details);
  },
  
  /**
   * Create a child logger with additional context
   */
  child: (context) => {
    return {
      debug: (message, ...args) => log('debug', `[${context}] ${message}`, ...args),
      info: (message, ...args) => log('info', `[${context}] ${message}`, ...args),
      warn: (message, ...args) => log('warn', `[${context}] ${message}`, ...args),
      error: (message, ...args) => log('error', `[${context}] ${message}`, ...args),
    };
  },
};
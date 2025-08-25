/**
 * Comprehensive Logging Configuration for Messenger API
 * This file provides structured logging and debugging capabilities
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

// Current log level (can be set via environment variable)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

// Color codes for console output
const COLORS = {
    RESET: '\x1b[0m',
    BRIGHT: '\x1b[1m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m'
};

// Emoji indicators for different log types
const EMOJIS = {
    ERROR: '❌',
    WARN: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🔍',
    TRACE: '🔎',
    SUCCESS: '✅',
    START: '🚀',
    END: '🏁',
    API: '📡',
    WEBHOOK: '📱',
    MESSAGE: '💬',
    USER: '👤',
    TIME: '⏱️'
};

class Logger {
    constructor() {
        this.logFile = path.join(logsDir, 'app.log');
        this.errorLogFile = path.join(logsDir, 'errors.log');
        this.accessLogFile = path.join(logsDir, 'access.log');
    }

    /**
     * Get timestamp for logging
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message with timestamp and level
     */
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const emoji = EMOJIS[level] || '';
        const levelStr = level.padEnd(5);
        
        let formattedMessage = `[${timestamp}] ${emoji} ${levelStr} ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
            } else {
                formattedMessage += ` | ${data}`;
            }
        }
        
        return formattedMessage;
    }

    /**
     * Write log to file
     */
    writeToFile(filename, message) {
        try {
            fs.appendFileSync(filename, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Get color for log level
     */
    getColor(level) {
        switch (level) {
            case 'ERROR': return COLORS.RED;
            case 'WARN': return COLORS.YELLOW;
            case 'INFO': return COLORS.BLUE;
            case 'DEBUG': return COLORS.CYAN;
            case 'TRACE': return COLORS.MAGENTA;
            case 'SUCCESS': return COLORS.GREEN;
            default: return COLORS.WHITE;
        }
    }

    /**
     * Log message with appropriate level
     */
    log(level, message, data = null) {
        const levelNum = LOG_LEVELS[level] || 0;
        const currentLevelNum = LOG_LEVELS[CURRENT_LOG_LEVEL] || 2;
        
        if (levelNum <= currentLevelNum) {
            const formattedMessage = this.formatMessage(level, message, data);
            const color = this.getColor(level);
            
            // Console output
            console.log(`${color}${formattedMessage}${COLORS.RESET}`);
            
            // File logging
            this.writeToFile(this.logFile, formattedMessage);
            
            // Error-specific logging
            if (level === 'ERROR') {
                this.writeToFile(this.errorLogFile, formattedMessage);
            }
        }
    }

    /**
     * Log error with stack trace
     */
    error(message, error = null, context = null) {
        let errorData = { message };
        
        if (error) {
            errorData = {
                ...errorData,
                errorType: error.constructor.name,
                errorMessage: error.message,
                stack: error.stack,
                code: error.code,
                status: error.status,
                statusCode: error.statusCode
            };
        }
        
        if (context) {
            errorData.context = context;
        }
        
        this.log('ERROR', message, errorData);
    }

    /**
     * Log warning
     */
    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    /**
     * Log info
     */
    info(message, data = null) {
        this.log('INFO', message, data);
    }

    /**
     * Log debug
     */
    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    /**
     * Log trace (most detailed)
     */
    trace(message, data = null) {
        this.log('TRACE', message, data);
    }

    /**
     * Log success
     */
    success(message, data = null) {
        this.log('SUCCESS', message, data);
    }

    /**
     * Log API request
     */
    apiRequest(method, endpoint, params = null) {
        this.info(`${EMOJIS.API} API Request: ${method} ${endpoint}`, {
            method,
            endpoint,
            params: params ? this.sanitizeParams(params) : null,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log API response
     */
    apiResponse(method, endpoint, status, responseTime, data = null) {
        this.info(`${EMOJIS.API} API Response: ${method} ${endpoint}`, {
            method,
            endpoint,
            status,
            responseTime: `${responseTime}ms`,
            dataSize: data ? JSON.stringify(data).length : 0,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log webhook event
     */
    webhookEvent(type, platform, data = null) {
        this.info(`${EMOJIS.WEBHOOK} Webhook Event: ${type}`, {
            type,
            platform,
            data: data ? this.sanitizeWebhookData(data) : null,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log message processing
     */
    messageProcessing(senderId, messageType, content = null) {
        this.info(`${EMOJIS.MESSAGE} Message Processing`, {
            senderId,
            messageType,
            content: content ? this.sanitizeMessageContent(content) : null,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log user interaction
     */
    userInteraction(userId, action, details = null) {
        this.info(`${EMOJIS.USER} User Interaction`, {
            userId,
            action,
            details,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration, metadata = null) {
        this.info(`${EMOJIS.TIME} Performance: ${operation}`, {
            operation,
            duration: `${duration}ms`,
            metadata,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Start operation logging
     */
    startOperation(operation, data = null) {
        this.info(`${EMOJIS.START} ${operation} Started`, {
            operation,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * End operation logging
     */
    endOperation(operation, result = null, duration = null) {
        const logData = {
            operation,
            timestamp: this.getTimestamp()
        };
        
        if (result) logData.result = result;
        if (duration) logData.duration = `${duration}ms`;
        
        this.info(`${EMOJIS.END} ${operation} Completed`, logData);
    }

    /**
     * Sanitize parameters for logging (remove sensitive data)
     */
    sanitizeParams(params) {
        if (!params) return params;
        
        const sanitized = { ...params };
        if (sanitized.access_token) {
            sanitized.access_token = sanitized.access_token.substring(0, 10) + '...';
        }
        if (sanitized.password) {
            sanitized.password = '***';
        }
        return sanitized;
    }

    /**
     * Sanitize webhook data for logging
     */
    sanitizeWebhookData(data) {
        if (!data) return data;
        
        const sanitized = { ...data };
        if (sanitized.entry) {
            sanitized.entry = sanitized.entry.map(entry => ({
                id: entry.id,
                time: entry.time,
                messagingCount: entry.messaging ? entry.messaging.length : 0
            }));
        }
        return sanitized;
    }

    /**
     * Sanitize message content for logging
     */
    sanitizeMessageContent(content) {
        if (!content) return content;
        
        if (typeof content === 'string') {
            return content.length > 100 ? content.substring(0, 100) + '...' : content;
        }
        
        if (content.text) {
            content.text = content.text.length > 100 ? content.text.substring(0, 100) + '...' : content.text;
        }
        
        return content;
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        try {
            const stats = {
                appLogSize: fs.existsSync(this.logFile) ? fs.statSync(this.logFile).size : 0,
                errorLogSize: fs.existsSync(this.errorLogFile) ? fs.statSync(this.errorLogFile).size : 0,
                accessLogSize: fs.existsSync(this.accessLogFile) ? fs.statSync(this.accessLogFile).size : 0,
                logLevel: CURRENT_LOG_LEVEL,
                timestamp: this.getTimestamp()
            };
            
            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Clear log files
     */
    clearLogs() {
        try {
            if (fs.existsSync(this.logFile)) {
                fs.writeFileSync(this.logFile, '');
            }
            if (fs.existsSync(this.errorLogFile)) {
                fs.writeFileSync(this.errorLogFile, '');
            }
            if (fs.existsSync(this.accessLogFile)) {
                fs.writeFileSync(this.accessLogFile, '');
            }
            this.info('Log files cleared');
        } catch (error) {
            this.error('Failed to clear log files', error);
        }
    }
}

// Create and export logger instance
const logger = new Logger();

// Export logger and configuration
module.exports = {
    Logger,
    logger,
    LOG_LEVELS,
    COLORS,
    EMOJIS,
    CURRENT_LOG_LEVEL
};

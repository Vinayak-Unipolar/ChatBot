/**
 * Browser Console Logging Utility for Messenger API
 * This file provides enhanced logging capabilities in the browser console
 */

class BrowserLogger {
    constructor() {
        this.isEnabled = true;
        this.logLevel = 'INFO';
        this.requestId = null;
        this.sessionId = this.generateSessionId();
        
        // Initialize browser console logging
        this.init();
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Initialize the logger
     */
    init() {
        if (typeof window !== 'undefined') {
            // Add logger to window object for global access
            window.messengerLogger = this;
            
            // Log initialization
            this.info('🌐 Messenger API Browser Logger Initialized', {
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            
            // Add console styling
            this.addConsoleStyles();
        }
    }

    /**
     * Add custom console styling
     */
    addConsoleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .messenger-log {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                line-height: 1.4;
            }
            .messenger-log-timestamp {
                color: #666;
                font-weight: bold;
            }
            .messenger-log-level {
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 3px;
                margin: 0 4px;
            }
            .messenger-log-level-info { background: #e3f2fd; color: #1976d2; }
            .messenger-log-level-success { background: #e8f5e8; color: #388e3c; }
            .messenger-log-level-warn { background: #fff3e0; color: #f57c00; }
            .messenger-log-level-error { background: #ffebee; color: #d32f2f; }
            .messenger-log-level-debug { background: #f3e5f5; color: #7b1fa2; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get timestamp for logging
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Get log level color
     */
    getLogLevelColor(level) {
        const colors = {
            INFO: '#1976d2',
            SUCCESS: '#388e3c',
            WARN: '#f57c00',
            ERROR: '#d32f2f',
            DEBUG: '#7b1fa2'
        };
        return colors[level] || '#666';
    }

    /**
     * Format log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const sessionInfo = `[${this.sessionId}]`;
        const levelInfo = `[${level}]`;
        
        let formattedMessage = `%c${sessionInfo} %c${levelInfo} %c${message}`;
        
        const styles = [
            'color: #666; font-weight: bold;',
            `color: ${this.getLogLevelColor(level)}; font-weight: bold; background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px;`,
            'color: #333;'
        ];
        
        return { message: formattedMessage, styles };
    }

    /**
     * Log message with appropriate level
     */
    log(level, message, data = null) {
        if (!this.isEnabled) return;
        
        const { message: formattedMessage, styles } = this.formatMessage(level, message, data);
        
        // Log to console with styling
        if (data) {
            console.group(formattedMessage, ...styles);
            console.log('📊 Data:', data);
            console.log('⏰ Timestamp:', this.getTimestamp());
            console.log('🆔 Session ID:', this.sessionId);
            if (this.requestId) {
                console.log('🔗 Request ID:', this.requestId);
            }
            console.groupEnd();
        } else {
            console.log(formattedMessage, ...styles);
        }
        
        // Store in session storage for debugging
        this.storeLog(level, message, data);
    }

    /**
     * Store log in session storage
     */
    storeLog(level, message, data) {
        try {
            const logs = JSON.parse(sessionStorage.getItem('messengerLogs') || '[]');
            logs.push({
                timestamp: this.getTimestamp(),
                level,
                message,
                data,
                sessionId: this.sessionId,
                requestId: this.requestId,
                url: window.location.href
            });
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            sessionStorage.setItem('messengerLogs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Failed to store log:', error);
        }
    }

    /**
     * Log info message
     */
    info(message, data = null) {
        this.log('INFO', message, data);
    }

    /**
     * Log success message
     */
    success(message, data = null) {
        this.log('SUCCESS', message, data);
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    /**
     * Log error message
     */
    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    /**
     * Log debug message
     */
    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    /**
     * Log API request
     */
    apiRequest(method, url, data = null) {
        this.info(`📡 API Request: ${method} ${url}`, {
            method,
            url,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log API response
     */
    apiResponse(method, url, status, data = null, duration = null) {
        const responseData = {
            method,
            url,
            status,
            duration: duration ? `${duration}ms` : 'Unknown',
            timestamp: this.getTimestamp()
        };
        
        if (data && data._logging) {
            responseData.serverLogging = data._logging;
            this.requestId = data._logging.requestId;
        }
        
        if (status >= 200 && status < 300) {
            this.success(`📡 API Response: ${method} ${url} | Status: ${status}`, responseData);
        } else if (status >= 400 && status < 500) {
            this.warn(`📡 API Response: ${method} ${url} | Status: ${status}`, responseData);
        } else if (status >= 500) {
            this.error(`📡 API Response: ${method} ${url} | Status: ${status}`, responseData);
        } else {
            this.info(`📡 API Response: ${method} ${url} | Status: ${status}`, responseData);
        }
    }

    /**
     * Log webhook event
     */
    webhookEvent(event, data = null) {
        this.info(`📱 Webhook Event: ${event}`, {
            event,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log message processing
     */
    messageProcessing(action, userId, data = null) {
        this.info(`💬 Message Processing: ${action}`, {
            action,
            userId,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log user interaction
     */
    userInteraction(userId, action, data = null) {
        this.info(`👤 User Interaction: ${action}`, {
            userId,
            action,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration, data = null) {
        this.info(`⏱️ Performance: ${operation}`, {
            operation,
            duration: `${duration}ms`,
            data,
            timestamp: this.getTimestamp()
        });
    }

    /**
     * Start operation logging
     */
    startOperation(operation, data = null) {
        this.info(`🚀 Operation Started: ${operation}`, {
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
        
        this.info(`🏁 Operation Completed: ${operation}`, logData);
    }

    /**
     * Get stored logs
     */
    getLogs() {
        try {
            return JSON.parse(sessionStorage.getItem('messengerLogs') || '[]');
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear stored logs
     */
    clearLogs() {
        try {
            sessionStorage.removeItem('messengerLogs');
            this.info('Logs cleared from session storage');
        } catch (error) {
            this.warn('Failed to clear logs:', error);
        }
    }

    /**
     * Export logs
     */
    exportLogs() {
        try {
            const logs = this.getLogs();
            const dataStr = JSON.stringify(logs, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `messenger-logs-${this.sessionId}-${Date.now()}.json`;
            link.click();
            
            this.success('Logs exported successfully');
        } catch (error) {
            this.error('Failed to export logs:', error);
        }
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set log level
     */
    setLogLevel(level) {
        this.logLevel = level;
        this.info(`Log level set to: ${level}`);
    }

    /**
     * Get logger status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            logLevel: this.logLevel,
            sessionId: this.sessionId,
            requestId: this.requestId,
            logCount: this.getLogs().length,
            timestamp: this.getTimestamp()
        };
    }
}

// Auto-initialize logger when script loads
if (typeof window !== 'undefined') {
    const logger = new BrowserLogger();
    
    // Add utility functions to window
    window.messengerLoggerUtils = {
        getLogs: () => logger.getLogs(),
        clearLogs: () => logger.clearLogs(),
        exportLogs: () => logger.exportLogs(),
        getStatus: () => logger.getStatus(),
        setEnabled: (enabled) => logger.setEnabled(enabled),
        setLogLevel: (level) => logger.setLogLevel(level)
    };
    
    // Log available utilities
    logger.info('🔧 Messenger Logger Utilities Available', {
        utilities: Object.keys(window.messengerLoggerUtils),
        usage: 'Use window.messengerLoggerUtils to access logging utilities'
    });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserLogger;
}

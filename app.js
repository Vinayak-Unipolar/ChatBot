require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Platforms, Messenger } = require('./messenger');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced console logging with timestamps and structured format
const log = {
    info: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ℹ️  INFO: ${message}`;
        console.log(logMessage);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    },
    success: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ✅ SUCCESS: ${message}`;
        console.log(logMessage);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    },
    warn: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ⚠️  WARN: ${message}`;
        console.warn(logMessage);
        if (data) console.warn('   Data:', JSON.stringify(data, null, 2));
    },
    error: (message, error = null, context = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ❌ ERROR: ${message}`;
        console.error(logMessage);
        if (error) {
            console.error('   Error Type:', error.constructor.name);
            console.error('   Error Message:', error.message);
            console.error('   Error Stack:', error.stack);
            if (error.code) console.error('   Error Code:', error.code);
            if (error.status) console.error('   Error Status:', error.status);
        }
        if (context) console.error('   Context:', JSON.stringify(context, null, 2));
    },
    debug: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] 🔍 DEBUG: ${message}`;
        console.log(logMessage);
        if (data) console.log('   Data:', JSON.stringify(data, null, 2));
    },
    api: (method, endpoint, status, duration, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] 📡 API: ${method} ${endpoint} | Status: ${status} | Duration: ${duration}ms`;
        console.log(logMessage);
        if (data) console.log('   Response:', JSON.stringify(data, null, 2));
    },
    webhook: (event, platform, data = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] 📱 WEBHOOK: ${event} | Platform: ${platform}`;
        console.log(logMessage);
        if (data) console.log('   Payload:', JSON.stringify(data, null, 2));
    },
    message: (action, userId, content = null) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] 💬 MESSAGE: ${action} | User: ${userId}`;
        console.log(logMessage);
        if (content) console.log('   Content:', JSON.stringify(content, null, 2));
    }
};

log.info('=== SERVER INITIALIZATION START ===');
log.info('Loading environment variables...');

// Environment variables check
const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    PORT: process.env.PORT || 'Default (3000)',
    PAGE_ID: process.env.PAGE_ID ? `Set (${process.env.PAGE_ID})` : 'NOT SET',
    PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN ? 'Set (first 10 chars: ' + process.env.PAGE_ACCESS_TOKEN.substring(0, 10) + '...)' : 'NOT SET',
    VERIFY_TOKEN: process.env.VERIFY_TOKEN ? 'Set' : 'NOT SET',
    INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME || 'Not set'
};

log.info('Environment variables status:', envCheck);

// Middleware
log.info('Setting up middleware...');
app.use(cors());
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(bodyParser.urlencoded({ extended: true }));

// Add response logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log incoming request
    log.info(`Incoming ${req.method} request`, {
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        ip: req.ip
    });
    
    // Override res.json to log responses
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        log.api(req.method, req.url, res.statusCode, duration, data);
        
        // Add logging headers for browser console
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Request-ID', Date.now().toString());
        
        // Log to browser console if response contains logging info
        if (data && typeof data === 'object') {
            data._logging = {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            };
        }
        
        return originalJson.call(this, data);
    };
    
    next();
});

log.info('Middleware setup complete');

// Initialize Messenger instances
log.info('Initializing Messenger instances...');
let messenger, instagram;

try {
    messenger = new Messenger(Platforms.Messenger, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);
    log.success('Messenger instance created successfully');
} catch (error) {
    log.error('Failed to create Messenger instance', error);
    messenger = null;
}

try {
    instagram = new Messenger(Platforms.Instagram, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);
    log.success('Instagram instance created successfully');
} catch (error) {
    log.error('Failed to create Instagram instance', error);
    instagram = null;
}

log.info('=== SERVER INITIALIZATION COMPLETE ===');

// Verify request signature for security
function verifyRequestSignature(req, res, buf) {
    log.debug('=== REQUEST SIGNATURE VERIFICATION ===');
    const signature = req.headers['x-hub-signature-256'];
    const userAgent = req.headers['user-agent'];
    const contentType = req.headers['content-type'];
    
    log.debug('Request signature verification details', {
        method: req.method,
        url: req.url,
        contentType: contentType,
        userAgent: userAgent,
        hasSignature: !!signature,
        signatureLength: signature ? signature.length : 0
    });
    
    if (!signature) {
        log.warn('No signature provided in headers');
        log.debug('Available headers:', Object.keys(req.headers));
        return;
    }
    
    // In production, you should verify the signature using crypto
    // This is a simplified version for demonstration
    log.success('Request signature verified (simplified)');
    log.debug('Signature preview:', signature.substring(0, 20) + '...');
}

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    log.webhook('VERIFICATION_REQUEST', 'facebook', req.query);
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    log.debug('Webhook verification parameters', {
        mode: mode,
        token: token ? 'Provided' : 'Missing',
        challenge: challenge ? 'Provided' : 'Missing',
        expectedToken: process.env.VERIFY_TOKEN ? 'Set' : 'NOT SET'
    });
    
    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            log.success('Webhook verified successfully');
            log.debug('Challenge response sent:', challenge);
            res.status(200).send(challenge);
        } else {
            log.error('Webhook verification failed', null, {
                expectedMode: 'subscribe',
                receivedMode: mode,
                expectedToken: process.env.VERIFY_TOKEN,
                receivedToken: token
            });
            res.sendStatus(403);
        }
    } else {
        log.error('Invalid webhook verification request', null, {
            missingMode: !mode,
            missingToken: !token
        });
        res.sendStatus(400);
    }
});

// Webhook endpoint for receiving messages
app.post('/webhook', async (req, res) => {
    log.webhook('MESSAGE_RECEIVED', req.body.object || 'unknown', req.body);
    
    const body = req.body;
    const headers = req.headers;
    
    log.debug('Webhook headers', {
        'x-hub-signature-256': headers['x-hub-signature-256'] ? 'Present' : 'Missing',
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent']
    });
    
    log.debug('Webhook body structure', {
        objectType: body.object,
        entryCount: body.entry ? body.entry.length : 'No entries'
    });
    
    if (body.object === 'page') {
        log.info('📱 Processing Facebook Messenger webhook...');
        try {
            for (const entry of body.entry) {
                log.debug('Processing webhook entry', {
                    id: entry.id,
                    time: entry.time,
                    messagingCount: entry.messaging ? entry.messaging.length : 0
                });
                
                const webhookEvent = entry.messaging[0];
                
                if (webhookEvent) {
                    const senderId = webhookEvent.sender.id;
                    const message = webhookEvent.message;
                    const timestamp = webhookEvent.timestamp;
                    
                    log.message('RECEIVED', senderId, {
                        messageType: message ? Object.keys(message) : 'No message',
                        timestamp: timestamp,
                        hasText: message && message.text ? 'Yes' : 'No',
                        textLength: message && message.text ? message.text.length : 0
                    });
                    
                    if (message && message.text) {
                        log.debug('Message text content:', message.text);
                    }
                    
                    // Mark message as seen
                    log.debug('Marking message as seen...');
                    try {
                        await messenger.markAsSeen(senderId);
                        log.success('Message marked as seen');
                    } catch (error) {
                        log.error('Failed to mark message as seen', error);
                    }
                    
                    // Send typing indicator
                    log.debug('Sending typing indicator...');
                    try {
                        await messenger.sendTypingIndicator(senderId, true);
                        log.success('Typing indicator started');
                    } catch (error) {
                        log.error('Failed to start typing indicator', error);
                    }
                    
                    // Process the message and send response
                    log.debug('Processing message and generating response...');
                    await processMessage(senderId, message);
                    
                    // Stop typing indicator
                    log.debug('Stopping typing indicator...');
                    try {
                        await messenger.sendTypingIndicator(senderId, false);
                        log.success('Typing indicator stopped');
                    } catch (error) {
                        log.error('Failed to stop typing indicator', error);
                    }
                } else {
                    log.warn('No messaging event found in webhook entry');
                }
            }
            
            log.success('Webhook processing completed successfully');
            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            log.error('Webhook processing error', error);
            res.sendStatus(500);
        }
    } else if (body.object === 'instagram') {
        log.info('📸 Processing Instagram webhook...');
        // Handle Instagram webhooks
        try {
            for (const entry of body.entry) {
                log.debug('Processing Instagram webhook entry', {
                    id: entry.id,
                    time: entry.time,
                    messagingCount: entry.messaging ? entry.messaging.length : 0
                });
                
                const webhookEvent = entry.messaging[0];
                
                if (webhookEvent) {
                    const senderId = webhookEvent.sender.id;
                    const message = webhookEvent.message;
                    const timestamp = webhookEvent.timestamp;
                    
                    log.message('INSTAGRAM_RECEIVED', senderId, {
                        messageType: message ? Object.keys(message) : 'No message',
                        timestamp: timestamp,
                        hasText: message && message.text ? 'Yes' : 'No',
                        textLength: message && message.text ? message.text.length : 0
                    });
                    
                    if (message && message.text) {
                        log.debug('Instagram message text:', message.text);
                    }
                    
                    // Process Instagram message
                    log.debug('Processing Instagram message...');
                    await processInstagramMessage(senderId, message);
                } else {
                    log.warn('No Instagram messaging event found in webhook entry');
                }
            }
            
            log.success('Instagram webhook processing completed successfully');
            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            log.error('Instagram webhook processing error', error);
            res.sendStatus(500);
        }
    } else {
        log.error('Unknown webhook object type', null, {
            receivedType: body.object,
            availableTypes: Object.keys(body)
        });
        res.sendStatus(404);
    }
});

// Process incoming messages and generate responses
async function processMessage(senderId, message) {
    log.message('PROCESSING_START', senderId, message);
    
    try {
        if (message.text) {
            const text = message.text.toLowerCase();
            log.debug('Processing text message:', text);
            
            // Simple bot logic - you can expand this
            if (text.includes('hello') || text.includes('hi')) {
                log.debug('Sending greeting response...');
                const response = 'Hello! How can I help you today?';
                log.debug('Response text:', response);
                
                const result = await messenger.sendTextMessage(senderId, response);
                log.success('Greeting sent successfully', result);
            } else if (text.includes('help')) {
                log.debug('Sending help response with quick replies...');
                const quickReplies = [
                    {
                        content_type: 'text',
                        title: 'Get Started',
                        payload: 'GET_STARTED'
                    },
                    {
                        content_type: 'text',
                        title: 'Contact Support',
                        payload: 'CONTACT_SUPPORT'
                    },
                    {
                        content_type: 'text',
                        title: 'Learn More',
                        payload: 'LEARN_MORE'
                    }
                ];
                
                log.debug('Quick replies to send:', quickReplies);
                const result = await messenger.sendQuickReply(senderId, 'Here are some options to help you:', quickReplies);
                log.success('Help message with quick replies sent successfully', result);
            } else if (text.includes('button')) {
                log.debug('Sending button template response...');
                const buttons = [
                    {
                        type: 'web_url',
                        url: 'https://developers.facebook.com/docs/messenger-platform',
                        title: 'Visit Docs'
                    },
                    {
                        type: 'postback',
                        title: 'Get Started',
                        payload: 'GET_STARTED'
                    }
                ];
                
                log.debug('Buttons to send:', buttons);
                const result = await messenger.sendButtonTemplate(senderId, 'Check out these resources:', buttons);
                log.success('Button template sent successfully', result);
            } else {
                log.debug('Sending default response...');
                const response = 'Thanks for your message! I\'m here to help.';
                log.debug('Default response text:', response);
                
                const result = await messenger.sendTextMessage(senderId, response);
                log.success('Default response sent successfully', result);
            }
        } else {
            log.warn('Message has no text content', {
                messageKeys: Object.keys(message)
            });
        }
    } catch (error) {
        log.error('Error processing message', error, { senderId });
        
        try {
            log.debug('Attempting to send error message to user...');
            const errorResponse = 'Sorry, I encountered an error. Please try again.';
            await messenger.sendTextMessage(senderId, errorResponse);
            log.success('Error message sent to user');
        } catch (sendError) {
            log.error('Failed to send error message to user', sendError);
        }
    }
    
    log.message('PROCESSING_END', senderId);
}

// Process Instagram messages
async function processInstagramMessage(senderId, message) {
    log.message('INSTAGRAM_PROCESSING_START', senderId, message);
    
    try {
        if (message.text) {
            const text = message.text.toLowerCase();
            log.debug('Processing Instagram text message:', text);
            
            if (text.includes('hello') || text.includes('hi')) {
                log.debug('Sending Instagram greeting response...');
                const response = 'Hello from Instagram! 👋';
                log.debug('Instagram response text:', response);
                
                const result = await instagram.sendTextMessage(senderId, response);
                log.success('Instagram greeting sent successfully', result);
            } else {
                log.debug('Sending Instagram default response...');
                const response = 'Thanks for reaching out on Instagram!';
                log.debug('Instagram default response text:', response);
                
                const result = await instagram.sendTextMessage(senderId, response);
                log.success('Instagram default response sent successfully', result);
            }
        } else {
            log.warn('Instagram message has no text content', {
                messageKeys: Object.keys(message)
            });
        }
    } catch (error) {
        log.error('Error processing Instagram message', error, { senderId });
    }
    
    log.message('INSTAGRAM_PROCESSING_END', senderId);
}

// API Routes for manual message sending
app.post('/api/send-message', async (req, res) => {
    log.info('=== SEND MESSAGE API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    log.debug('Environment variables check', {
        pageId: process.env.PAGE_ID ? `Set (${process.env.PAGE_ID})` : 'NOT SET',
        pageAccessToken: process.env.PAGE_ACCESS_TOKEN ? `Set (${process.env.PAGE_ACCESS_TOKEN.substring(0, 10)}...)` : 'NOT SET',
        verifyToken: process.env.VERIFY_TOKEN ? 'Set' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV || 'Not set'
    });
    
    try {
        const { userId, message, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, message, platform });
        
        if (!userId || !message) {
            log.warn('Validation failed: missing userId or message', {
                received: { userId, message, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId or message',
                received: { userId, message, platform },
                _logging: {
                    timestamp: new Date().toISOString(),
                    requestId: Date.now().toString(),
                    validationError: 'Missing required fields',
                    serverInfo: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        version: '1.0.0'
                    }
                }
            };
            
            return res.status(400).json(errorResponse);
        }
        
        log.debug('Creating messenger instance for platform', { platform });
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        log.debug('Messenger instance validation', {
            hasSendTextMessage: typeof messengerInstance.sendTextMessage === 'function',
            hasSendImage: typeof messengerInstance.sendImage === 'function',
            instanceType: messengerInstance.constructor.name,
            platform: platform
        });
        
        log.debug('Attempting to send message...');
        const startTime = Date.now();
        const result = await messengerInstance.sendTextMessage(userId, message);
        const duration = Date.now() - startTime;
        
        log.success('Message sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId
        });
        
        log.info('=== SEND MESSAGE API REQUEST END ===');
        
        // Enhanced response with logging info
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                messageLength: message.length,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND MESSAGE API ERROR ===', error, {
            requestBody: req.body,
            userId: req.body.userId,
            platform: req.body.platform
        });
        
        const errorResponse = { 
            error: error.message, 
            errorType: error.constructor.name,
            errorCode: error.code,
            details: 'Check server logs for more information',
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                errorDetails: {
                    name: error.name,
                    code: error.code,
                    status: error.status,
                    statusCode: error.statusCode
                },
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

app.post('/api/send-image', async (req, res) => {
    log.info('=== SEND IMAGE API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, imageUrl, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, imageUrl, platform });
        
        if (!userId || !imageUrl) {
            log.warn('Validation failed: missing userId or imageUrl', {
                received: { userId, imageUrl, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId or imageUrl',
                received: { userId, imageUrl, platform },
                _logging: {
                    timestamp: new Date().toISOString(),
                    requestId: Date.now().toString(),
                    validationError: 'Missing required fields',
                    serverInfo: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        version: '1.0.0'
                    }
                }
            };
            
            return res.status(400).json(errorResponse);
        }
        
        log.debug('Creating messenger instance for platform', { platform });
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        log.debug('Attempting to send image...');
        const startTime = Date.now();
        const result = await messengerInstance.sendImage(userId, imageUrl);
        const duration = Date.now() - startTime;
        
        log.success('Image sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            imageUrl
        });
        
        log.info('=== SEND IMAGE API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                imageUrl: imageUrl,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND IMAGE API ERROR ===', error, {
            requestBody: req.body,
            userId: req.body.userId,
            platform: req.body.platform
        });
        
        const errorResponse = { 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information',
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                errorDetails: {
                    name: error.name,
                    code: error.code,
                    status: error.status
                },
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Get conversations
app.get('/api/conversations', async (req, res) => {
    log.info('=== GET CONVERSATIONS API REQUEST START ===');
    const { platform = 'messenger' } = req.query;
    log.debug('Platform requested', { platform });
    
    try {
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        log.debug('Messenger instance created for platform', { platform });
        
        log.debug('Attempting to get conversations...');
        const startTime = Date.now();
        const conversations = await messengerInstance.getConversations();
        const duration = Date.now() - startTime;
        
        log.success('Conversations retrieved successfully', {
            hasData: !!conversations,
            dataSize: conversations ? JSON.stringify(conversations).length : 0,
            duration: `${duration}ms`,
            platform
        });
        
        log.info('=== GET CONVERSATIONS API REQUEST END ===');
        
        const successResponse = { 
            ...conversations,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== GET CONVERSATIONS API ERROR ===', error, {
            platform: platform
        });
        
        const errorResponse = { 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information',
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                errorDetails: {
                    name: error.name,
                    code: error.code,
                    status: error.status
                },
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
    log.info('=== GET USER PROFILE API REQUEST START ===');
    const { userId } = req.params;
    const { platform = 'messenger' } = req.query;
    
    log.debug('Request parameters', { userId, platform });
    
    try {
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        log.debug('Messenger instance created for platform', { platform });
        
        log.debug('Attempting to get user profile...');
        const startTime = Date.now();
        const profile = await messengerInstance.getUserProfile(userId);
        const duration = Date.now() - startTime;
        
        log.success('User profile retrieved successfully', {
            hasData: !!profile,
            dataSize: profile ? JSON.stringify(profile).length : 0,
            duration: `${duration}ms`,
            platform,
            userId
        });
        
        log.info('=== GET USER PROFILE API REQUEST END ===');
        
        const successResponse = { 
            ...profile,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                userId: userId,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== GET USER PROFILE API ERROR ===', error, {
            userId: userId,
            platform: platform
        });
        
        const errorResponse = { 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information',
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                errorDetails: {
                    name: error.name,
                    code: error.code,
                    status: error.status
                },
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    log.info('=== HEALTH CHECK REQUEST ===');
    
    const healthData = {
        status: 'OK', 
        timestamp: new Date().toISOString(),
        platform: 'Messenger API Express Server',
        environment: {
            pageId: process.env.PAGE_ID ? 'Set' : 'Not Set',
            pageAccessToken: process.env.PAGE_ACCESS_TOKEN ? 'Set' : 'Not Set',
            verifyToken: process.env.VERIFY_TOKEN ? 'Set' : 'Not Set',
            nodeEnv: process.env.NODE_ENV || 'Not set'
        },
        instances: {
            messenger: messenger && typeof messenger.sendTextMessage === 'function' ? 'Ready' : 'Not Ready',
            instagram: instagram && typeof instagram.sendTextMessage === 'function' ? 'Ready' : 'Not Ready'
        },
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '1.0.0',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        }
    };
    
    log.success('Health check completed', healthData);
    log.info('=== HEALTH CHECK END ===');
    
    res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
    const rootData = {
        message: 'Facebook Messenger Platform API Server',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook',
            sendMessage: '/api/send-message',
            sendImage: '/api/send-image',
            conversations: '/api/conversations',
            userProfile: '/api/user/:userId',
            health: '/health'
        },
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '1.0.0'
            }
        }
    };
    
    res.json(rootData);
});

// Error handling middleware
app.use((error, req, res, next) => {
    log.error('=== UNHANDLED ERROR MIDDLEWARE ===', error, {
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers,
        requestBody: req.body
    });
    
    const errorResponse = { 
        error: 'Internal server error',
        errorType: error.constructor.name,
        message: error.message,
        details: 'Check server logs for more information',
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            errorDetails: {
                name: error.name,
                code: error.code,
                status: error.status,
                stack: error.stack
            },
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '1.0.0'
            }
        }
    };
    
    res.status(500).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
    log.warn('=== 404 NOT FOUND ===', {
        requestUrl: req.url,
        requestMethod: req.method,
        requestHeaders: req.headers
    });
    
    const notFoundResponse = { 
        error: 'Endpoint not found',
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            requestedUrl: req.url,
            availableEndpoints: [
                '/webhook',
                '/api/send-message',
                '/api/send-image',
                '/api/conversations',
                '/api/user/:userId',
                '/health'
            ],
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '1.0.0'
            }
        }
    };
    
    res.status(404).json(notFoundResponse);
});

// Start server
app.listen(PORT, () => {
    log.info('=== SERVER STARTUP ===');
    log.success(`🚀 Messenger API Server running on port ${PORT}`);
    log.info(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    log.info(`🔗 Health Check: http://localhost:${PORT}/health`);
    
    log.info('Environment variables check:', envCheck);
    
    // Test messenger instances
    try {
        if (messenger && typeof messenger.sendTextMessage === 'function') {
            log.success('✅ Messenger instance initialized successfully');
        } else {
            log.error('❌ Messenger instance failed to initialize properly');
        }
    } catch (e) {
        log.error('❌ Error checking messenger instance', e);
    }
    
    try {
        if (instagram && typeof instagram.sendTextMessage === 'function') {
            log.success('✅ Instagram instance initialized successfully');
        } else {
            log.error('❌ Instagram instance failed to initialize properly');
        }
    } catch (e) {
        log.error('❌ Error checking instagram instance', e);
    }
    
    if (!process.env.PAGE_ID || !process.env.PAGE_ACCESS_TOKEN) {
        log.warn('⚠️  Missing required environment variables. Please check your .env file.');
        log.warn('   This will cause API endpoints to fail.');
    } else {
        log.success('✅ All required environment variables are set');
    }
    
    log.info('=== SERVER STARTUP COMPLETE ===');
    
    // Browser console logging instructions
    log.info('🌐 Browser Console Logging Enabled');
    log.info('   All API responses now include _logging object for debugging');
    log.info('   Check browser console for detailed response information');
});

module.exports = app;

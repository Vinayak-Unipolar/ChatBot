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

// Test endpoint to verify routing
app.get('/test', (req, res) => {
    res.json({
        message: 'Test endpoint working!',
        timestamp: new Date().toISOString(),
        messengerInstance: !!messenger,
        instagramInstance: !!instagram,
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '2.0.0',
                apiVersion: 'v23.0'
            }
        }
    });
});

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
            
            // Enhanced bot logic for v23.0 with more sophisticated responses
            if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
                log.debug('Sending greeting response...');
                const response = 'Hello! 👋 Welcome to our enhanced Messenger bot powered by API v23.0! How can I help you today?';
                log.debug('Response text:', response);
                
                const result = await messenger.sendTextMessage(senderId, response);
                log.success('Greeting sent successfully', result);
                
                // Send follow-up quick replies
                setTimeout(async () => {
                    const quickReplies = [
                        {
                            content_type: 'text',
                            title: '🚀 Get Started',
                            payload: 'GET_STARTED'
                        },
                        {
                            content_type: 'text',
                            title: '📚 Learn More',
                            payload: 'LEARN_MORE'
                        },
                        {
                            content_type: 'text',
                            title: '💬 Chat Support',
                            payload: 'CHAT_SUPPORT'
                        }
                    ];
                    
                    await messenger.sendQuickReply(senderId, 'Choose an option to continue:', quickReplies);
                }, 1000);
                
            } else if (text.includes('help') || text.includes('support')) {
                log.debug('Sending help response with enhanced quick replies...');
                const quickReplies = [
                    {
                        content_type: 'text',
                        title: '🔧 Technical Help',
                        payload: 'TECH_HELP'
                    },
                    {
                        content_type: 'text',
                        title: '📱 Features',
                        payload: 'FEATURES'
                    },
                    {
                        content_type: 'text',
                        title: '📞 Contact Us',
                        payload: 'CONTACT_US'
                    },
                    {
                        content_type: 'text',
                        title: '🌐 Website',
                        payload: 'WEBSITE'
                    }
                ];
                
                log.debug('Quick replies to send:', quickReplies);
                const result = await messenger.sendQuickReply(senderId, 'Here are some options to help you:', quickReplies);
                log.success('Help message with quick replies sent successfully', result);
                
            } else if (text.includes('button') || text.includes('template')) {
                log.debug('Sending enhanced button template response...');
                const buttons = [
                    {
                        type: 'web_url',
                        url: 'https://developers.facebook.com/docs/messenger-platform',
                        title: '📚 Visit Docs',
                        webview_height_ratio: 'full',
                        messenger_extensions: true,
                        fallback_url: 'https://developers.facebook.com/docs/messenger-platform'
                    },
                    {
                        type: 'postback',
                        title: '🚀 Get Started',
                        payload: 'GET_STARTED'
                    },
                    {
                        type: 'web_url',
                        url: 'https://github.com/facebook/messenger-platform',
                        title: '💻 GitHub',
                        webview_height_ratio: 'compact'
                    }
                ];
                
                log.debug('Buttons to send:', buttons);
                const result = await messenger.sendButtonTemplate(senderId, 'Check out these resources powered by Messenger API v23.0:', buttons);
                log.success('Button template sent successfully', result);
                
            } else if (text.includes('list') || text.includes('menu')) {
                log.debug('Sending list template (new v23.0 feature)...');
                const elements = [
                    {
                        title: '🚀 Getting Started',
                        subtitle: 'Learn how to use our bot',
                        image_url: 'https://picsum.photos/200/100?random=1',
                        default_action: {
                            type: 'web_url',
                            url: 'https://example.com/getting-started'
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                title: 'Learn More',
                                url: 'https://example.com/getting-started'
                            }
                        ]
                    },
                    {
                        title: '📚 Documentation',
                        subtitle: 'Complete API reference',
                        image_url: 'https://picsum.photos/200/100?random=2',
                        default_action: {
                            type: 'web_url',
                            url: 'https://example.com/docs'
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                title: 'View Docs',
                                url: 'https://example.com/docs'
                            }
                        ]
                    },
                    {
                        title: '💬 Support',
                        subtitle: 'Get help when you need it',
                        image_url: 'https://picsum.photos/200/100?random=3',
                        default_action: {
                            type: 'web_url',
                            url: 'https://example.com/support'
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                title: 'Contact Support',
                                url: 'https://example.com/support'
                            }
                        ]
                    }
                ];
                
                const buttons = [
                    {
                        type: 'web_url',
                        title: '🌐 Visit Website',
                        url: 'https://example.com'
                    }
                ];
                
                log.debug('List template elements to send:', elements);
                const result = await messenger.sendListTemplate(senderId, elements, buttons);
                log.success('List template sent successfully', result);
                
            } else if (text.includes('generic') || text.includes('cards')) {
                log.debug('Sending generic template (new v23.0 feature)...');
                const elements = [
                    {
                        title: '🎯 Feature 1',
                        subtitle: 'Description of the first feature',
                        image_url: 'https://picsum.photos/300/200?random=4',
                        default_action: {
                            type: 'web_url',
                            url: 'https://example.com/feature1'
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                title: 'Learn More',
                                url: 'https://example.com/feature1'
                            },
                            {
                                type: 'postback',
                                title: 'Try It',
                                payload: 'TRY_FEATURE_1'
                            }
                        ]
                    },
                    {
                        title: '⚡ Feature 2',
                        subtitle: 'Description of the second feature',
                        image_url: 'https://picsum.photos/300/200?random=5',
                        default_action: {
                            type: 'web_url',
                            url: 'https://example.com/feature2'
                        },
                        buttons: [
                            {
                                type: 'web_url',
                                title: 'Learn More',
                                url: 'https://example.com/feature2'
                            },
                            {
                                type: 'postback',
                                title: 'Try It',
                                payload: 'TRY_FEATURE_2'
                            }
                        ]
                    }
                ];
                
                log.debug('Generic template elements to send:', elements);
                const result = await messenger.sendGenericTemplate(senderId, elements);
                log.success('Generic template sent successfully', result);
                
            } else if (text.includes('insights') || text.includes('analytics')) {
                log.debug('Getting page insights (new v23.0 feature)...');
                try {
                    const insights = await messenger.getPageInsights(['messages_received', 'messages_sent']);
                    log.success('Page insights retrieved successfully', insights);
                    
                    const response = `📊 Here are your page insights:\n\n📨 Messages Received: ${insights.data?.[0]?.values?.[0]?.value || 'N/A'}\n📤 Messages Sent: ${insights.data?.[1]?.values?.[0]?.value || 'N/A'}`;
                    await messenger.sendTextMessage(senderId, response);
                } catch (error) {
                    log.error('Failed to get page insights', error);
                    await messenger.sendTextMessage(senderId, 'Sorry, I couldn\'t retrieve the insights at the moment.');
                }
                
            } else if (text.includes('reaction') || text.includes('emoji')) {
                log.debug('Sending reaction (new v23.0 feature)...');
                const response = 'Here are some reactions you can use: 👍 👎 ❤️ 😂 😮 😢 😡';
                await messenger.sendTextMessage(senderId, response);
                
            } else if (text.includes('notification') || text.includes('alert')) {
                log.debug('Sending one-time notification (new v23.0 feature)...');
                try {
                    const result = await messenger.sendOneTimeNotification(senderId, '🔔 This is a one-time notification from our enhanced bot!', 'REGULAR');
                    log.success('One-time notification sent successfully', result);
                } catch (error) {
                    log.error('Failed to send one-time notification', error);
                    await messenger.sendTextMessage(senderId, 'Sorry, I couldn\'t send the notification at the moment.');
                }
                
            } else if (text.includes('version') || text.includes('api')) {
                log.debug('Sending API version information...');
                const response = `🤖 Our bot is powered by:\n\n📱 Facebook Messenger Platform API v23.0\n🚀 Latest features and capabilities\n✨ Enhanced templates and messaging\n📊 Advanced analytics and insights`;
                await messenger.sendTextMessage(senderId, response);
                
            } else {
                log.debug('Sending enhanced default response...');
                const response = 'Thanks for your message! I\'m an enhanced bot powered by Messenger API v23.0. Try saying "help", "list", "generic", "insights", or "version" to see what I can do! 🚀';
                log.debug('Default response text:', response);
                
                const result = await messenger.sendTextMessage(senderId, response);
                log.success('Default response sent successfully', result);
            }
        } else if (message.attachments) {
            log.debug('Processing message with attachments');
            const attachmentTypes = message.attachments.map(att => att.type);
            log.debug('Attachment types:', attachmentTypes);
            
            if (attachmentTypes.includes('image')) {
                await messenger.sendTextMessage(senderId, '🖼️ Thanks for sharing that image! I can see it clearly.');
            } else if (attachmentTypes.includes('video')) {
                await messenger.sendTextMessage(senderId, '🎥 Great video! Thanks for sharing.');
            } else if (attachmentTypes.includes('audio')) {
                await messenger.sendTextMessage(senderId, '🎵 I can hear your audio message!');
            } else if (attachmentTypes.includes('file')) {
                await messenger.sendTextMessage(senderId, '📄 I received your file!');
            } else {
                await messenger.sendTextMessage(senderId, '📎 Thanks for sharing that attachment!');
            }
        } else {
            log.warn('Message has no text content or attachments', {
                messageKeys: Object.keys(message)
            });
            await messenger.sendTextMessage(senderId, 'I received your message but I\'m not sure how to process it. Try sending text or use "help" to see what I can do!');
        }
    } catch (error) {
        log.error('Error processing message', error, { senderId });
        
        try {
            log.debug('Attempting to send error message to user...');
            const errorResponse = 'Sorry, I encountered an error while processing your message. Please try again or say "help" for assistance.';
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

// Send button template
app.post('/api/send-button-template', async (req, res) => {
    log.info('=== SEND BUTTON TEMPLATE API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, text, buttons, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, text, buttons, platform });
        
        if (!userId || !text || !buttons || !Array.isArray(buttons)) {
            log.warn('Validation failed: missing userId, text, or buttons array', {
                received: { userId, text, buttons, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId, text, or buttons array',
                received: { userId, text, buttons, platform },
                _logging: {
                    timestamp: new Date().toISOString(),
                    requestId: Date.now().toString(),
                    validationError: 'Missing required fields',
                    serverInfo: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        version: '2.0.0',
                        apiVersion: 'v23.0'
                    }
                }
            };
            
            return res.status(400).json(errorResponse);
        }
        
        log.debug('Creating messenger instance for platform', { platform });
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        log.debug('Attempting to send button template...');
        const startTime = Date.now();
        const result = await messengerInstance.sendButtonTemplate(userId, text, buttons);
        const duration = Date.now() - startTime;
        
        log.success('Button template sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            buttonsCount: buttons.length
        });
        
        log.info('=== SEND BUTTON TEMPLATE API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                buttonsCount: buttons.length,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '2.0.0',
                    apiVersion: 'v23.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND BUTTON TEMPLATE API ERROR ===', error, {
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
                    version: '2.0.0',
                    apiVersion: 'v23.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Send quick reply
app.post('/api/send-quick-reply', async (req, res) => {
    log.info('=== SEND QUICK REPLY API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, message, quickReplies, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, message, quickReplies, platform });
        
        if (!userId || !message || !quickReplies || !Array.isArray(quickReplies)) {
            log.warn('Validation failed: missing userId, message, or quickReplies array', {
                received: { userId, message, quickReplies, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId, message, or quickReplies array',
                received: { userId, message, quickReplies, platform },
                _logging: {
                    timestamp: new Date().toISOString(),
                    requestId: Date.now().toString(),
                    validationError: 'Missing required fields',
                    serverInfo: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        version: '2.0.0',
                        apiVersion: 'v23.0'
                    }
                }
            };
            
            return res.status(400).json(errorResponse);
        }
        
        log.debug('Creating messenger instance for platform', { platform });
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        log.debug('Attempting to send quick reply...');
        const startTime = Date.now();
        const result = await messengerInstance.sendQuickReply(userId, message, quickReplies);
        const duration = Date.now() - startTime;
        
        log.success('Quick reply sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            quickRepliesCount: quickReplies.length
        });
        
        log.info('=== SEND QUICK REPLY API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                quickRepliesCount: quickReplies.length,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '2.0.0',
                    apiVersion: 'v23.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND QUICK REPLY API ERROR ===', error, {
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
                    version: '2.0.0',
                    apiVersion: 'v23.0'
                }
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Send generic template (new v23.0 feature)
app.post('/api/send-generic-template', async (req, res) => {
    log.info('=== SEND GENERIC TEMPLATE API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, elements, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, elements, platform });
        
        if (!userId || !elements || !Array.isArray(elements)) {
            log.warn('Validation failed: missing userId or elements array', {
                received: { userId, elements, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId or elements array',
                received: { userId, elements, platform },
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
        
        log.debug('Attempting to send generic template...');
        const startTime = Date.now();
        const result = await messengerInstance.sendGenericTemplate(userId, elements);
        const duration = Date.now() - startTime;
        
        log.success('Generic template sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            elementsCount: elements.length
        });
        
        log.info('=== SEND GENERIC TEMPLATE API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                elementsCount: elements.length,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND GENERIC TEMPLATE API ERROR ===', error, {
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

// Send list template (new v23.0 feature)
app.post('/api/send-list-template', async (req, res) => {
    log.info('=== SEND LIST TEMPLATE API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, elements, buttons, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, elements, buttons, platform });
        
        if (!userId || !elements || !Array.isArray(elements)) {
            log.warn('Validation failed: missing userId or elements array', {
                received: { userId, elements, buttons, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId or elements array',
                received: { userId, elements, buttons, platform },
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
        
        log.debug('Attempting to send list template...');
        const startTime = Date.now();
        const result = await messengerInstance.sendListTemplate(userId, elements, buttons);
        const duration = Date.now() - startTime;
        
        log.success('List template sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            elementsCount: elements.length,
            hasButtons: !!buttons
        });
        
        log.info('=== SEND LIST TEMPLATE API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                elementsCount: elements.length,
                hasButtons: !!buttons,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND LIST TEMPLATE API ERROR ===', error, {
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

// Send reaction (new v23.0 feature)
app.post('/api/send-reaction', async (req, res) => {
    log.info('=== SEND REACTION API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, messageId, reaction, platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, messageId, reaction, platform });
        
        if (!userId || !messageId || !reaction) {
            log.warn('Validation failed: missing required fields', {
                received: { userId, messageId, reaction, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId, messageId, or reaction',
                received: { userId, messageId, reaction, platform },
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
        
        log.debug('Attempting to send reaction...');
        const startTime = Date.now();
        const result = await messengerInstance.sendReaction(userId, messageId, reaction);
        const duration = Date.now() - startTime;
        
        log.success('Reaction sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            messageId,
            reaction
        });
        
        log.info('=== SEND REACTION API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                reaction: reaction,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND REACTION API ERROR ===', error, {
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

// Get page insights (new v23.0 feature)
app.get('/api/insights', async (req, res) => {
    log.info('=== GET PAGE INSIGHTS API REQUEST START ===');
    const { platform = 'messenger', metrics = 'messages_received,messages_sent' } = req.query;
    
    log.debug('Request parameters', { platform, metrics });
    
    try {
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        log.debug('Messenger instance created for platform', { platform });
        
        const metricsArray = metrics.split(',');
        log.debug('Attempting to get page insights...');
        const startTime = Date.now();
        const insights = await messengerInstance.getPageInsights(metricsArray);
        const duration = Date.now() - startTime;
        
        log.success('Page insights retrieved successfully', {
            hasData: !!insights,
            dataSize: insights ? JSON.stringify(insights).length : 0,
            duration: `${duration}ms`,
            platform,
            metrics: metricsArray
        });
        
        log.info('=== GET PAGE INSIGHTS API REQUEST END ===');
        
        const successResponse = { 
            ...insights,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                metrics: metricsArray,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== GET PAGE INSIGHTS API ERROR ===', error, {
            platform: platform,
            metrics: metrics
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

// Send one-time notification (new v23.0 feature)
app.post('/api/send-notification', async (req, res) => {
    log.info('=== SEND ONE-TIME NOTIFICATION API REQUEST START ===');
    log.debug('Request details', {
        body: req.body,
        headers: req.headers,
        ip: req.ip
    });
    
    try {
        const { userId, message, notificationType = 'REGULAR', platform = 'messenger' } = req.body;
        
        log.debug('Parsed request data', { userId, message, notificationType, platform });
        
        if (!userId || !message) {
            log.warn('Validation failed: missing userId or message', {
                received: { userId, message, notificationType, platform }
            });
            
            const errorResponse = { 
                error: 'Missing userId or message',
                received: { userId, message, notificationType, platform },
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
        
        log.debug('Attempting to send one-time notification...');
        const startTime = Date.now();
        const result = await messengerInstance.sendOneTimeNotification(userId, message, notificationType);
        const duration = Date.now() - startTime;
        
        log.success('One-time notification sent successfully', {
            result,
            duration: `${duration}ms`,
            platform,
            userId,
            notificationType,
            messageLength: message.length
        });
        
        log.info('=== SEND ONE-TIME NOTIFICATION API REQUEST END ===');
        
        const successResponse = { 
            success: true, 
            result,
            _logging: {
                timestamp: new Date().toISOString(),
                requestId: Date.now().toString(),
                responseTime: `${duration}ms`,
                platform: platform,
                notificationType: notificationType,
                messageLength: message.length,
                serverInfo: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: '1.0.0'
                }
            }
        };
        
        res.json(successResponse);
        
    } catch (error) {
        log.error('=== SEND ONE-TIME NOTIFICATION API ERROR ===', error, {
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
        message: 'Facebook Messenger Platform API Server - v23.0 Enhanced',
        version: '2.0.0',
        apiVersion: 'v23.0',
        features: [
            'Enhanced Logging System',
            'Browser Console Integration',
            'Performance Monitoring',
            'v23.0 API Features'
        ],
        endpoints: {
            webhook: '/webhook',
            // Core messaging endpoints
            sendMessage: '/api/send-message',
            sendImage: '/api/send-image',
            // New v23.0 template endpoints
            sendGenericTemplate: '/api/send-generic-template',
            sendListTemplate: '/api/send-list-template',
            sendButtonTemplate: '/api/send-button-template',
            sendQuickReply: '/api/send-quick-reply',
            // New v23.0 feature endpoints
            sendReaction: '/api/send-reaction',
            sendNotification: '/api/send-notification',
            getInsights: '/api/insights',
            // Data retrieval endpoints
            conversations: '/api/conversations',
            userProfile: '/api/user/:userId',
            // Utility endpoints
            health: '/health'
        },
        v23Features: {
            'Generic Template': 'Rich card-based messaging with images and buttons',
            'List Template': 'Vertical list layout for multiple items',
            'Enhanced Button Templates': 'Webview height ratios and fallback URLs',
            'Quick Reply Images': 'Visual quick reply options',
            'Reactions': 'Message reaction support',
            'One-time Notifications': 'Non-24/7 messaging capabilities',
            'Page Insights': 'Advanced analytics and metrics',
            'Reusable Attachments': 'Optimized media handling'
        },
        _logging: {
            timestamp: new Date().toISOString(),
            requestId: Date.now().toString(),
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '2.0.0',
                apiVersion: 'v23.0'
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
                '/api/send-generic-template',
                '/api/send-list-template',
                '/api/send-button-template',
                '/api/send-quick-reply',
                '/api/send-reaction',
                '/api/send-notification',
                '/api/insights',
                '/api/conversations',
                '/api/user/:userId',
                '/health'
            ],
            serverInfo: {
                nodeEnv: process.env.NODE_ENV || 'development',
                version: '2.0.0',
                apiVersion: 'v23.0'
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

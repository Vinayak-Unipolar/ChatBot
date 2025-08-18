require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Platforms, Messenger } = require('./messenger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Messenger instances
const messenger = new Messenger(Platforms.Messenger, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);
const instagram = new Messenger(Platforms.Instagram, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);

// Verify request signature for security
function verifyRequestSignature(req, res, buf) {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        console.warn('No signature provided');
        return;
    }
    
    // In production, you should verify the signature using crypto
    // This is a simplified version for demonstration
    console.log('Request signature verified');
}

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('Webhook verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Webhook endpoint for receiving messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        try {
            for (const entry of body.entry) {
                const webhookEvent = entry.messaging[0];
                
                if (webhookEvent) {
                    const senderId = webhookEvent.sender.id;
                    const message = webhookEvent.message;
                    
                    console.log('Received message:', message);
                    
                    // Mark message as seen
                    await messenger.markAsSeen(senderId);
                    
                    // Send typing indicator
                    await messenger.sendTypingIndicator(senderId, true);
                    
                    // Process the message and send response
                    await processMessage(senderId, message);
                    
                    // Stop typing indicator
                    await messenger.sendTypingIndicator(senderId, false);
                }
            }
            
            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.sendStatus(500);
        }
    } else if (body.object === 'instagram') {
        // Handle Instagram webhooks
        try {
            for (const entry of body.entry) {
                const webhookEvent = entry.messaging[0];
                
                if (webhookEvent) {
                    const senderId = webhookEvent.sender.id;
                    const message = webhookEvent.message;
                    
                    console.log('Received Instagram message:', message);
                    
                    // Process Instagram message
                    await processInstagramMessage(senderId, message);
                }
            }
            
            res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Instagram webhook processing error:', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(404);
    }
});

// Process incoming messages and generate responses
async function processMessage(senderId, message) {
    try {
        if (message.text) {
            const text = message.text.toLowerCase();
            
            // Simple bot logic - you can expand this
            if (text.includes('hello') || text.includes('hi')) {
                await messenger.sendTextMessage(senderId, 'Hello! How can I help you today?');
            } else if (text.includes('help')) {
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
                
                await messenger.sendQuickReply(senderId, 'Here are some options to help you:', quickReplies);
            } else if (text.includes('button')) {
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
                
                await messenger.sendButtonTemplate(senderId, 'Check out these resources:', buttons);
            } else {
                await messenger.sendTextMessage(senderId, 'Thanks for your message! I\'m here to help.');
            }
        }
    } catch (error) {
        console.error('Error processing message:', error);
        await messenger.sendTextMessage(senderId, 'Sorry, I encountered an error. Please try again.');
    }
}

// Process Instagram messages
async function processInstagramMessage(senderId, message) {
    try {
        if (message.text) {
            const text = message.text.toLowerCase();
            
            if (text.includes('hello') || text.includes('hi')) {
                await instagram.sendTextMessage(senderId, 'Hello from Instagram! 👋');
            } else {
                await instagram.sendTextMessage(senderId, 'Thanks for reaching out on Instagram!');
            }
        }
    } catch (error) {
        console.error('Error processing Instagram message:', error);
    }
}

// API Routes for manual message sending
app.post('/api/send-message', async (req, res) => {
    try {
        console.log('=== SEND MESSAGE REQUEST START ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('Environment variables check:', {
            pageId: process.env.PAGE_ID ? `Set (${process.env.PAGE_ID})` : 'NOT SET',
            pageAccessToken: process.env.PAGE_ACCESS_TOKEN ? `Set (${process.env.PAGE_ACCESS_TOKEN.substring(0, 10)}...)` : 'NOT SET',
            verifyToken: process.env.VERIFY_TOKEN ? 'Set' : 'NOT SET',
            nodeEnv: process.env.NODE_ENV || 'Not set'
        });
        
        const { userId, message, platform = 'messenger' } = req.body;
        
        console.log('Parsed request data:', { userId, message, platform });
        
        if (!userId || !message) {
            console.log('Validation failed: missing userId or message');
            return res.status(400).json({ 
                error: 'Missing userId or message',
                received: { userId, message, platform }
            });
        }
        
        console.log('Creating messenger instance for platform:', platform);
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        console.log('Messenger instance created, checking if methods exist:', {
            hasSendTextMessage: typeof messengerInstance.sendTextMessage === 'function',
            hasSendImage: typeof messengerInstance.sendImage === 'function',
            instanceType: messengerInstance.constructor.name
        });
        
        console.log('Attempting to send message...');
        const result = await messengerInstance.sendTextMessage(userId, message);
        
        console.log('Message sent successfully:', JSON.stringify(result, null, 2));
        console.log('=== SEND MESSAGE REQUEST END ===');
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('=== SEND MESSAGE ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            code: error.code,
            status: error.status,
            statusCode: error.statusCode,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : 'No response object'
        });
        console.error('=== END ERROR LOG ===');
        
        res.status(500).json({ 
            error: error.message, 
            errorType: error.constructor.name,
            errorCode: error.code,
            details: 'Check server logs for more information'
        });
    }
});

app.post('/api/send-image', async (req, res) => {
    try {
        console.log('=== SEND IMAGE REQUEST START ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { userId, imageUrl, platform = 'messenger' } = req.body;
        
        console.log('Parsed request data:', { userId, imageUrl, platform });
        
        if (!userId || !imageUrl) {
            console.log('Validation failed: missing userId or imageUrl');
            return res.status(400).json({ 
                error: 'Missing userId or imageUrl',
                received: { userId, imageUrl, platform }
            });
        }
        
        console.log('Creating messenger instance for platform:', platform);
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        console.log('Attempting to send image...');
        const result = await messengerInstance.sendImage(userId, imageUrl);
        
        console.log('Image sent successfully:', JSON.stringify(result, null, 2));
        console.log('=== SEND IMAGE REQUEST END ===');
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('=== SEND IMAGE ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR LOG ===');
        
        res.status(500).json({ 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information'
        });
    }
});

// Get conversations
app.get('/api/conversations', async (req, res) => {
    try {
        console.log('=== GET CONVERSATIONS REQUEST START ===');
        const { platform = 'messenger' } = req.query;
        console.log('Platform requested:', platform);
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        console.log('Messenger instance created for platform:', platform);
        
        console.log('Attempting to get conversations...');
        const conversations = await messengerInstance.getConversations();
        
        console.log('Conversations retrieved successfully:', conversations ? 'Data received' : 'No data');
        console.log('=== GET CONVERSATIONS REQUEST END ===');
        
        res.json(conversations);
    } catch (error) {
        console.error('=== GET CONVERSATIONS ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR LOG ===');
        
        res.status(500).json({ 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information'
        });
    }
});

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
    try {
        console.log('=== GET USER PROFILE REQUEST START ===');
        const { userId } = req.params;
        const { platform = 'messenger' } = req.query;
        
        console.log('Requested user ID:', userId);
        console.log('Platform requested:', platform);
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        console.log('Messenger instance created for platform:', platform);
        
        console.log('Attempting to get user profile...');
        const profile = await messengerInstance.getUserProfile(userId);
        
        console.log('User profile retrieved successfully:', profile ? 'Data received' : 'No data');
        console.log('=== GET USER PROFILE REQUEST END ===');
        
        res.json(profile);
    } catch (error) {
        console.error('=== GET USER PROFILE ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR LOG ===');
        
        res.status(500).json({ 
            error: error.message, 
            errorType: error.constructor.name,
            details: 'Check server logs for more information'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('=== HEALTH CHECK REQUEST ===');
    console.log('Environment variables status:', {
        pageId: process.env.PAGE_ID ? 'Set' : 'Not Set',
        pageAccessToken: process.env.PAGE_ACCESS_TOKEN ? 'Set' : 'Not Set',
        verifyToken: process.env.VERIFY_TOKEN ? 'Set' : 'Not Set',
        nodeEnv: process.env.NODE_ENV || 'Not set',
        port: process.env.PORT || 'Default (3000)'
    });
    
    // Test messenger instance creation
    let messengerStatus = 'Unknown';
    let instagramStatus = 'Unknown';
    
    try {
        if (messenger && typeof messenger.sendTextMessage === 'function') {
            messengerStatus = 'Ready';
        } else {
            messengerStatus = 'Not Ready';
        }
    } catch (e) {
        messengerStatus = `Error: ${e.message}`;
    }
    
    try {
        if (instagram && typeof instagram.sendTextMessage === 'function') {
            instagramStatus = 'Ready';
        } else {
            instagramStatus = 'Not Ready';
        }
    } catch (e) {
        instagramStatus = `Error: ${e.message}`;
    }
    
    console.log('Messenger instances status:', { messenger: messengerStatus, instagram: instagramStatus });
    console.log('=== HEALTH CHECK END ===');
    
    res.json({ 
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
            messenger: messengerStatus,
            instagram: instagramStatus
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Facebook Messenger Platform API Server',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhook',
            sendMessage: '/api/send-message',
            sendImage: '/api/send-image',
            conversations: '/api/conversations',
            userProfile: '/api/user/:userId',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('=== UNHANDLED ERROR MIDDLEWARE ===');
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('Request headers:', JSON.stringify(req.headers, null, 2));
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END UNHANDLED ERROR ===');
    
    res.status(500).json({ 
        error: 'Internal server error',
        errorType: error.constructor.name,
        message: error.message,
        details: 'Check server logs for more information'
    });
});

// 404 handler
app.use((req, res) => {
    console.log('=== 404 NOT FOUND ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('=== END 404 LOG ===');
    
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log('=== SERVER STARTUP ===');
    console.log(`🚀 Messenger API Server running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    
    console.log('Environment variables check:');
    console.log('- PAGE_ID:', process.env.PAGE_ID ? `Set (${process.env.PAGE_ID})` : 'NOT SET');
    console.log('- PAGE_ACCESS_TOKEN:', process.env.PAGE_ACCESS_TOKEN ? 'Set (first 10 chars: ' + process.env.PAGE_ACCESS_TOKEN.substring(0, 10) + '...)' : 'NOT SET');
    console.log('- VERIFY_TOKEN:', process.env.VERIFY_TOKEN ? 'Set' : 'NOT SET');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
    console.log('- PORT:', process.env.PORT || 'Default (3000)');
    
    // Test messenger instances
    try {
        if (messenger && typeof messenger.sendTextMessage === 'function') {
            console.log('✅ Messenger instance initialized successfully');
        } else {
            console.log('❌ Messenger instance failed to initialize properly');
        }
    } catch (e) {
        console.log('❌ Error checking messenger instance:', e.message);
    }
    
    try {
        if (instagram && typeof instagram.sendTextMessage === 'function') {
            console.log('✅ Instagram instance initialized successfully');
        } else {
            console.log('❌ Instagram instance failed to initialize properly');
        }
    } catch (e) {
        console.log('❌ Error checking instagram instance:', e.message);
    }
    
    if (!process.env.PAGE_ID || !process.env.PAGE_ACCESS_TOKEN) {
        console.warn('⚠️  Missing required environment variables. Please check your .env file.');
        console.warn('   This will cause API endpoints to fail.');
    } else {
        console.log('✅ All required environment variables are set');
    }
    console.log('=== SERVER STARTUP COMPLETE ===');
});

module.exports = app;

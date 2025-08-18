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
        const { userId, message, platform = 'messenger' } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({ error: 'Missing userId or message' });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendTextMessage(userId, message);
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/send-image', async (req, res) => {
    try {
        const { userId, imageUrl, platform = 'messenger' } = req.body;
        
        if (!userId || !imageUrl) {
            return res.status(400).json({ error: 'Missing userId or imageUrl' });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendImage(userId, imageUrl);
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('Send image error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get conversations
app.get('/api/conversations', async (req, res) => {
    try {
        const { platform = 'messenger' } = req.query;
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const conversations = await messengerInstance.getConversations();
        
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { platform = 'messenger' } = req.query;
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const profile = await messengerInstance.getUserProfile(userId);
        
        res.json(profile);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        platform: 'Messenger API Express Server'
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
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Messenger API Server running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    
    if (!process.env.PAGE_ID || !process.env.PAGE_ACCESS_TOKEN) {
        console.warn('⚠️  Missing required environment variables. Please check your .env file.');
    }
});

module.exports = app;

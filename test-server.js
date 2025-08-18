// Test server for local development and testing
// This file helps you test the Messenger API endpoints without setting up Facebook webhooks

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Platforms, Messenger } = require('./messenger');

const app = express();
const PORT = process.env.PORT || 3001; // Different port to avoid conflicts

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Messenger instances
const messenger = new Messenger(Platforms.Messenger, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);
const instagram = new Messenger(Platforms.Instagram, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);

// Test endpoints
app.get('/test', (req, res) => {
    res.json({
        message: 'Test server is running!',
        timestamp: new Date().toISOString(),
        environment: {
            pageId: process.env.PAGE_ID ? 'Set' : 'Not Set',
            pageAccessToken: process.env.PAGE_ACCESS_TOKEN ? 'Set' : 'Not Set',
            verifyToken: process.env.VERIFY_TOKEN ? 'Set' : 'Not Set'
        }
    });
});

// Test message sending
app.post('/test/send-message', async (req, res) => {
    try {
        const { userId, message, platform = 'messenger' } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({ 
                error: 'Missing userId or message',
                example: {
                    userId: '123456789',
                    message: 'Hello from test server!',
                    platform: 'messenger' // or 'instagram'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendTextMessage(userId, message);
        
        res.json({ 
            success: true, 
            result,
            message: `Message sent to ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test send message error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Check your environment variables and Facebook app configuration'
        });
    }
});

// Test image sending
app.post('/test/send-image', async (req, res) => {
    try {
        const { userId, imageUrl, platform = 'messenger' } = req.body;
        
        if (!userId || !imageUrl) {
            return res.status(400).json({ 
                error: 'Missing userId or imageUrl',
                example: {
                    userId: '123456789',
                    imageUrl: 'https://example.com/image.jpg',
                    platform: 'messenger'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendImage(userId, imageUrl);
        
        res.json({ 
            success: true, 
            result,
            message: `Image sent to ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test send image error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test quick replies
app.post('/test/send-quick-reply', async (req, res) => {
    try {
        const { userId, message, quickReplies, platform = 'messenger' } = req.body;
        
        if (!userId || !message || !quickReplies) {
            return res.status(400).json({ 
                error: 'Missing userId, message, or quickReplies',
                example: {
                    userId: '123456789',
                    message: 'Choose an option:',
                    quickReplies: [
                        { content_type: 'text', title: 'Option 1', payload: 'OPTION_1' },
                        { content_type: 'text', title: 'Option 2', payload: 'OPTION_2' }
                    ],
                    platform: 'messenger'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendQuickReply(userId, message, quickReplies);
        
        res.json({ 
            success: true, 
            result,
            message: `Quick reply sent to ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test send quick reply error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test button template
app.post('/test/send-button-template', async (req, res) => {
    try {
        const { userId, text, buttons, platform = 'messenger' } = req.body;
        
        if (!userId || !text || !buttons) {
            return res.status(400).json({ 
                error: 'Missing userId, text, or buttons',
                example: {
                    userId: '123456789',
                    text: 'What would you like to do?',
                    buttons: [
                        { type: 'web_url', url: 'https://example.com', title: 'Visit Website' },
                        { type: 'postback', title: 'Get Started', payload: 'GET_STARTED' }
                    ],
                    platform: 'messenger'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendButtonTemplate(userId, text, buttons);
        
        res.json({ 
            success: true, 
            result,
            message: `Button template sent to ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test send button template error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test user profile retrieval
app.get('/test/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { platform = 'messenger' } = req.query;
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const profile = await messengerInstance.getUserProfile(userId);
        
        res.json({ 
            success: true, 
            profile,
            message: `Profile retrieved for ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test get user profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test conversations
app.get('/test/conversations', async (req, res) => {
    try {
        const { platform = 'messenger' } = req.query;
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const conversations = await messengerInstance.getConversations();
        
        res.json({ 
            success: true, 
            conversations,
            message: `Conversations retrieved for ${platform}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test typing indicators
app.post('/test/typing', async (req, res) => {
    try {
        const { userId, typing = true, platform = 'messenger' } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing userId',
                example: {
                    userId: '123456789',
                    typing: true, // true to show, false to hide
                    platform: 'messenger'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.sendTypingIndicator(userId, typing);
        
        res.json({ 
            success: true, 
            result,
            message: `Typing indicator ${typing ? 'shown' : 'hidden'} for ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test typing indicator error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test mark as seen
app.post('/test/mark-seen', async (req, res) => {
    try {
        const { userId, platform = 'messenger' } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing userId',
                example: {
                    userId: '123456789',
                    platform: 'messenger'
                }
            });
        }
        
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        const result = await messengerInstance.markAsSeen(userId);
        
        res.json({ 
            success: true, 
            result,
            message: `Message marked as seen for ${platform} user ${userId}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test mark as seen error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test webhook simulation
app.post('/test/webhook-simulate', async (req, res) => {
    try {
        const { senderId, message, platform = 'messenger' } = req.body;
        
        if (!senderId || !message) {
            return res.status(400).json({ 
                error: 'Missing senderId or message',
                example: {
                    senderId: '123456789',
                    message: 'Hello bot!',
                    platform: 'messenger'
                }
            });
        }
        
        // Simulate webhook processing
        const messengerInstance = platform === 'instagram' ? instagram : messenger;
        
        // Mark as seen
        await messengerInstance.markAsSeen(senderId);
        
        // Show typing indicator
        await messengerInstance.sendTypingIndicator(senderId, true);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send response based on message content
        let response = 'Thanks for your message!';
        if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
            response = 'Hello! How can I help you today?';
        } else if (message.toLowerCase().includes('help')) {
            response = 'I\'m here to help! What do you need assistance with?';
        }
        
        const result = await messengerInstance.sendTextMessage(senderId, response);
        
        // Hide typing indicator
        await messengerInstance.sendTypingIndicator(senderId, false);
        
        res.json({ 
            success: true, 
            result,
            message: `Webhook simulated for ${platform} user ${senderId}`,
            response: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test webhook simulation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/test/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        server: 'Test Server',
        endpoints: {
            test: '/test',
            sendMessage: '/test/send-message',
            sendImage: '/test/send-image',
            sendQuickReply: '/test/send-quick-reply',
            sendButtonTemplate: '/test/send-button-template',
            userProfile: '/test/user/:userId',
            conversations: '/test/conversations',
            typing: '/test/typing',
            markSeen: '/test/mark-seen',
            webhookSimulate: '/test/webhook-simulate'
        }
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Test server error:', error);
    res.status(500).json({ error: 'Internal test server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Test endpoint not found' });
});

// Start test server
app.listen(PORT, () => {
    console.log(`🧪 Test Server running on port ${PORT}`);
    console.log(`🔗 Test endpoints: http://localhost:${PORT}/test`);
    console.log(`💚 Health check: http://localhost:${PORT}/test/health`);
    
    if (!process.env.PAGE_ID || !process.env.PAGE_ACCESS_TOKEN) {
        console.warn('⚠️  Missing required environment variables. Test endpoints may not work properly.');
        console.warn('   Please check your .env file for PAGE_ID and PAGE_ACCESS_TOKEN.');
    }
});

module.exports = app;

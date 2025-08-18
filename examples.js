// Examples of using the Messenger API with Express.js
// This file demonstrates various integration patterns

const { Platforms, Messenger } = require('./messenger');

// Initialize Messenger instances
const messenger = new Messenger(Platforms.Messenger, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);
const instagram = new Messenger(Platforms.Instagram, process.env.PAGE_ID, process.env.PAGE_ACCESS_TOKEN);

// Example 1: Basic Message Sending
async function sendBasicMessage() {
    try {
        const userId = 'USER_ID_HERE';
        const result = await messenger.sendTextMessage(userId, 'Hello! Welcome to our service.');
        console.log('Message sent:', result);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Example 2: Sending Image with Caption
async function sendImageMessage() {
    try {
        const userId = 'USER_ID_HERE';
        const imageUrl = 'https://example.com/image.jpg';
        const result = await messenger.sendImage(userId, imageUrl);
        console.log('Image sent:', result);
    } catch (error) {
        console.error('Error sending image:', error);
    }
}

// Example 3: Interactive Quick Replies
async function sendQuickReplies() {
    try {
        const userId = 'USER_ID_HERE';
        const quickReplies = [
            {
                content_type: 'text',
                title: 'Yes, I\'m interested',
                payload: 'INTERESTED_YES'
            },
            {
                content_type: 'text',
                title: 'Maybe later',
                payload: 'INTERESTED_MAYBE'
            },
            {
                content_type: 'text',
                title: 'Not interested',
                payload: 'INTERESTED_NO'
            }
        ];
        
        const result = await messenger.sendQuickReply(
            userId, 
            'Would you like to learn more about our premium features?', 
            quickReplies
        );
        console.log('Quick replies sent:', result);
    } catch (error) {
        console.error('Error sending quick replies:', error);
    }
}

// Example 4: Button Template
async function sendButtonTemplate() {
    try {
        const userId = 'USER_ID_HERE';
        const buttons = [
            {
                type: 'web_url',
                url: 'https://yourwebsite.com/shop',
                title: 'Visit Shop'
            },
            {
                type: 'postback',
                title: 'View Cart',
                payload: 'VIEW_CART'
            },
            {
                type: 'phone_number',
                title: 'Call Support',
                payload: '+1234567890'
            }
        ];
        
        const result = await messenger.sendButtonTemplate(
            userId, 
            'What would you like to do next?', 
            buttons
        );
        console.log('Button template sent:', result);
    } catch (error) {
        console.error('Error sending button template:', error);
    }
}

// Example 5: User Profile Retrieval
async function getUserProfile() {
    try {
        const userId = 'USER_ID_HERE';
        const profile = await messenger.getUserProfile(userId);
        console.log('User profile:', profile);
        
        // Use profile information
        if (profile.first_name) {
            await messenger.sendTextMessage(userId, `Hello ${profile.first_name}! How can I help you today?`);
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
    }
}

// Example 6: Conversation Management
async function getConversations() {
    try {
        const conversations = await messenger.getConversations();
        console.log('Recent conversations:', conversations);
        
        if (conversations.data && conversations.data.length > 0) {
            const latestConversation = conversations.data[0];
            const messages = await messenger.getConversationMessages(latestConversation.id);
            console.log('Latest conversation messages:', messages);
        }
    } catch (error) {
        console.error('Error getting conversations:', error);
    }
}

// Example 7: Instagram Integration
async function sendInstagramMessage() {
    try {
        const userId = 'INSTAGRAM_USER_ID_HERE';
        const result = await instagram.sendTextMessage(userId, 'Hello from Instagram! 🎉');
        console.log('Instagram message sent:', result);
    } catch (error) {
        console.error('Error sending Instagram message:', error);
    }
}

// Example 8: Typing Indicators
async function sendTypingIndicator() {
    try {
        const userId = 'USER_ID_HERE';
        
        // Show typing indicator
        await messenger.sendTypingIndicator(userId, true);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send the actual message
        await messenger.sendTextMessage(userId, 'Thanks for waiting! Here\'s your response.');
        
        // Hide typing indicator
        await messenger.sendTypingIndicator(userId, false);
        
    } catch (error) {
        console.error('Error with typing indicator:', error);
    }
}

// Example 9: Message Seen Confirmation
async function markMessageAsSeen() {
    try {
        const userId = 'USER_ID_HERE';
        const result = await messenger.markAsSeen(userId);
        console.log('Message marked as seen:', result);
    } catch (error) {
        console.error('Error marking message as seen:', error);
    }
}

// Example 10: Error Handling with Retry Logic
async function sendMessageWithRetry(userId, message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await messenger.sendTextMessage(userId, message);
            console.log(`Message sent successfully on attempt ${attempt}`);
            return result;
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw new Error(`Failed to send message after ${maxRetries} attempts`);
            }
            
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Example 11: Batch Message Sending
async function sendBatchMessages(userIds, message) {
    const results = [];
    
    for (const userId of userIds) {
        try {
            const result = await messenger.sendTextMessage(userId, message);
            results.push({ userId, success: true, result });
        } catch (error) {
            results.push({ userId, success: false, error: error.message });
        }
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}

// Example 12: Conditional Message Sending
async function sendConditionalMessage(userId, userPreferences) {
    try {
        let message = '';
        
        if (userPreferences.isNewUser) {
            message = 'Welcome! We\'re excited to have you here.';
        } else if (userPreferences.isPremium) {
            message = 'Welcome back, premium member! You have access to exclusive features.';
        } else {
            message = 'Welcome back! Consider upgrading to premium for more features.';
        }
        
        const result = await messenger.sendTextMessage(userId, message);
        console.log('Conditional message sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending conditional message:', error);
    }
}

// Example 13: Integration with External APIs
async function sendWeatherUpdate(userId, city) {
    try {
        // This would typically call a weather API
        const weatherData = await fetchWeatherData(city);
        
        const message = `Weather in ${city}: ${weatherData.temperature}°C, ${weatherData.condition}`;
        const result = await messenger.sendTextMessage(userId, message);
        
        console.log('Weather update sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending weather update:', error);
        // Send fallback message
        await messenger.sendTextMessage(userId, 'Sorry, I couldn\'t get the weather information right now.');
    }
}

// Mock function for weather API (replace with actual implementation)
async function fetchWeatherData(city) {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                temperature: Math.floor(Math.random() * 30) + 10,
                condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
            });
        }, 1000);
    });
}

// Example 14: Webhook Event Processing
function processWebhookEvent(webhookEvent) {
    const senderId = webhookEvent.sender.id;
    const message = webhookEvent.message;
    
    if (message && message.text) {
        const text = message.text.toLowerCase();
        
        // Process different message types
        if (text.includes('order') || text.includes('purchase')) {
            return handleOrderInquiry(senderId, message);
        } else if (text.includes('support') || text.includes('help')) {
            return handleSupportRequest(senderId, message);
        } else if (text.includes('feedback')) {
            return handleFeedback(senderId, message);
        } else {
            return handleGeneralMessage(senderId, message);
        }
    }
    
    return null;
}

async function handleOrderInquiry(senderId, message) {
    // Handle order-related inquiries
    await messenger.sendTextMessage(senderId, 'I can help you with your order. What would you like to know?');
}

async function handleSupportRequest(senderId, message) {
    // Handle support requests
    const quickReplies = [
        { content_type: 'text', title: 'Technical Issue', payload: 'TECH_SUPPORT' },
        { content_type: 'text', title: 'Billing Question', payload: 'BILLING_SUPPORT' },
        { content_type: 'text', title: 'General Help', payload: 'GENERAL_HELP' }
    ];
    
    await messenger.sendQuickReply(senderId, 'What type of support do you need?', quickReplies);
}

async function handleFeedback(senderId, message) {
    // Handle feedback
    await messenger.sendTextMessage(senderId, 'Thank you for your feedback! We appreciate your input.');
}

async function handleGeneralMessage(senderId, message) {
    // Handle general messages
    await messenger.sendTextMessage(senderId, 'I\'m here to help! How can I assist you today?');
}

// Export examples for use in other files
module.exports = {
    sendBasicMessage,
    sendImageMessage,
    sendQuickReplies,
    sendButtonTemplate,
    getUserProfile,
    getConversations,
    sendInstagramMessage,
    sendTypingIndicator,
    markMessageAsSeen,
    sendMessageWithRetry,
    sendBatchMessages,
    sendConditionalMessage,
    sendWeatherUpdate,
    processWebhookEvent
};

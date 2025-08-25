const fetch = require('node-fetch');

const Platforms = {
    Messenger: 'messenger',
    Instagram: 'instagram'
};

class Messenger {
    constructor(platform, pageId, accessToken) {
        console.log('=== MESSENGER INSTANCE CREATION ===');
        console.log('Creating Messenger instance for platform:', platform);
        console.log('Page ID:', pageId ? `Set (${pageId})` : 'NOT SET');
        console.log('Access Token:', accessToken ? 'Set (first 10 chars: ' + accessToken.substring(0, 10) + '...)' : 'NOT SET');
        
        this.apiDomain = 'graph.facebook.com';
        this.apiVersion = '18.0';
        this.apiUrl = `https://${this.apiDomain}/v${this.apiVersion}`;
        this.platform = platform;
        this.pageId = pageId;
        this.accessToken = accessToken;
        
        console.log('API Configuration:', {
            domain: this.apiDomain,
            version: this.apiVersion,
            baseUrl: this.apiUrl,
            platform: this.platform
        });
        
        if (!pageId || !accessToken) {
            console.warn('⚠️  Missing required parameters for Messenger instance');
            console.warn('   This will cause API calls to fail');
        } else {
            console.log('✅ Messenger instance created successfully');
        }
        console.log('=== MESSENGER INSTANCE CREATION COMPLETE ===');
    }

    async #sendApiRequest(api, parameters, method = 'GET') {
        console.log('=== API REQUEST START ===');
        console.log('API endpoint:', api);
        console.log('Request method:', method);
        console.log('Platform:', this.platform);
        console.log('Page ID:', this.pageId);
        
        // Log parameters without sensitive data
        const logParams = { ...parameters };
        if (logParams.access_token) {
            logParams.access_token = logParams.access_token.substring(0, 10) + '...';
        }
        console.log('Request parameters:', logParams);
        
        parameters['access_token'] = this.accessToken;
        const queryString = new URLSearchParams(parameters);
        
        const url = method === 'GET' 
            ? `${this.apiUrl}/${api}?${queryString.toString()}`
            : `${this.apiUrl}/${api}`;

        console.log('Full API URL:', url);
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'POST') {
            options.body = JSON.stringify(parameters);
            console.log('Request body:', JSON.stringify(parameters, null, 2));
        }

        console.log('Request options:', {
            method: options.method,
            headers: options.headers,
            hasBody: !!options.body
        });

        try {
            console.log('🔄 Sending API request...');
            const startTime = Date.now();
            
            const response = await fetch(url, options);
            const responseTime = Date.now() - startTime;
            
            console.log('📡 API Response received:', {
                status: response.status,
                statusText: response.statusText,
                responseTime: `${responseTime}ms`,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            if (!response.ok) {
                console.error('❌ API request failed with status:', response.status);
                console.error('Response status text:', response.statusText);
                
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Response data received:', {
                hasData: !!data,
                dataKeys: data ? Object.keys(data) : 'No data',
                dataSize: JSON.stringify(data).length
            });
            
            if (data.error) {
                console.error('❌ Facebook API returned error:', data.error);
                throw new Error(`API Error: ${data.error.message}`);
            }
            
            console.log('✅ API request completed successfully');
            console.log('=== API REQUEST END ===');
            
            return data;
        } catch (error) {
            console.error('❌ API Request Error:', error.message);
            console.error('Error type:', error.constructor.name);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                name: error.name,
                code: error.code,
                status: error.status
            });
            console.log('=== API REQUEST END WITH ERROR ===');
            throw error;
        }
    }

    // Get conversations for the page
    async getConversations() {
        console.log('=== GET CONVERSATIONS START ===');
        console.log('Fetching conversations for platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/conversations`, {
                'platform': this.platform,
                'fields': 'id,participants,updated_time'
            });
            
            console.log('✅ Conversations retrieved successfully');
            console.log('Result structure:', result ? Object.keys(result) : 'No result');
            console.log('=== GET CONVERSATIONS END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to get conversations:', error.message);
            console.log('=== GET CONVERSATIONS END WITH ERROR ===');
            throw error;
        }
    }

    // Get messages from a specific conversation
    async getConversationMessages(conversationId) {
        console.log('=== GET CONVERSATION MESSAGES START ===');
        console.log('Fetching messages for conversation:', conversationId);
        
        try {
            const result = await this.#sendApiRequest(`${conversationId}`, {
                'fields': 'id,messages{id,from,to,message,created_time}'
            });
            
            console.log('✅ Conversation messages retrieved successfully');
            console.log('Result structure:', result ? Object.keys(result) : 'No result');
            console.log('=== GET CONVERSATION MESSAGES END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to get conversation messages:', error.message);
            console.log('=== GET CONVERSATION MESSAGES END WITH ERROR ===');
            throw error;
        }
    }

    // Get detailed information about a specific message
    async getMessageDetails(messageId) {
        console.log('=== GET MESSAGE DETAILS START ===');
        console.log('Fetching details for message:', messageId);
        
        try {
            const result = await this.#sendApiRequest(`${messageId}`, {
                'fields': 'id,to,from,message,created_time,attachments'
            });
            
            console.log('✅ Message details retrieved successfully');
            console.log('Result structure:', result ? Object.keys(result) : 'No result');
            console.log('=== GET MESSAGE DETAILS END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to get message details:', error.message);
            console.log('=== GET MESSAGE DETAILS END WITH ERROR ===');
            throw error;
        }
    }

    // Send a text message
    async sendTextMessage(userId, message) {
        console.log('=== SEND TEXT MESSAGE START ===');
        console.log('Sending text message to user:', userId);
        console.log('Message content:', message);
        console.log('Message length:', message.length);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'messaging_type': 'RESPONSE',
                'message': { 'text': message }
            }, 'POST');
            
            console.log('✅ Text message sent successfully');
            console.log('API response:', result);
            console.log('=== SEND TEXT MESSAGE END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send text message:', error.message);
            console.log('=== SEND TEXT MESSAGE END WITH ERROR ===');
            throw error;
        }
    }

    // Send an image message
    async sendImage(userId, imageUrl) {
        console.log('=== SEND IMAGE MESSAGE START ===');
        console.log('Sending image message to user:', userId);
        console.log('Image URL:', imageUrl);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'messaging_type': 'RESPONSE',
                'message': {
                    'attachment': {
                        'type': 'image',
                        'payload': {
                            'url': imageUrl
                        }
                    }
                }
            }, 'POST');
            
            console.log('✅ Image message sent successfully');
            console.log('API response:', result);
            console.log('=== SEND IMAGE MESSAGE END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send image message:', error.message);
            console.log('=== SEND IMAGE MESSAGE END WITH ERROR ===');
            throw error;
        }
    }

    // Send a quick reply message
    async sendQuickReply(userId, message, quickReplies) {
        console.log('=== SEND QUICK REPLY START ===');
        console.log('Sending quick reply to user:', userId);
        console.log('Message content:', message);
        console.log('Quick replies count:', quickReplies.length);
        console.log('Quick replies:', quickReplies);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'messaging_type': 'RESPONSE',
                'message': {
                    'text': message,
                    'quick_replies': quickReplies
                }
            }, 'POST');
            
            console.log('✅ Quick reply sent successfully');
            console.log('API response:', result);
            console.log('=== SEND QUICK REPLY END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send quick reply:', error.message);
            console.log('=== SEND QUICK REPLY END WITH ERROR ===');
            throw error;
        }
    }

    // Send a button template
    async sendButtonTemplate(userId, text, buttons) {
        console.log('=== SEND BUTTON TEMPLATE START ===');
        console.log('Sending button template to user:', userId);
        console.log('Template text:', text);
        console.log('Buttons count:', buttons.length);
        console.log('Buttons:', buttons);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'messaging_type': 'RESPONSE',
                'message': {
                    'attachment': {
                        'type': 'template',
                        'payload': {
                            'template_type': 'button',
                            'text': text,
                            'buttons': buttons
                        }
                    }
                }
            }, 'POST');
            
            console.log('✅ Button template sent successfully');
            console.log('API response:', result);
            console.log('=== SEND BUTTON TEMPLATE END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send button template:', error.message);
            console.log('=== SEND BUTTON TEMPLATE END WITH ERROR ===');
            throw error;
        }
    }

    // Get user profile information
    async getUserProfile(userId) {
        console.log('=== GET USER PROFILE START ===');
        console.log('Fetching profile for user:', userId);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${userId}`, {
                'fields': 'id,name,first_name,last_name,profile_pic'
            });
            
            console.log('✅ User profile retrieved successfully');
            console.log('Profile data keys:', result ? Object.keys(result) : 'No profile data');
            console.log('=== GET USER PROFILE END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to get user profile:', error.message);
            console.log('=== GET USER PROFILE END WITH ERROR ===');
            throw error;
        }
    }

    // Mark message as seen
    async markAsSeen(userId) {
        console.log('=== MARK AS SEEN START ===');
        console.log('Marking message as seen for user:', userId);
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'sender_action': 'mark_seen'
            }, 'POST');
            
            console.log('✅ Message marked as seen successfully');
            console.log('API response:', result);
            console.log('=== MARK AS SEEN END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to mark message as seen:', error.message);
            console.log('=== MARK AS SEEN END WITH ERROR ===');
            throw error;
        }
    }

    // Send typing indicator
    async sendTypingIndicator(userId, typing = true) {
        console.log('=== TYPING INDICATOR START ===');
        console.log('Setting typing indicator for user:', userId);
        console.log('Typing state:', typing ? 'ON' : 'OFF');
        console.log('Platform:', this.platform);
        
        try {
            const result = await this.#sendApiRequest(`${this.pageId}/messages`, {
                'recipient': { 'id': userId },
                'sender_action': typing ? 'typing_on' : 'typing_off'
            }, 'POST');
            
            console.log('✅ Typing indicator set successfully');
            console.log('API response:', result);
            console.log('=== TYPING INDICATOR END ===');
            
            return result;
        } catch (error) {
            console.error('❌ Failed to set typing indicator:', error.message);
            console.log('=== TYPING INDICATOR END WITH ERROR ===');
            throw error;
        }
    }
}

module.exports = { Platforms, Messenger };

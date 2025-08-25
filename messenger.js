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
        this.apiVersion = '23.0'; // Updated to latest version
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
        
        const url = `${this.apiUrl}${api}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Add access token to parameters
        const params = {
            access_token: this.accessToken,
            ...parameters
        };
        
        console.log('Request parameters:', {
            hasAccessToken: !!params.access_token,
            accessTokenPreview: params.access_token ? params.access_token.substring(0, 10) + '...' : 'None',
            otherParams: Object.keys(params).filter(key => key !== 'access_token'),
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
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                name: error.name,
                code: error.code,
                status: error.status,
                statusCode: error.statusCode
            });
            throw error;
        }
    }

    // Send text message
    async sendTextMessage(userId, message) {
        console.log('=== SEND TEXT MESSAGE ===');
        console.log('User ID:', userId);
        console.log('Message:', message);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: { text: message },
            messaging_type: 'RESPONSE' // Updated to use proper messaging type
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Text message sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send text message:', error.message);
            throw error;
        }
    }

    // Send image message
    async sendImage(userId, imageUrl) {
        console.log('=== SEND IMAGE MESSAGE ===');
        console.log('User ID:', userId);
        console.log('Image URL:', imageUrl);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                attachment: {
                    type: 'image',
                    payload: {
                        url: imageUrl,
                        is_reusable: true // New v23.0 feature for reusable attachments
                    }
                }
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Image message sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send image message:', error.message);
            throw error;
        }
    }

    // Send quick reply
    async sendQuickReply(userId, message, quickReplies) {
        console.log('=== SEND QUICK REPLY ===');
        console.log('User ID:', userId);
        console.log('Message:', message);
        console.log('Quick replies:', quickReplies);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                text: message,
                quick_replies: quickReplies.map(reply => ({
                    content_type: reply.content_type,
                    title: reply.title,
                    payload: reply.payload,
                    image_url: reply.image_url // New v23.0 feature for quick reply images
                }))
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Quick reply sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send quick reply:', error.message);
            throw error;
        }
    }

    // Send button template
    async sendButtonTemplate(userId, text, buttons) {
        console.log('=== SEND BUTTON TEMPLATE ===');
        console.log('User ID:', userId);
        console.log('Text:', text);
        console.log('Buttons:', buttons);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: text,
                        buttons: buttons.map(button => ({
                            type: button.type,
                            title: button.title,
                            url: button.url,
                            payload: button.payload,
                            webview_height_ratio: button.webview_height_ratio || 'full', // New v23.0 feature
                            messenger_extensions: button.messenger_extensions || false, // New v23.0 feature
                            fallback_url: button.fallback_url // New v23.0 feature
                        }))
                    }
                }
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Button template sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send button template:', error.message);
            throw error;
        }
    }

    // Send generic template (new v23.0 feature)
    async sendGenericTemplate(userId, elements) {
        console.log('=== SEND GENERIC TEMPLATE ===');
        console.log('User ID:', userId);
        console.log('Elements:', elements);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: elements.map(element => ({
                            title: element.title,
                            subtitle: element.subtitle,
                            image_url: element.image_url,
                            default_action: element.default_action,
                            buttons: element.buttons?.map(button => ({
                                type: button.type,
                                title: button.title,
                                url: button.url,
                                payload: button.payload,
                                webview_height_ratio: button.webview_height_ratio || 'full',
                                messenger_extensions: button.messenger_extensions || false,
                                fallback_url: button.fallback_url
                            }))
                        }))
                    }
                }
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Generic template sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send generic template:', error.message);
            throw error;
        }
    }

    // Send list template (new v23.0 feature)
    async sendListTemplate(userId, elements, buttons = null) {
        console.log('=== SEND LIST TEMPLATE ===');
        console.log('User ID:', userId);
        console.log('Elements:', elements);
        console.log('Buttons:', buttons);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'list',
                        top_element_style: 'compact',
                        elements: elements.map(element => ({
                            title: element.title,
                            subtitle: element.subtitle,
                            image_url: element.image_url,
                            default_action: element.default_action,
                            buttons: element.buttons?.map(button => ({
                                type: button.type,
                                title: button.title,
                                url: button.url,
                                payload: button.payload
                            }))
                        })),
                        buttons: buttons?.map(button => ({
                            type: button.type,
                            title: button.title,
                            url: button.url,
                            payload: button.payload
                        }))
                    }
                }
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ List template sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send list template:', error.message);
            throw error;
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        console.log('=== GET USER PROFILE ===');
        console.log('User ID:', userId);
        
        const api = `/${userId}`;
        const parameters = {
            fields: 'id,name,first_name,last_name,profile_pic,locale,timezone,gender,is_payment_enabled,last_ad_referral' // Updated fields for v23.0
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'GET');
            console.log('✅ User profile retrieved successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to get user profile:', error.message);
            throw error;
        }
    }

    // Get conversations
    async getConversations() {
        console.log('=== GET CONVERSATIONS ===');
        
        const api = `/${this.pageId}/conversations`;
        const parameters = {
            fields: 'id,snippet,updated_time,message_count,unread_count,can_reply,is_subscribed' // Updated fields for v23.0
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'GET');
            console.log('✅ Conversations retrieved successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to get conversations:', error.message);
            throw error;
        }
    }

    // Mark message as seen
    async markAsSeen(userId) {
        console.log('=== MARK AS SEEN ===');
        console.log('User ID:', userId);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            sender_action: 'mark_seen'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Message marked as seen successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to mark message as seen:', error.message);
            throw error;
        }
    }

    // Send typing indicator
    async sendTypingIndicator(userId, typing) {
        console.log('=== SEND TYPING INDICATOR ===');
        console.log('User ID:', userId);
        console.log('Typing:', typing);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            sender_action: typing ? 'typing_on' : 'typing_off'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Typing indicator sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send typing indicator:', error.message);
            throw error;
        }
    }

    // Send reaction (new v23.0 feature)
    async sendReaction(userId, messageId, reaction) {
        console.log('=== SEND REACTION ===');
        console.log('User ID:', userId);
        console.log('Message ID:', messageId);
        console.log('Reaction:', reaction);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: {
                reaction: reaction
            },
            messaging_type: 'RESPONSE'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ Reaction sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send reaction:', error.message);
            throw error;
        }
    }

    // Get page insights (new v23.0 feature)
    async getPageInsights(metrics = ['messages_received', 'messages_sent']) {
        console.log('=== GET PAGE INSIGHTS ===');
        console.log('Metrics:', metrics);
        
        const api = `/${this.pageId}/insights`;
        const parameters = {
            metric: metrics.join(','),
            period: 'day_28'
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'GET');
            console.log('✅ Page insights retrieved successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to get page insights:', error.message);
            throw error;
        }
    }

    // Send one-time notification (new v23.0 feature)
    async sendOneTimeNotification(userId, message, notificationType = 'REGULAR') {
        console.log('=== SEND ONE-TIME NOTIFICATION ===');
        console.log('User ID:', userId);
        console.log('Message:', message);
        console.log('Notification Type:', notificationType);
        
        const api = `/${this.pageId}/messages`;
        const parameters = {
            recipient: { id: userId },
            message: { text: message },
            messaging_type: 'MESSAGE_TAG',
            tag: notificationType
        };
        
        console.log('API call parameters:', parameters);
        
        try {
            const result = await this.#sendApiRequest(api, parameters, 'POST');
            console.log('✅ One-time notification sent successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to send one-time notification:', error.message);
            throw error;
        }
    }
}

module.exports = { Platforms, Messenger };

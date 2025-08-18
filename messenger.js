const fetch = require('node-fetch');

const Platforms = {
    Messenger: 'messenger',
    Instagram: 'instagram'
};

class Messenger {
    constructor(platform, pageId, accessToken) {
        this.apiDomain = 'graph.facebook.com';
        this.apiVersion = '18.0';
        this.apiUrl = `https://${this.apiDomain}/v${this.apiVersion}`;
        this.platform = platform;
        this.pageId = pageId;
        this.accessToken = accessToken;
    }

    async #sendApiRequest(api, parameters, method = 'GET') {
        parameters['access_token'] = this.accessToken;
        const queryString = new URLSearchParams(parameters);
        
        const url = method === 'GET' 
            ? `${this.apiUrl}/${api}?${queryString.toString()}`
            : `${this.apiUrl}/${api}`;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'POST') {
            options.body = JSON.stringify(parameters);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Get conversations for the page
    async getConversations() {
        return await this.#sendApiRequest(`${this.pageId}/conversations`, {
            'platform': this.platform,
            'fields': 'id,participants,updated_time'
        });
    }

    // Get messages from a specific conversation
    async getConversationMessages(conversationId) {
        return await this.#sendApiRequest(`${conversationId}`, {
            'fields': 'id,messages{id,from,to,message,created_time}'
        });
    }

    // Get detailed information about a specific message
    async getMessageDetails(messageId) {
        return await this.#sendApiRequest(`${messageId}`, {
            'fields': 'id,to,from,message,created_time,attachments'
        });
    }

    // Send a text message
    async sendTextMessage(userId, message) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
            'recipient': { 'id': userId },
            'messaging_type': 'RESPONSE',
            'message': { 'text': message }
        }, 'POST');
    }

    // Send an image message
    async sendImage(userId, imageUrl) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
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
    }

    // Send a quick reply message
    async sendQuickReply(userId, message, quickReplies) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
            'recipient': { 'id': userId },
            'messaging_type': 'RESPONSE',
            'message': {
                'text': message,
                'quick_replies': quickReplies
            }
        }, 'POST');
    }

    // Send a button template
    async sendButtonTemplate(userId, text, buttons) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
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
    }

    // Get user profile information
    async getUserProfile(userId) {
        return await this.#sendApiRequest(`${userId}`, {
            'fields': 'id,name,first_name,last_name,profile_pic'
        });
    }

    // Mark message as seen
    async markAsSeen(userId) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
            'recipient': { 'id': userId },
            'sender_action': 'mark_seen'
        }, 'POST');
    }

    // Send typing indicator
    async sendTypingIndicator(userId, typing = true) {
        return await this.#sendApiRequest(`${this.pageId}/messages`, {
            'recipient': { 'id': userId },
            'sender_action': typing ? 'typing_on' : 'typing_off'
        }, 'POST');
    }
}

module.exports = { Platforms, Messenger };

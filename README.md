# Facebook Messenger Platform API - Express.js Integration

A complete Express.js implementation for integrating with Facebook Messenger Platform and Instagram Platform APIs. This project provides a robust foundation for building chatbots and automated messaging systems.

## 🚀 Features

- **Webhook Integration**: Handle incoming messages from Facebook Messenger and Instagram
- **Message Sending**: Send text, images, quick replies, and button templates
- **User Management**: Get user profiles and conversation history
- **Platform Support**: Both Facebook Messenger and Instagram
- **RESTful API**: Clean endpoints for manual message sending
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Webhook verification and request signature validation

## 📋 Prerequisites

- Node.js 14.0.0 or higher
- Facebook Developer Account
- Facebook Page with Messenger enabled
- Instagram Business Account (optional, for Instagram messaging)

## 🛠️ Installation

1. **Clone or download the project files**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `env.example` to `.env`
   - Fill in your Facebook app credentials

4. **Create a `.env` file with:**
   ```env
   PAGE_ID=your_page_id_here
   PAGE_ACCESS_TOKEN=your_page_access_token_here
   VERIFY_TOKEN=your_webhook_verify_token_here
   INSTAGRAM_USERNAME=your_instagram_username
   PORT=3000
   NODE_ENV=development
   ```

## 🔧 Configuration

### Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add Messenger product to your app
4. Generate a Page Access Token
5. Set up webhook subscription
6. Configure webhook URL: `https://your-domain.com/webhook`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PAGE_ID` | Your Facebook Page ID | Yes |
| `PAGE_ACCESS_TOKEN` | Page Access Token from Facebook | Yes |
| `VERIFY_TOKEN` | Custom token for webhook verification | Yes |
| `INSTAGRAM_USERNAME` | Instagram username (for Instagram messaging) | No |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## 🚀 Usage

### Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Webhook Endpoints

- **GET `/webhook`**: Webhook verification for Facebook
- **POST `/webhook`**: Receive incoming messages

### API Endpoints

#### Send Messages

```bash
# Send text message
POST /api/send-message
{
  "userId": "recipient_user_id",
  "message": "Hello from your bot!",
  "platform": "messenger" // or "instagram"
}

# Send image
POST /api/send-image
{
  "userId": "recipient_user_id",
  "imageUrl": "https://example.com/image.jpg",
  "platform": "messenger"
}
```

#### Get Information

```bash
# Get conversations
GET /api/conversations?platform=messenger

# Get user profile
GET /api/user/:userId?platform=messenger

# Health check
GET /health
```

## 📱 Message Types Supported

### Text Messages
```javascript
await messenger.sendTextMessage(userId, "Hello World!");
```

### Images
```javascript
await messenger.sendImage(userId, "https://example.com/image.jpg");
```

### Quick Replies
```javascript
const quickReplies = [
  {
    content_type: 'text',
    title: 'Option 1',
    payload: 'OPTION_1'
  },
  {
    content_type: 'text',
    title: 'Option 2',
    payload: 'OPTION_2'
  }
];

await messenger.sendQuickReply(userId, "Choose an option:", quickReplies);
```

### Button Templates
```javascript
const buttons = [
  {
    type: 'web_url',
    url: 'https://example.com',
    title: 'Visit Website'
  },
  {
    type: 'postback',
    title: 'Get Started',
    payload: 'GET_STARTED'
  }
];

await messenger.sendButtonTemplate(userId, "Here are your options:", buttons);
```

### Typing Indicators
```javascript
// Show typing indicator
await messenger.sendTypingIndicator(userId, true);

// Hide typing indicator
await messenger.sendTypingIndicator(userId, false);
```

## 🔄 Webhook Processing

The server automatically processes incoming messages and responds based on content:

- **"hello" or "hi"**: Sends greeting message
- **"help"**: Sends quick reply options
- **"button"**: Sends button template
- **Other messages**: Sends default response

## 🧪 Testing

### Local Testing with ngrok

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your server:**
   ```bash
   npm start
   ```

3. **Expose local server:**
   ```bash
   ngrok http 3000
   ```

4. **Use the ngrok URL as your webhook URL in Facebook app settings**

### Test Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test message sending (replace with actual userId)
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","message":"Hello!"}'
```

## 📚 API Reference

### Messenger Class Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `sendTextMessage()` | Send text message | userId, message |
| `sendImage()` | Send image | userId, imageUrl |
| `sendQuickReply()` | Send quick reply | userId, message, quickReplies |
| `sendButtonTemplate()` | Send button template | userId, text, buttons |
| `getUserProfile()` | Get user profile | userId |
| `getConversations()` | Get conversations | - |
| `markAsSeen()` | Mark message as seen | userId |
| `sendTypingIndicator()` | Show/hide typing | userId, typing |

## 🚨 Error Handling

The application includes comprehensive error handling:

- API request failures
- Invalid webhook data
- Missing environment variables
- Network errors
- Facebook API errors

## 🔒 Security Considerations

- **Webhook Verification**: Verifies webhook tokens
- **Request Signatures**: Validates request signatures (production-ready implementation needed)
- **Environment Variables**: Sensitive data stored in environment variables
- **Input Validation**: Validates all incoming requests

## 🚀 Production Deployment

1. **Set environment variables on your hosting platform**
2. **Use HTTPS for webhook URLs**
3. **Implement proper signature verification**
4. **Set up monitoring and logging**
5. **Use environment-specific configurations**

## 📖 Examples

### Basic Bot Response
```javascript
// In processMessage function
if (message.text.includes('weather')) {
  await messenger.sendTextMessage(senderId, 'The weather is sunny today!');
}
```

### Custom Quick Reply
```javascript
const customReplies = [
  { content_type: 'text', title: 'Yes', payload: 'YES' },
  { content_type: 'text', title: 'No', payload: 'NO' }
];

await messenger.sendQuickReply(userId, 'Do you want to continue?', customReplies);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Resources

- [Facebook Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform/)
- [Instagram Platform Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/)

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review error logs
3. Verify environment variables
4. Test with Facebook's webhook testing tool

---

**Happy Coding! 🎉**

# Facebook Messenger Platform API - Express.js Integration

A complete Express.js implementation for integrating with Facebook Messenger Platform and Instagram Platform APIs. This project provides a robust foundation for building chatbots and automated messaging systems with **comprehensive logging and debugging capabilities**.

## 🚀 Features

- **Webhook Integration**: Handle incoming messages from Facebook Messenger and Instagram
- **Message Sending**: Send text, images, quick replies, and button templates
- **User Management**: Get user profiles and conversation history
- **Platform Support**: Both Facebook Messenger and Instagram
- **RESTful API**: Clean endpoints for manual message sending
- **Enhanced Logging**: Comprehensive server-side and browser console logging
- **Error Handling**: Detailed error tracking with stack traces and context
- **Security**: Webhook verification and request signature validation
- **Performance Monitoring**: Response time tracking and metrics
- **Browser Integration**: Client-side logging utilities for debugging

## 📊 Enhanced Logging System

### Server-Side Logging
- **Structured Logging**: Organized log levels (ERROR, WARN, INFO, DEBUG, TRACE)
- **Timestamp Tracking**: ISO format timestamps for all operations
- **Context Awareness**: Detailed context for errors and operations
- **Performance Metrics**: Response time tracking for all API calls
- **File Logging**: Automatic log file creation in `logs/` directory
- **Color-Coded Output**: Visual distinction between log types

### Browser Console Logging
- **Client-Side Integration**: Automatic logging in browser console
- **Styled Output**: Color-coded and organized log messages
- **Session Tracking**: Unique session IDs for debugging
- **Request Correlation**: Link server and client logs via request IDs
- **Storage Management**: Session storage for log persistence
- **Export Capabilities**: Download logs as JSON files

### Response Logging
- **Automatic Inclusion**: All API responses include `_logging` object
- **Request Tracking**: Unique request IDs and timestamps
- **Performance Data**: Response time and server information
- **Debug Information**: Environment details and server status

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
   LOG_LEVEL=INFO
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PAGE_ID` | Your Facebook Page ID | Yes | - |
| `PAGE_ACCESS_TOKEN` | Page Access Token from Facebook | Yes | - |
| `VERIFY_TOKEN` | Custom token for webhook verification | Yes | - |
| `INSTAGRAM_USERNAME` | Instagram username (for Instagram messaging) | No | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `LOG_LEVEL` | Logging level (ERROR, WARN, INFO, DEBUG, TRACE) | No | INFO |

### Logging Levels

- **ERROR** ❌ - Critical errors that need immediate attention
- **WARN** ⚠️ - Warning conditions that might cause issues
- **INFO** ℹ️ - General information about operations
- **DEBUG** 🔍 - Detailed debugging information
- **TRACE** 🔎 - Most detailed tracing information

## 🚀 Usage

### Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Verbose logging mode (shows all debug info)
npm run dev:verbose

# Production mode
npm start
```

### Log Management

```bash
# View real-time logs
npm run logs:watch

# Clear logs
npm run logs:clear

# Check log file sizes
ls -la logs/
```

### Browser Console Logging

Include the browser logging utility in your HTML:

```html
<script src="browser-logging.js"></script>
```

Access logging utilities:

```javascript
// Get logger status
const status = window.messengerLoggerUtils.getStatus();

// Clear logs
window.messengerLoggerUtils.clearLogs();

// Export logs
window.messengerLoggerUtils.exportLogs();

// Toggle logging
window.messengerLoggerUtils.setEnabled(false);
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

### Test Page
Open `test-page.html` in your browser to test:
- API endpoints
- Browser console logging
- Custom log messages
- Webhook simulation

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

### Enhanced Response Format

All API responses now include a `_logging` object:

```json
{
  "success": true,
  "result": { ... },
  "_logging": {
    "timestamp": "2024-01-15T10:30:45.123Z",
    "requestId": "1705311045123",
    "responseTime": "45ms",
    "platform": "messenger",
    "serverInfo": {
      "nodeEnv": "development",
      "version": "1.0.0"
    }
  }
}
```

## 🚨 Error Handling

The application includes comprehensive error handling:

- **Detailed Error Logging**: Error type, message, stack trace, and context
- **Response Headers**: X-Response-Time and X-Request-ID headers
- **Structured Error Responses**: Consistent error format with logging info
- **Graceful Degradation**: Fallback responses when operations fail

## 🔒 Security Considerations

- **Webhook Verification**: Verifies webhook tokens
- **Request Signatures**: Validates request signatures (production-ready implementation needed)
- **Environment Variables**: Sensitive data stored in environment variables
- **Input Validation**: Validates all incoming requests
- **Log Sanitization**: Removes sensitive data from logs

## 🚀 Production Deployment

1. **Set environment variables on your hosting platform**
2. **Use HTTPS for webhook URLs**
3. **Implement proper signature verification**
4. **Set up monitoring and logging**
5. **Use environment-specific configurations**
6. **Set appropriate log levels for production**

## 📖 Examples

### Custom Logging
```javascript
// Server-side
const { log } = require('./app');
log.info('Custom operation', { userId, action });

// Browser-side
window.messengerLogger.info('User action', { action: 'click', element: 'button' });
```

### Performance Monitoring
```javascript
// Server automatically tracks response times
// Browser can access performance data from _logging object
const response = await fetch('/api/send-message', options);
const data = await response.json();
console.log('Response time:', data._logging.responseTime);
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
1. Check the comprehensive debugging guide (`DEBUGGING.md`)
2. Review server and browser console logs
3. Verify environment variables
4. Test with the provided test page
5. Use the logging utilities for debugging

## 🆕 What's New

### Enhanced Logging (v2.0)
- **Structured Server Logging**: Organized, timestamped, and categorized logs
- **Browser Console Integration**: Client-side logging with styling and utilities
- **Response Logging**: Automatic inclusion of debugging information
- **Performance Tracking**: Response time monitoring for all operations
- **File Logging**: Persistent log storage with rotation
- **Test Page**: Interactive testing interface for all features

---

**Happy Coding! 🎉**

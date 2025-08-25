# 🐛 Comprehensive Debugging Guide for Messenger API

This guide will help you understand the logging system and troubleshoot common issues in your Messenger API integration.

## 📊 Logging System Overview

The project now includes a comprehensive logging system that tracks:

- **API Requests/Responses** - All Facebook API calls with timing and status
- **Webhook Events** - Incoming messages and verification
- **Message Processing** - Bot logic and response generation
- **Error Handling** - Detailed error information with stack traces
- **Performance Metrics** - Response times and operation duration
- **User Interactions** - Message flows and user actions

## 🚀 Getting Started with Logging

### 1. Start the Server with Logging

```bash
# Normal development mode
npm run dev

# Verbose logging mode (shows all debug info)
npm run dev:verbose

# Production mode
npm start
```

### 2. Check Log Files

Logs are automatically saved to the `logs/` directory:

```bash
# View real-time logs
npm run logs:watch

# Clear logs
npm run logs:clear

# Check log file sizes
ls -la logs/
```

## 🔍 Understanding Log Output

### Log Levels

- **ERROR** ❌ - Critical errors that need immediate attention
- **WARN** ⚠️ - Warning conditions that might cause issues
- **INFO** ℹ️ - General information about operations
- **DEBUG** 🔍 - Detailed debugging information
- **TRACE** 🔎 - Most detailed tracing information

### Log Format

```
[2024-01-15T10:30:45.123Z] 📱 INFO  Webhook Event: message_received
{
  "type": "message_received",
  "platform": "messenger",
  "data": {
    "entry": [
      {
        "id": "123456789",
        "time": 1705311045,
        "messagingCount": 1
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## 🐛 Common Issues and Solutions

### 1. Webhook Verification Fails

**Symptoms:**
- Facebook shows "Webhook verification failed"
- Console shows "❌ Webhook verification failed"

**Debug Steps:**
```bash
# Check environment variables
curl http://localhost:3000/health

# Verify webhook URL format
# Should be: https://your-domain.com/webhook

# Check VERIFY_TOKEN matches in .env and Facebook app settings
```

**Common Causes:**
- `VERIFY_TOKEN` mismatch between .env and Facebook app
- Webhook URL not accessible from internet
- Server not running when Facebook tries to verify

### 2. Messages Not Being Received

**Symptoms:**
- No webhook logs in console
- Facebook shows webhook as "Not receiving events"

**Debug Steps:**
```bash
# Check if webhook endpoint is accessible
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Verify server is running and accessible
curl http://localhost:3000/health

# Check Facebook app webhook subscription status
```

**Common Causes:**
- Server not accessible from internet (need ngrok for local testing)
- Webhook URL incorrect in Facebook app settings
- Server firewall blocking incoming requests

### 3. API Calls Failing

**Symptoms:**
- Console shows "❌ API Request Error"
- Messages not being sent to users

**Debug Steps:**
```bash
# Check environment variables
echo $PAGE_ID
echo $PAGE_ACCESS_TOKEN

# Test API endpoint manually
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","message":"Hello"}'
```

**Common Causes:**
- Invalid or expired `PAGE_ACCESS_TOKEN`
- Incorrect `PAGE_ID`
- Facebook app not properly configured
- Token permissions insufficient

### 4. Bot Not Responding

**Symptoms:**
- Messages received but no responses sent
- Console shows webhook received but no bot logic execution

**Debug Steps:**
```bash
# Check message processing logs
# Look for "=== MESSAGE PROCESSING START ===" logs

# Verify bot logic in processMessage function
# Check if message.text exists and contains expected keywords
```

**Common Causes:**
- Message format different than expected
- Bot logic conditions not met
- Error in response generation
- Facebook API rate limiting

## 🔧 Advanced Debugging Techniques

### 1. Enable Verbose Logging

```bash
# Set environment variable for maximum logging
export LOG_LEVEL=TRACE
npm run dev

# Or use the verbose script
npm run dev:verbose
```

### 2. Monitor Specific Operations

```bash
# Watch for specific log patterns
npm run logs:watch | grep "API REQUEST"
npm run logs:watch | grep "ERROR"
npm run logs:watch | grep "Webhook Event"
```

### 3. Test Individual Components

```bash
# Test webhook verification
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Test message sending
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","message":"Hello","platform":"messenger"}'

# Test health endpoint
curl http://localhost:3000/health
```

### 4. Analyze Log Files

```bash
# Find all errors
grep "ERROR" logs/app.log

# Find webhook events
grep "Webhook Event" logs/app.log

# Find API requests
grep "API Request" logs/app.log

# Find performance issues (slow responses)
grep "Performance" logs/app.log
```

## 📱 Facebook-Specific Debugging

### 1. Check Facebook App Status

- Go to [Facebook Developers](https://developers.facebook.com/)
- Select your app
- Check Messenger > Settings
- Verify webhook subscription status

### 2. Test Webhook with Facebook Tools

- Use Facebook's webhook testing tool
- Send test messages from Facebook
- Check webhook delivery status

### 3. Verify Token Permissions

- Check `PAGE_ACCESS_TOKEN` has required permissions:
  - `pages_messaging`
  - `pages_read_engagement`
  - `pages_show_list`

### 4. Monitor Facebook App Insights

- Check message delivery rates
- Monitor webhook response times
- Review error rates and types

## 🚨 Emergency Debugging

### 1. Server Won't Start

```bash
# Check for syntax errors
node -c app.js

# Check for missing dependencies
npm install

# Check environment variables
cat .env

# Check port availability
netstat -an | grep :3000
```

### 2. Complete System Failure

```bash
# Stop all processes
pkill -f "node app.js"

# Clear logs
npm run logs:clear

# Restart with fresh state
npm start
```

### 3. Database/Storage Issues

```bash
# Check disk space
df -h

# Check file permissions
ls -la logs/
ls -la .env

# Verify file integrity
file app.js
file messenger.js
```

## 📊 Performance Monitoring

### 1. Response Time Analysis

```bash
# Find slow API calls
grep "Performance" logs/app.log | grep "ms"

# Monitor webhook processing time
grep "Webhook Event" logs/app.log
```

### 2. Error Rate Monitoring

```bash
# Count errors by type
grep "ERROR" logs/app.log | wc -l

# Find most common errors
grep "ERROR" logs/app.log | sort | uniq -c | sort -nr
```

### 3. API Usage Tracking

```bash
# Count API requests
grep "API Request" logs/app.log | wc -l

# Monitor rate limiting
grep "rate limit" logs/app.log
```

## 🛠️ Custom Debugging

### 1. Add Custom Log Points

```javascript
// In your code, add specific logging
const { logger } = require('./logging-config');

logger.info('Custom debug point', { 
    userId: senderId, 
    messageType: 'custom',
    customData: 'value'
});
```

### 2. Create Debug Endpoints

```javascript
// Add to app.js for debugging
app.get('/debug/logs', (req, res) => {
    const stats = logger.getLogStats();
    res.json(stats);
});

app.get('/debug/clear', (req, res) => {
    logger.clearLogs();
    res.json({ message: 'Logs cleared' });
});
```

### 3. Environment-Specific Logging

```bash
# Development - full logging
export LOG_LEVEL=TRACE
export NODE_ENV=development

# Production - minimal logging
export LOG_LEVEL=ERROR
export NODE_ENV=production
```

## 📚 Additional Resources

- [Facebook Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform/)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check the logs first** - Most issues are visible in the detailed logs
2. **Verify environment variables** - Ensure all required values are set
3. **Test with Facebook tools** - Use official testing utilities
4. **Check network connectivity** - Ensure server is accessible from internet
5. **Review recent changes** - What was modified before the issue appeared

Remember: The comprehensive logging system should provide detailed information about what's happening at each step of the process!

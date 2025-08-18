# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `env.example` to `.env` and fill in your Facebook app credentials:
```bash
cp env.example .env
```

Edit `.env` with your actual values:
```env
PAGE_ID=your_facebook_page_id
PAGE_ACCESS_TOKEN=your_page_access_token
VERIFY_TOKEN=your_custom_webhook_token
PORT=3000
```

### 3. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev

# Test server (for testing without Facebook webhooks)
npm run test-server
```

### 4. Test Your Setup
- Main server: http://localhost:3000
- Test server: http://localhost:3001/test
- Health check: http://localhost:3000/health

## 🔑 Getting Facebook Credentials

### Facebook Page ID
1. Go to your Facebook Page
2. Click "About" in the left sidebar
3. Your Page ID is listed under "Page ID"

### Page Access Token
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to "Messenger" → "Settings"
4. Generate a Page Access Token

### Webhook Verify Token
Create any random string (e.g., "my_secret_token_123")

## 📱 Testing Without Facebook

Use the test server to test all functionality locally:
```bash
npm run test-server
```

Test endpoints available at:
- http://localhost:3001/test/send-message
- http://localhost:3001/test/send-image
- http://localhost:3001/test/send-quick-reply
- And more...

## 🌐 Production Deployment

1. Set environment variables on your hosting platform
2. Use HTTPS for webhook URLs
3. Set up proper domain and SSL
4. Configure Facebook webhook URL to: `https://yourdomain.com/webhook`

## 🆘 Common Issues

**"Missing environment variables"**
- Check your `.env` file exists
- Verify all required variables are set

**"API Error: Invalid access token"**
- Regenerate your Page Access Token
- Ensure token has proper permissions

**"Webhook verification failed"**
- Check VERIFY_TOKEN matches Facebook app settings
- Ensure webhook URL is correct

## 📚 Next Steps

1. Customize the bot logic in `processMessage()` function
2. Add more message types and templates
3. Integrate with your business logic
4. Set up monitoring and logging
5. Deploy to production

---

**Need help?** Check the main README.md for detailed documentation!

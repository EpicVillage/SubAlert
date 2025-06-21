# SubAlert 🔔

A modern subscription and API key tracker with expiry notifications. Never forget to renew your subscriptions or rotate your API keys again!

![SubAlert Preview](https://img.shields.io/badge/PWA-Ready-5A9FD4?style=flat-square&logo=pwa)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19.1+-61DAFB?style=flat-square&logo=react)

## ✨ Features

### Core Features
- 📊 **Dashboard View** - See all your subscriptions at a glance with stats
- 🔍 **Search & Filter** - Find subscriptions quickly by name or category
- 📁 **Custom Categories** - Organize with drag-and-drop categories
- 🎨 **Dark Mode** - Easy on the eyes with automatic theme detection
- 🤖 **AI Recommendations** - Get smart cost-saving insights with your own API key
- 🔄 **Auto-Renewal Tracking** - Smart handling of recurring subscriptions

### AI-Powered Analysis
- 🎯 **Feature Comparison Matrix** - Compare your services with alternatives side-by-side
- 💡 **Smart Recommendations** - Get specific alternative service suggestions
- 💰 **Cost Analysis** - See potential savings with detailed breakdowns
- 📊 **Visual Comparisons** - Feature-by-feature comparison tables
- ✨ **Multiple AI Providers** - Support for OpenAI and Anthropic Claude

### Security & Privacy
- 🔐 **Password Protected Exports** - Encrypt your backups with AES-256-GCM
- 🔏 **Biometric Lock** - Fingerprint/Face ID protection on supported devices
- 💾 **Local Storage** - All data stays on your device
- 🔒 **Secure API Storage** - API keys are stored safely
- 🛡️ **Zero External Dependencies** - No tracking or analytics

### Notifications & Alerts
- 💬 **Telegram Integration** - Get notified before subscriptions expire
- ⏰ **Smart Reminders** - Customizable notification timing
- 📅 **Expiry Tracking** - Visual indicators for expiring subscriptions
- 🔄 **Auto-Renewal Awareness** - Different handling for auto-renewing vs expiring subscriptions

### Data Management
- 📤 **Export/Import** - Backup your data with optional encryption
- 🔄 **Drag & Drop** - Reorganize subscriptions between categories
- ✏️ **Bulk Edit Mode** - Manage multiple items efficiently
- 📝 **Rich Service Details** - Add descriptions and websites for better tracking

### Visual Design
- 🎨 **Glassmorphic UI** - Modern, translucent design elements
- 🖼️ **Custom Branding** - Beautiful SubAlert logo with Arinza font
- 🌓 **Theme-Aware Logo** - Different logos for light/dark modes
- 📱 **Responsive Design** - Works perfectly on all devices

## 🚀 Installation

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/subalert.git
cd subalert
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

5. Deploy to Vercel (recommended):
```bash
vercel
```

## 📱 PWA Installation

### On Desktop (Chrome/Edge):
1. Visit the app URL
2. Click the install icon in the address bar
3. Follow the prompts to install

### On Mobile:
1. Visit the app URL
2. Tap "Add to Home Screen" in your browser menu
3. The app will install and be available offline

## 💬 Setting Up Telegram Notifications

1. Create a Telegram bot:
   - Message @BotFather on Telegram
   - Send `/newbot` and follow instructions
   - Save the bot token

2. Get your Chat ID:
   - Start a chat with your bot
   - Send any message
   - Visit: `https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates`
   - Find your chat ID in the response

3. Configure in the app:
   - Click the settings icon (⚙️)
   - Enter your bot token and chat ID
   - Test the connection
   - Enable notifications

## 🤖 AI Integration

SubAlert supports AI-powered subscription analysis using your own API keys. No data is sent to our servers - everything runs locally in your browser.

### Supported Providers:
- **OpenAI** (GPT-3.5-Turbo)
- **Anthropic** (Claude 3 Haiku)

### Setup:
1. Click the 🤖 AI button in the header
2. Choose your provider
3. Enter your API key
4. Start getting recommendations!

### Features:
- **Feature Comparison Matrix** - See detailed feature comparisons
- **Cost-Saving Analysis** - Identify potential savings
- **Alternative Suggestions** - Get specific service recommendations
- **Visual Comparisons** - Side-by-side feature tables
- **Pros & Cons Analysis** - Understand tradeoffs

### Important Note:
AI features require deployment to Vercel or another platform due to CORS restrictions. The app automatically uses the included proxy endpoint when deployed.

## 📖 Usage

### Adding a Subscription
1. Click "+ Add" button
2. Fill in the required details:
   - **Service Name** (required)
   - **Service Description** - What does this service do?
   - **Website** - Service URL for reference
   - **Category** - Choose from existing or create custom
   - **Subscription Type** - Free or Paid
   - **Associated Email** (required)
   - **API Key** (optional) - Click "+ Add API Key" to reveal field
   - For paid subscriptions:
     - **Cost** (required)
     - **Billing Cycle** - Monthly, Yearly, or One-time
     - **Auto-renews** - Toggle for recurring subscriptions
     - **Next Billing/Expiry Date** (required for recurring)
3. Click "Add API" to save

### Managing Subscriptions
- **Edit Mode**: Toggle edit mode to show/hide action buttons
- **View/Hide API Keys**: Click the eye icon (👁️) - only shows if API key exists
- **Copy API Key**: One-click copy with visual feedback
- **Compare Alternatives**: Available for paid subscriptions
- **Auto-Renewal Tracking**: See "Next Billing" instead of "Expires" for auto-renewing subscriptions
- **Search**: Real-time search by service name
- **Filter**: Quick filters for All, Expiring Soon, Paid, Free
- **Drag & Drop**: Reorganize between categories

### Feature Comparison
1. Click "Compare Alternatives" on any paid subscription
2. AI analyzes your service and suggests 2 alternatives
3. View detailed comparison:
   - Current service features
   - Alternative services with costs
   - Feature-by-feature comparison table
   - Pros and cons for each alternative
   - Savings percentage
   - Personalized recommendations

### Category Management
1. Click "🏷️ Categories" button
2. Options:
   - **Add Custom Category**: Create with name, color, and emoji
   - **Edit Categories**: Modify any category (including defaults)
   - **Delete Categories**: Remove custom categories
   - **Drag & Drop**: Reorder categories

### Data Backup
- **Export Options**:
  - Standard JSON export
  - Password-protected encrypted export (AES-256-GCM)
  - Includes all settings, categories, and AI configuration
- **Import**: Upload and restore from backup files
- **Auto-validation**: Ensures data integrity on import

## 🔒 Security Features

### Biometric Authentication
- Available on supported mobile devices
- Uses device fingerprint/Face ID
- Auto-locks after 5 minutes of inactivity
- Enable in Settings → Security

### Password-Protected Exports
- Encrypt backups with strong passwords
- Uses AES-256-GCM encryption
- Passwords never stored
- Secure key derivation with PBKDF2

### Data Privacy
- **100% Local Storage** - All data stays on your device
- **No Analytics** - Zero tracking or telemetry
- **No External APIs** - Except optional Telegram and AI providers
- **Secure Storage** - Uses browser's secure localStorage

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript
- **Styling**: CSS3 with CSS Variables & Custom Fonts
- **State**: React Hooks & Context API
- **Storage**: localStorage with encryption support
- **PWA**: Service Worker with offline support
- **Build**: Create React App with custom configuration
- **AI Integration**: OpenAI & Anthropic APIs with Vercel Edge Functions

### Key Features Implementation
- **Drag & Drop**: HTML5 Drag and Drop API
- **Encryption**: Web Crypto API
- **Biometrics**: WebAuthn API
- **Notifications**: Telegram Bot API
- **Date Handling**: date-fns library
- **AI Proxy**: Vercel Edge Functions for CORS handling

## 🐛 Troubleshooting

### Service Worker Issues
If you experience reload loops on localhost:
1. Visit `http://localhost:3000/clear-sw.html`
2. Or in Chrome DevTools: Application → Storage → Clear site data

### AI Features Not Working
- Ensure you're using the deployed version (not localhost)
- Check your API key is correct
- Verify you have credits with your AI provider

## 🔮 Future Features

- [ ] Multi-device sync via encrypted cloud backup
- [ ] Browser extension for quick access
- [ ] Email notifications support
- [ ] Subscription cost analytics dashboard
- [ ] Budget alerts and spending trends
- [ ] Team sharing with encryption
- [ ] API usage tracking and limits
- [ ] Integration with payment providers
- [ ] Subscription recommendation engine
- [ ] Calendar integration for renewal dates

## 🚀 Deployment

### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Your app will be live with AI features enabled!

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

Note: AI features require serverless function support.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Logo designed with care for the SubAlert brand
- Arinza font for beautiful typography
- Icons from [Lucide](https://lucide.dev/)
- Date handling by [date-fns](https://date-fns.org/)
- Glassmorphic design inspiration
- Built with love for subscription management

---

<p align="center">Made with ❤️ for subscription sanity</p>
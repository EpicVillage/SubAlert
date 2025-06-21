# SubAlert 🔔

A modern subscription and API key tracker with expiry notifications. Never forget to renew your subscriptions or rotate your API keys again!

![SubAlert Preview](https://img.shields.io/badge/PWA-Ready-5A9FD4?style=flat-square&logo=pwa)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=flat-square&logo=react)

## ✨ Features

### Core Features
- 📊 **Dashboard View** - See all your subscriptions at a glance
- 🔍 **Search & Filter** - Find subscriptions quickly by name or category
- 📁 **Custom Categories** - Organize with drag-and-drop categories
- 🎨 **Dark Mode** - Easy on the eyes with automatic theme detection

### Security & Privacy
- 🔐 **Password Protected Exports** - Encrypt your backups with AES-256-GCM
- 🔏 **Biometric Lock** - Fingerprint/Face ID protection on supported devices
- 💾 **Local Storage** - All data stays on your device
- 🔒 **Secure API Storage** - API keys are stored safely

### Notifications & Alerts
- 💬 **Telegram Integration** - Get notified before subscriptions expire
- ⏰ **Smart Reminders** - Customizable notification timing
- 📅 **Expiry Tracking** - Visual indicators for expiring subscriptions

### Data Management
- 📤 **Export/Import** - Backup your data with optional encryption
- 🔄 **Drag & Drop** - Reorganize subscriptions between categories
- ✏️ **Bulk Edit Mode** - Manage multiple items efficiently

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

5. Serve the production build:
```bash
npm install -g serve
serve -s build
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

## 📖 Usage

### Adding a Subscription
1. Click "+ Add" button
2. Fill in the required details:
   - **Service Name** (required)
   - **Category** - Choose from existing or create custom
   - **Subscription Type** - Free or Paid
   - **Associated Email** (optional)
   - **API Key** (optional) - Click + to reveal field
   - For paid subscriptions:
     - **Cost** (required)
     - **Billing Cycle** - Monthly, Yearly, or One-time
     - **Expiry Date** (required for recurring)
3. Click "Add API" to save

### Managing Subscriptions
- **Edit Mode**: Toggle edit mode to show/hide action buttons
- **View/Hide API Keys**: Click the eye icon (👁️)
- **Edit Details**: Click "Edit" button in edit mode
- **Delete**: Click "Delete" with glassmorphic confirmation
- **Search**: Real-time search by service name
- **Filter**: Quick filters for All, Expiring Soon, Paid, Free
- **Drag & Drop**: Reorganize between categories

### Category Management
1. Click "Manage Categories" button
2. Options:
   - **Add Custom Category**: Create with name, color, and emoji
   - **Edit Categories**: Modify any category (including defaults)
   - **Delete Categories**: Remove custom categories
   - **Drag & Drop**: Reorder categories

### Data Backup
- **Export Options**:
  - Standard JSON export
  - Password-protected encrypted export (AES-256-GCM)
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
- **No External APIs** - Except optional Telegram
- **Secure Storage** - Uses browser's secure localStorage

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: CSS3 with CSS Variables
- **State**: React Hooks & Context API
- **Storage**: localStorage with encryption support
- **PWA**: Service Worker with offline support
- **Build**: Create React App with custom configuration

### Key Features Implementation
- **Drag & Drop**: HTML5 Drag and Drop API
- **Encryption**: Web Crypto API
- **Biometrics**: WebAuthn API
- **Notifications**: Telegram Bot API
- **Date Handling**: date-fns library

## 👨‍💻 Development

### Project Structure
```
subalert/
├── public/
│   ├── manifest.json    # PWA manifest
│   └── icons/          # App icons
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript definitions
│   ├── utils/         # Utility functions
│   └── App.tsx        # Main component
└── package.json       # Dependencies
```

### Available Scripts
- `npm start` - Development server
- `npm test` - Run tests
- `npm run build` - Production build
- `npm run eject` - Eject from CRA

### Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🔮 Future Features

- [ ] Multi-device sync via encrypted cloud backup
- [ ] Browser extension for quick access
- [ ] Email notifications support
- [ ] Subscription cost analytics
- [ ] Smart renewal recommendations
- [ ] Team sharing with encryption
- [ ] API usage tracking
- [ ] Integration with payment providers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons from [Lucide](https://lucide.dev/)
- Date handling by [date-fns](https://date-fns.org/)
- Inspired by the need to track too many subscriptions

---

<p align="center">Made with ❤️ for subscription sanity</p>
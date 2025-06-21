# SubAlert Security Guide

## 🔒 Security Overview

SubAlert is designed with privacy-first principles. All your data stays on your device.

### ✅ What We Do Right

1. **100% Local Storage**
   - All data stored in browser localStorage
   - No servers, no cloud, no tracking
   - Your data never leaves your device

2. **No Analytics or Tracking**
   - No Google Analytics
   - No error tracking (Sentry, etc.)
   - No usage metrics
   - Completely private

3. **Encrypted Backups**
   - Optional AES-256-GCM encryption for exports
   - Password never stored

4. **Secure API Proxy**
   - AI API calls go through your own Vercel deployment
   - API keys never exposed to third parties

### ⚠️ Security Considerations

1. **Browser Security**
   - Data is accessible via browser DevTools
   - Use on trusted devices only
   - Clear data when using shared computers

2. **API Key Storage**
   - Keys are base64 encoded (not encrypted) in localStorage
   - Consider using separate API keys for this app
   - Rotate keys regularly

3. **Physical Access**
   - Enable biometric lock for mobile
   - Use device-level security (PIN, password)
   - Don't leave browser open on shared devices

### 🛡️ Best Practices

1. **For Maximum Security:**
   - Use the PWA version (installable app)
   - Enable biometric authentication
   - Use password-protected exports
   - Store backups securely

2. **API Key Management:**
   - Create dedicated API keys for SubAlert
   - Set usage limits on your API keys
   - Monitor usage in your provider dashboards
   - Rotate keys periodically

3. **Device Security:**
   - Keep your browser updated
   - Use on trusted devices only
   - Enable device encryption
   - Use strong device passwords

### 🚨 What to Do If Compromised

1. **Immediately:**
   - Revoke all API keys from provider dashboards
   - Clear browser data for SubAlert
   - Change any related passwords

2. **Prevention:**
   - Regular backups (encrypted)
   - Monitor API usage
   - Use unique API keys per service

### 🔐 Technical Details

- **Encryption:** AES-256-GCM for password exports
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Storage:** HTML5 localStorage (domain-isolated)
- **AI Keys:** Base64 encoded (consider this reversible)

### 📝 Disclaimer

While SubAlert implements security best practices for a client-side application, no system is 100% secure. Users should:
- Understand the risks
- Use additional security measures
- Not store extremely sensitive keys
- Monitor their API usage

For highly sensitive operations, consider using dedicated tools with enhanced security features.
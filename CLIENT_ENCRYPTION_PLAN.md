# Client-Side Encryption Implementation Plan

## 🎯 Overview

Implement full client-side encryption for all sensitive data in SubAlert, making it impossible to access data without the master password.

## 🔑 Key Components

### 1. Master Password System
- User sets master password on first use
- Password never stored (only the derived key)
- Key derivation using PBKDF2 (100k+ iterations)
- Salt stored separately

### 2. Encryption Flow
```
User Password → PBKDF2 → Encryption Key → AES-256-GCM → Encrypted Data → localStorage
```

### 3. What Gets Encrypted
- ✅ All API keys
- ✅ Telegram bot token & chat ID  
- ✅ AI provider API keys
- ✅ Subscription details (optional)
- ❌ Categories (not sensitive)
- ❌ UI preferences (theme, etc.)

## 🏗️ Technical Implementation

### Step 1: Create Encryption Service
```typescript
// utils/encryption.ts
class EncryptionService {
  private key: CryptoKey | null = null;
  private salt: Uint8Array;
  
  async initialize(password: string) {
    // Generate or retrieve salt
    // Derive key from password
    // Store in memory for session
  }
  
  async encrypt(data: string): Promise<string> {
    // Encrypt with AES-256-GCM
  }
  
  async decrypt(encryptedData: string): Promise<string> {
    // Decrypt with stored key
  }
  
  lock() {
    // Clear key from memory
    this.key = null;
  }
}
```

### Step 2: Modify Storage Layer
```typescript
// Before
localStorage.setItem('subalert_apis', JSON.stringify(apis));

// After
const encrypted = await encryptionService.encrypt(JSON.stringify(apis));
localStorage.setItem('subalert_apis_encrypted', encrypted);
```

### Step 3: Add Unlock Screen
- Beautiful unlock screen with password input
- Biometric unlock option (store encrypted key)
- "Forgot Password" - warns about data loss

### Step 4: Session Management
- Auto-lock after 5-15 minutes (configurable)
- Lock on browser minimize (optional)
- Clear sensitive data from memory on lock

## 🎨 User Experience

### First Time Setup
1. Welcome screen explains encryption
2. User creates master password
3. Optional: Enable biometric unlock
4. App ready to use

### Daily Use
1. Open app → Unlock screen
2. Enter password or use biometric
3. App unlocked for session
4. Auto-locks when inactive

### Password Change
1. Enter current password
2. Enter new password
3. Re-encrypt all data with new key
4. Update biometric if enabled

## 🚧 Challenges & Solutions

### Challenge 1: Forgot Password
**Solution**: No recovery possible (true zero-knowledge)
- Clear warning during setup
- Option to export unencrypted backup
- Password hints (stored encrypted)

### Challenge 2: Performance
**Solution**: Smart caching
- Decrypt once per session
- Keep decrypted in memory while unlocked
- Only re-encrypt on changes

### Challenge 3: Migration
**Solution**: Gradual migration
- Detect unencrypted data
- Prompt to enable encryption
- One-time migration process

## 📊 Effort Estimate

### Development Time: 2-3 days

1. **Encryption Service** (4-6 hours)
   - Key derivation
   - Encrypt/decrypt functions
   - Session management

2. **Storage Layer Updates** (3-4 hours)
   - Update all storage functions
   - Migration logic
   - Backward compatibility

3. **UI Components** (4-6 hours)
   - Unlock screen
   - Setup wizard
   - Settings management

4. **Testing & Polish** (4-6 hours)
   - Edge cases
   - Performance optimization
   - UX improvements

## 🔒 Security Benefits

1. **Zero-Knowledge**: Even with full device access, data is useless without password
2. **Protection Against**:
   - Physical device access
   - Browser extension malware
   - JavaScript injection
   - localStorage dumps
3. **Compliance**: Better for users with compliance requirements

## ⚡ Quick Win Alternative

If full encryption seems like too much, here's a quicker option (1-2 hours):

### API Key Encryption Only
- Encrypt just the sensitive fields (API keys, tokens)
- Use a simple PIN (4-6 digits)
- Less secure but better than base64

```typescript
// Quick implementation
const encryptApiKey = async (key: string, pin: string) => {
  // Simple encryption with PIN as key
};
```

## 🤔 Should You Do It?

### Yes if:
- You store very sensitive API keys
- You use shared computers
- You want maximum security
- You're willing to remember one more password

### Maybe not if:
- You only store low-risk API keys
- You always use trusted devices
- You want simplicity over security
- You frequently clear browser data

## 📝 Next Steps

1. Decide on approach (full or quick)
2. Create unlock UI mockups
3. Implement encryption service
4. Update storage layer
5. Add migration logic
6. Test thoroughly
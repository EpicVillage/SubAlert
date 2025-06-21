// Simple encryption/decryption for password-protected exports
export const crypto = {
  // Generate a random salt
  generateSalt(): string {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode.apply(null, Array.from(salt)));
  },

  // Hash a password with salt
  async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer))));
  },
  // Encrypt data with password
  async encrypt(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Derive a key from password
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Generate an IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );
    
    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  },

  // Decrypt data with password
  async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      
      // Derive the key from password
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        data
      );
      
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }
};
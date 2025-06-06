import CryptoJS from 'crypto-js';

export class AESEncrypt {
  private static readonly SECRET_KEY = 'geo-wander-share-key-2024';
  
  /**
   * Encrypt data to Base64 encoded string
   */
  static encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
      // URL-safe Base64 encoding
      return btoa(encrypted).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt Base64 encoded string to original data
   */
  static decrypt(encryptedData: string): string {
    try {
      // Restore Base64 padding and characters
      let base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }
      
      const decryptedBase64 = atob(base64);
      const bytes = CryptoJS.AES.decrypt(decryptedBase64, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt data');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt object to Base64 encoded string
   */
  static encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt Base64 encoded string to object
   */
  static decryptObject<T = any>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}

import * as crypto from 'crypto';

export class AESEncrypt {
  private static readonly SECRET_KEY = 'geo-wander-share-key-2024';
  private static readonly ALGORITHM = 'aes-256-cbc';
  
  /**
   * Generate a key from the secret key
   */
  private static getKey(): Buffer {
    return crypto.createHash('sha256').update(this.SECRET_KEY).digest();
  }

  /**
   * Encrypt data to Base64 encoded string
   */
  static encrypt(data: string): string {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.SECRET_KEY);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // URL-safe Base64 encoding
      return Buffer.from(encrypted).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
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
      
      const encrypted = Buffer.from(base64, 'base64').toString('base64');
      const decipher = crypto.createDecipher('aes-256-cbc', this.SECRET_KEY);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
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
